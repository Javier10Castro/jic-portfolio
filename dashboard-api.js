window.DASHBOARD_API = (() => {
  const CTX = (() => {
    try { return JSON.parse(localStorage.getItem('dashCtx') || '{}'); } catch { return {}; }
  })();

  function saveCtx() { localStorage.setItem('dashCtx', JSON.stringify(CTX)); }

  function ctx() { return { workspace_id: CTX.workspace_id, user_id: CTX.user_id }; }

  const api = {
    setContext(w, u) { CTX.workspace_id = w; CTX.user_id = u; saveCtx(); return api; },
    getContext() { return { ...CTX }; },
    isReady() { return !!(CTX.workspace_id && CTX.user_id); },

    async get(endpoint, params = {}) {
      const p = { ...params, ...ctx() };
      const qs = Object.entries(p).filter(([, v]) => v != null).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
      const r = await fetch(`/api/v1${endpoint}${qs ? '?' + qs : ''}`);
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
  };

  return api;
})();
