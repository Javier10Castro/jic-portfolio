const { renderFullPage } = require('../ui/dashboard/dashboard');

module.exports = async (req, res) => {
  const params = {
    page: req.query.page || 'home',
    workspaceId: req.query.workspaceId || null,
    userId: req.query.userId || null,
    projectId: req.query.projectId || null,
    organizationId: req.query.organizationId || null,
    status: req.query.status || null,
    search: req.query.search || null,
    view: req.query.view || 'grid',
    resource: req.query.resource || null,
    actor: req.query.actor || null,
    limit: parseInt(req.query.limit) || null,
    notificationCount: 0,
  };

  try {
    const html = renderFullPage(params);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (err) {
    res.status(500).json({ error: 'Dashboard render failed', message: err.message });
  }
};
