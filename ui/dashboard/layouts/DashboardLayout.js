const { Sidebar } = require('../components/Sidebar');
const { Topbar } = require('../components/Topbar');

function DashboardLayout({ activePage, pageTitle, breadcrumbs, userName, workspaceName, notificationCount, children }) {
  return `
    <div class="dashboard">
      ${Sidebar({ activePage, workspaceName })}
      <main class="dashboard-main" role="main">
        ${Topbar({ breadcrumbs, userName, notificationCount })}
        <div class="dashboard-content">
          ${pageTitle ? `
            <div class="page-header">
              <h1>${pageTitle}</h1>
            </div>
          ` : ''}
          ${children || ''}
        </div>
      </main>
    </div>
  `;
}

module.exports = { DashboardLayout };
