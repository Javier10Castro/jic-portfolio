window.DASHBOARD_API = (() => {
  const CTX = (() => {
    try { return JSON.parse(localStorage.getItem('dashCtx') || '{}'); } catch { return {}; }
  })();

  function saveCtx() { localStorage.setItem('dashCtx', JSON.stringify(CTX)); }

  function ctx() { return { workspace_id: CTX.workspace_id, user_id: CTX.user_id }; }

  function qs(params) {
    return Object.entries({ ...params }).filter(([, v]) => v != null).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  }

  const _subscriptions = {};
  let _subIdCounter = 0;

  const api = {
    setContext(w, u) { CTX.workspace_id = w; CTX.user_id = u; saveCtx(); return api; },
    getContext() { return { ...CTX }; },
    isReady() { return !!(CTX.workspace_id && CTX.user_id); },

    async get(endpoint, params = {}) {
      const p = { ...params, ...ctx() };
      const r = await fetch(`/api/v1${endpoint}${qs(p) ? '?' + qs(p) : ''}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },

    async post(endpoint, body = {}) {
      const r = await fetch(`/api/v1${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, ...ctx() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },

    listProjects(limit, offset) { return api.get('/projects', { limit, offset }); },
    getProject(id, include) { return api.get(`/projects/${id}`, { include }); },
    createProject(name, formData, runPipeline) { return api.post('/projects/create', { name, formData, run_pipeline: runPipeline }); },
    runPipeline(id, formData) { return api.post(`/projects/${id}/run`, { formData }); },
    approveProject(id) { return api.post(`/projects/${id}/approve`, {}); },
    getPreview(id, format, version) { return api.get(`/projects/${id}/preview`, { format, version }); },
    getExecution(id) { return api.get(`/executions/${id}`); },

    pollProject(id, onData, interval = 3000) {
      let stopped = false;
      const poll = async () => {
        while (!stopped) {
          try {
            const d = await api.getProject(id, 'inputs,previews,states,decisions');
            if (onData(d, stop)) return;
          } catch { /* retry */ }
          await new Promise(r => setTimeout(r, interval));
        }
      };
      const stop = () => { stopped = true; };
      poll();
      return stop;
    },

    pollExecution(id, onData, interval = 2000) {
      let stopped = false;
      const poll = async () => {
        while (!stopped) {
          try {
            const d = await api.getExecution(id);
            if (onData(d, stop)) return;
          } catch { /* retry */ }
          await new Promise(r => setTimeout(r, interval));
        }
      };
      const stop = () => { stopped = true; };
      poll();
      return stop;
    },

    subscribeToProjectEvents(projectId, callbacks) {
      const subId = ++_subIdCounter;
      const merged = typeof callbacks === 'function' ? { onEvent: callbacks } : callbacks;
      const { onEvent, onPipelineStep, onScoring, onDeployment, onError } = merged;

      let active = true;
      let es = null;
      let pollStop = null;
      let lastKnownState = null;

      function handleEvent(eventData) {
        if (!active) return;
        if (onEvent) onEvent(eventData);
        const evt = eventData.event || eventData.type;
        if (evt === 'plan.completed' && onPipelineStep) onPipelineStep('plan', eventData);
        if (evt === 'design.completed' && onPipelineStep) onPipelineStep('design_system', eventData);
        if (evt === 'preview.generated' && onPipelineStep) onPipelineStep('preview', eventData);
        if (evt === 'scoring.completed') {
          if (onPipelineStep) onPipelineStep('scoring', eventData);
          if (onScoring) onScoring(eventData.payload || eventData);
        }
        if ((evt === 'deployment.completed' || evt === 'deployment.started') && onDeployment) onDeployment(eventData);
        if (evt === 'pipeline.failed' && onError) onError(eventData);
        if (evt === 'project.created' && onPipelineStep) onPipelineStep('created', eventData);
      }

      function startSSE() {
        const p = { ...ctx(), project_id: projectId };
        const url = `/api/v1/events/stream?${qs(p)}`;
        try {
          es = new EventSource(url);
          es.onmessage = (e) => {
            try { handleEvent(JSON.parse(e.data)); } catch {}
          };
          es.addEventListener('error', () => {
            es.close();
            es = null;
            if (active) fallbackToPolling();
          });
          es.onopen = () => {
            if (pollStop) { pollStop(); pollStop = null; }
          };
        } catch {
          if (active) fallbackToPolling();
        }
      }

      function startPollEvents() {
        let lastTs = new Date(0).toISOString();
        pollStop = api.poll(15000, async () => {
          if (!active) return;
          try {
            const p = { ...ctx(), project_id: projectId, since: lastTs, poll: '1' };
            const r = await fetch(`/api/v1/events/stream?${qs(p)}`);
            const d = await r.json();
            if (d.events && d.events.length) {
              for (const evt of d.events) {
                lastTs = evt.created_at;
                const payload = typeof evt.payload === 'string' ? JSON.parse(evt.payload) : evt.payload;
                handleEvent({ event: evt.event_type, project_id: evt.project_id, execution_id: evt.execution_id, timestamp: evt.created_at, payload });
              }
            }
          } catch {}
        });
      }

      function fallbackToPolling() {
        if (pollStop) return;
        if (lastKnownState !== 'processing' && lastKnownState !== 'deploying') {
          pollStop = api.pollProject(projectId, (data) => {
            lastKnownState = data.project.status;
            handleEvent({ event: 'poll.update', project_id: projectId, payload: data });
            return false;
          }, 3000);
        }
      }

      startSSE();
      setTimeout(() => {
        if (active && !es && !pollStop) startPollEvents();
      }, 3000);

      _subscriptions[subId] = { projectId, active: () => active, stop: () => {
        active = false;
        if (es) { es.close(); es = null; }
        if (pollStop) { pollStop(); pollStop = null; }
        delete _subscriptions[subId];
      }};
      return subId;
    },

    subscribeToWorkspaceEvents(workspaceId, onEvent) {
      const subId = ++_subIdCounter;
      let active = true;
      let es = null;

      function startSSE() {
        const p = { ...ctx(), workspace_id: workspaceId };
        const url = `/api/v1/events/stream?${qs(p)}`;
        try {
          es = new EventSource(url);
          es.onmessage = (e) => {
            try { if (active) onEvent(JSON.parse(e.data)); } catch {}
          };
          es.addEventListener('error', () => { es.close(); if (active) setTimeout(startSSE, 5000); });
        } catch { setTimeout(startSSE, 5000); }
      }

      startSSE();

      _subscriptions[subId] = { workspaceId, active: () => active, stop: () => {
        active = false;
        if (es) { es.close(); es = null; }
        delete _subscriptions[subId];
      }};
      return subId;
    },

    unsubscribe(subId) {
      const sub = _subscriptions[subId];
      if (sub) sub.stop();
    },

    unsubscribeAll() {
      for (const id of Object.keys(_subscriptions)) {
        _subscriptions[id].stop();
      }
    },

    poll(interval, fn) {
      let stopped = false;
      const loop = async () => {
        while (!stopped) {
          await fn();
          await new Promise(r => setTimeout(r, interval));
        }
      };
      const stop = () => { stopped = true; };
      loop();
      return stop;
    },
  };

  return api;
})();
