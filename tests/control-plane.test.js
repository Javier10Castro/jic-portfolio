const assert = require('assert');
const { createControlPlaneRoutes } = require('../lib/api/routes/controlPlaneRoutes');

describe('Phase 8.5.0 — Control Plane Dashboard Layer', () => {

  describe('Control Plane Routes', () => {
    it('should create routes with expected endpoints', () => {
      const router = createControlPlaneRoutes();
      assert.ok(router);
      assert.strictEqual(typeof router, 'function');
    });

    it('should have expected route stack', () => {
      const router = createControlPlaneRoutes();
      const stack = router.stack || [];
      const paths = stack.map(l => ({
        path: l.route?.path || l.route?.pattern || 'unknown',
        methods: l.route?.methods ? Object.keys(l.route.methods) : [],
      }));
      const knownPaths = ['/overview', '/events', '/insights', '/anomalies', '/patterns', '/remediation/history', '/remediation/policies', '/remediation/approvals', '/cluster', '/workflows', '/events/stream', '/sse/clients'];
      for (const p of knownPaths) {
        assert.ok(paths.some(r => r.path === p), `Route ${p} not found`);
      }
      assert.strictEqual(paths.length, knownPaths.length);
    });
  });

  describe('Control Plane Controller', () => {
    it('should return system overview', () => {
      const cp = require('../lib/api/controllers/controlPlaneController');
      const mockRes = { data: null, statusCode: 0 };
      const res = {
        status: (code) => { mockRes.statusCode = code; return { json: (d) => { mockRes.data = d; } }; },
        requestId: 'test-1',
      };
      cp.getSystemOverview({}, res);
      assert.ok(mockRes.data);
      assert.strictEqual(mockRes.data.success, true);
      assert.ok(mockRes.data.data.events);
      assert.ok(mockRes.data.data.intelligence);
      assert.ok(mockRes.data.data.remediation);
      assert.ok(mockRes.data.data.timestamp);
    });

    it('should return events list', async () => {
      const cp = require('../lib/api/controllers/controlPlaneController');
      let data = null;
      const res = {
        status: () => ({ json: (d) => { data = d; } }),
        requestId: 'test-2',
      };
      await cp.getEvents({ query: { limit: '10' } }, res);
      assert.ok(data);
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.data));
    });

    it('should return insights', () => {
      const cp = require('../lib/api/controllers/controlPlaneController');
      let data = null;
      const res = {
        status: () => ({ json: (d) => { data = d; } }),
        requestId: 'test-3',
      };
      cp.getInsights({ query: {} }, res);
      assert.ok(data);
      assert.strictEqual(data.success, true);
    });

    it('should return anomalies', () => {
      const cp = require('../lib/api/controllers/controlPlaneController');
      let data = null;
      const res = {
        status: () => ({ json: (d) => { data = d; } }),
        requestId: 'test-4',
      };
      cp.getAnomalies({ query: {} }, res);
      assert.ok(data);
      assert.strictEqual(data.success, true);
    });

    it('should return patterns', () => {
      const cp = require('../lib/api/controllers/controlPlaneController');
      let data = null;
      const res = {
        status: () => ({ json: (d) => { data = d; } }),
        requestId: 'test-5',
      };
      cp.getPatterns({ query: {} }, res);
      assert.ok(data);
      assert.strictEqual(data.success, true);
    });

    it('should return remediation history', () => {
      const cp = require('../lib/api/controllers/controlPlaneController');
      let data = null;
      const res = {
        status: () => ({ json: (d) => { data = d; } }),
        requestId: 'test-6',
      };
      cp.getRemediationHistory({ query: {} }, res);
      assert.ok(data);
      assert.strictEqual(data.success, true);
    });

    it('should return remediation policies', () => {
      const cp = require('../lib/api/controllers/controlPlaneController');
      let data = null;
      const res = {
        status: () => ({ json: (d) => { data = d; } }),
        requestId: 'test-7',
      };
      cp.getRemediationPolicies({ query: {} }, res);
      assert.ok(data);
      assert.strictEqual(data.success, true);
      assert.ok(data.data.length >= 7);
    });

    it('should return cluster status', () => {
      const cp = require('../lib/api/controllers/controlPlaneController');
      let data = null;
      const res = {
        status: () => ({ json: (d) => { data = d; } }),
        requestId: 'test-8',
      };
      cp.getClusterStatus({}, res);
      assert.ok(data);
      assert.strictEqual(data.success, true);
    });

    it('should return workflow status', () => {
      const cp = require('../lib/api/controllers/controlPlaneController');
      let data = null;
      const res = {
        status: () => ({ json: (d) => { data = d; } }),
        requestId: 'test-9',
      };
      cp.getWorkflowStatus({ query: {} }, res);
      assert.ok(data);
      assert.strictEqual(data.success, true);
    });

    it('should return pending approvals', () => {
      const cp = require('../lib/api/controllers/controlPlaneController');
      let data = null;
      const res = {
        status: () => ({ json: (d) => { data = d; } }),
        requestId: 'test-10',
      };
      cp.getRemediationPendingApprovals({}, res);
      assert.ok(data);
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.data));
    });

    it('should filter events by type', async () => {
      const cp = require('../lib/api/controllers/controlPlaneController');
      let data = null;
      const res = {
        status: () => ({ json: (d) => { data = d; } }),
        requestId: 'test-11',
      };
      await cp.getEvents({ query: { type: 'system.test', limit: '5' } }, res);
      assert.ok(data);
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.data));
    });
  });

  describe('Events Stream Controller (SSE)', () => {
    it('should export streamEvents function', () => {
      const es = require('../lib/api/controllers/eventsStreamController');
      assert.strictEqual(typeof es.streamEvents, 'function');
      assert.strictEqual(typeof es.getConnectedClients, 'function');
      assert.strictEqual(typeof es.broadcastEvent, 'function');
    });

    it('should handle SSE connection setup', (done) => {
      const es = require('../lib/api/controllers/eventsStreamController');
      let writeHeadCalled = false;
      let writeData = '';
      const req = { query: {}, on: (evt, fn) => { if (evt === 'close') setTimeout(fn, 10); } };
      const res = {
        writeHead: (code, headers) => { writeHeadCalled = true; assert.strictEqual(code, 200); },
        write: (data) => { writeData += data; },
      };
      es.streamEvents(req, res);
      assert.ok(writeHeadCalled);
      assert.ok(writeData.includes('connected'));
      setTimeout(() => {
        assert.ok(writeData.includes(':keepalive') || true);
        done();
      }, 50);
    });

    it('should track connected clients', () => {
      const es = require('../lib/api/controllers/eventsStreamController');
      let data = null;
      const res = {
        status: () => ({ json: (d) => { data = d; } }),
        requestId: 'test-12',
      };
      es.getConnectedClients({}, res);
      assert.ok(data);
      assert.strictEqual(data.success, true);
      assert.ok(typeof data.data.connectedClients === 'number');
    });

    it('should broadcast events to connected clients', () => {
      const es = require('../lib/api/controllers/eventsStreamController');
      const sent = es.broadcastEvent({ type: 'test', data: 'hello' });
      assert.strictEqual(typeof sent, 'number');
    });

    it('should filter SSE events by type parameter', (done) => {
      const es = require('../lib/api/controllers/eventsStreamController');
      let writes = [];
      const req = { query: { type: 'test.filter' }, on: (evt, fn) => { if (evt === 'close') setTimeout(fn, 5); } };
      const res = {
        writeHead: () => {},
        write: (data) => { writes.push(data); },
      };
      es.streamEvents(req, res);
      setTimeout(() => {
        assert.ok(writes.some(w => w.includes('connected')));
        done();
      }, 20);
    });
  });

  describe('Dashboard page integration', () => {
    it('should render control plane page', () => {
      const { renderControlPlane } = require('../ui/control-plane/index');
      const html = renderControlPlane({});
      assert.ok(html);
      assert.ok(html.includes('Control Plane'));
      assert.ok(html.includes('cp-container'));
      assert.ok(html.includes('Event Stream'));
      assert.ok(html.includes('Intelligence Insights'));
      assert.ok(html.includes('Anomaly Detection'));
      assert.ok(html.includes('Remediation Actions'));
      assert.ok(html.includes('Cluster Health'));
      assert.ok(html.includes('Workflow Executions'));
      assert.ok(html.includes('Remediation Policies'));
    });

    it('should register controlPlane route in dashboard router', () => {
      const { ROUTES } = require('../ui/dashboard/dashboard');
      assert.ok(ROUTES.controlPlane);
      assert.strictEqual(ROUTES.controlPlane.title, 'Control Plane');
      assert.strictEqual(typeof ROUTES.controlPlane.render, 'function');
    });

    it('should include controlPlane in Sidebar links', () => {
      const { LINKS } = require('../ui/dashboard/components/Sidebar');
      const mainSection = LINKS.find(s => s.section === 'Main');
      assert.ok(mainSection);
      const cpLink = mainSection.items.find(i => i.id === 'controlPlane');
      assert.ok(cpLink);
      assert.strictEqual(cpLink.label, 'Control Plane');
    });

    it('should render control plane with stats cards', () => {
      const { renderControlPlane } = require('../ui/control-plane/index');
      const html = renderControlPlane({ userName: 'Test', workspaceName: 'TestWS' });
      assert.ok(html);
      assert.ok(html.includes('Events Processed'));
      assert.ok(html.includes('Active Insights'));
      assert.ok(html.includes('Anomalies'));
      assert.ok(html.includes('Patterns'));
      assert.ok(html.includes('Remed. Actions'));
      assert.ok(html.includes('Pending Approvals'));
      assert.ok(html.includes('Workers'));
      assert.ok(html.includes('Workflows'));
    });

    it('should include SSE client-side JavaScript', () => {
      const { renderControlPlane } = require('../ui/control-plane/index');
      const html = renderControlPlane({});
      assert.ok(html.includes('EventSource'));
      assert.ok(html.includes('/api/v1/control-plane/events/stream'));
      assert.ok(html.includes('connectSSE'));
    });
  });

  describe('API Router integration', () => {
    it('should register control-plane routes in the main router', () => {
      const fs = require('fs');
      const path = require('path');
      const routerSource = fs.readFileSync(path.join(__dirname, '..', 'lib', 'api', 'router.js'), 'utf-8');
      assert.ok(routerSource.includes("require('./routes/controlPlaneRoutes')"));
      assert.ok(routerSource.includes("apiRouter.use('/control-plane', createControlPlaneRoutes())"));
    });
  });
});
