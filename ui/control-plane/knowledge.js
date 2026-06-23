(function() {
  const KnowledgeCenter = {
    currentTab: 'overview',
    data: null,

    switchTab(tab) {
      this.currentTab = tab;
      this.render();
    },

    render() {
      const container = document.getElementById('knowledge-center');
      if (!container) return;
      container.innerHTML = this.renderTabs() + this.renderContent();
    },

    renderTabs() {
      const tabs = ['overview', 'knowledge-graph', 'patterns', 'recommendations', 'lessons-learned', 'best-practices', 'similar-projects', 'search'];
      return '<div class="knowledge-tabs">' + tabs.map(t => '<button class="knowledge-tab' + (t === this.currentTab ? ' active' : '') + '" onclick="KnowledgeCenter.switchTab(\'' + t + '\')">' + t.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + '</button>').join('') + '</div>';
    },

    renderContent() {
      const content = {
        overview: '<div class="knowledge-widgets">' + this.widgets.overview() + '</div>',
        'knowledge-graph': '<div class="knowledge-widgets">' + this.widgets.knowledgeGraph() + '</div>',
        'patterns': '<div class="knowledge-widgets">' + this.widgets.patterns() + '</div>',
        'recommendations': '<div class="knowledge-widgets">' + this.widgets.recommendations() + '</div>',
        'lessons-learned': '<div class="knowledge-widgets">' + this.widgets.lessonsLearned() + '</div>',
        'best-practices': '<div class="knowledge-widgets">' + this.widgets.bestPractices() + '</div>',
        'similar-projects': '<div class="knowledge-widgets">' + this.widgets.similarProjects() + '</div>',
        'search': '<div class="knowledge-widgets">' + this.widgets.search() + '</div>'
      };
      return '<div class="knowledge-content">' + (content[this.currentTab] || content.overview) + '</div>';
    },

    widgets: {
      overview() {
        return '<div class="knowledge-card"><h3>Knowledge Size</h3><div class="knowledge-metric">2.4K</div><div class="knowledge-label">entries total</div></div>' +
          '<div class="knowledge-card"><h3>Entities</h3><div class="knowledge-metric">847</div><div class="knowledge-label">registered entities</div></div>' +
          '<div class="knowledge-card"><h3>Relationships</h3><div class="knowledge-metric">1,892</div><div class="knowledge-label">graph connections</div></div>' +
          '<div class="knowledge-card"><h3>Pattern Discovery</h3><div class="knowledge-metric">134</div><div class="knowledge-label">patterns found</div></div>' +
          '<div class="knowledge-card"><h3>Recommendations</h3><div class="knowledge-metric">56</div><div class="knowledge-label">active recommendations</div></div>' +
          '<div class="knowledge-card"><h3>Lessons Learned</h3><div class="knowledge-metric">42</div><div class="knowledge-label">documented lessons</div></div>' +
          '<div class="knowledge-card"><h3>Graph Health</h3><div class="knowledge-metric">96%</div><div class="knowledge-label">connectedness score</div></div>' +
          '<div class="knowledge-card"><h3>Knowledge Growth</h3><div class="knowledge-metric">+18%</div><div class="knowledge-label">this quarter</div></div>';
      },
      knowledgeGraph() {
        return '<div class="knowledge-card"><h3>Graph Overview</h3><p>Nodes: 847</p><p>Edges: 1,892</p><p>Components: 3</p><p>Avg degree: 4.5</p></div>' +
          '<div class="knowledge-card"><h3>Entity Types</h3><p>Projects: 42</p><p>Services: 156</p><p>Workflows: 89</p><p>Deployments: 234</p><p>Incidents: 67</p></div>' +
          '<div class="knowledge-card"><h3>Recent Versions</h3><p>v3.2.1 - 2026-06-15</p><p>v3.2.0 - 2026-06-01</p><p>v3.1.0 - 2026-05-15</p><p>v3.0.0 - 2026-05-01</p></div>';
      },
      patterns() {
        return '<div class="knowledge-card"><h3>Pattern Discovery</h3><p>Total patterns: 134</p><p>Confirmed: 98</p><p>Candidate: 36</p></div>' +
          '<div class="knowledge-card"><h3>Best Practices</h3><p>Extracted: 45</p><p>Adoption rate: 72%</p><p>Top: Microservices decomposition</p></div>' +
          '<div class="knowledge-card"><h3>Anti-Patterns</h3><p>Detected: 23</p><p>Critical: 5</p><p>Common: Monolithic dependency</p></div>';
      },
      recommendations() {
        return '<div class="knowledge-card"><h3>Architecture</h3><p>Active: 22</p><p>Applied: 15</p><p>Pending: 7</p></div>' +
          '<div class="knowledge-card"><h3>Workflow</h3><p>Optimizations: 18</p><p>Automated: 12</p><p>Manual: 6</p></div>' +
          '<div class="knowledge-card"><h3>Optimization</h3><p>Cost savings: $3.2K/mo</p><p>Performance gain: 34%</p><p>Resource reduction: 28%</p></div>';
      },
      lessonsLearned() {
        return '<div class="knowledge-card"><h3>Recent Lessons</h3><p>Use circuit breakers for external APIs</p><p>Always validate input at service boundary</p><p>Prefer async communication for cross-team workflows</p><p>Implement gradual rollouts for critical changes</p></div>' +
          '<div class="knowledge-card"><h3>Categories</h3><p>Architecture: 14</p><p>Security: 8</p><p>Performance: 10</p><p>Process: 6</p><p>Deployment: 4</p></div>' +
          '<div class="knowledge-card"><h3>Status</h3><p>Published: 35</p><p>Draft: 5</p><p>Validated: 2</p></div>';
      },
      bestPractices() {
        return '<div class="knowledge-card"><h3>Top Practices</h3><p>1. Use API versioning from day 1</p><p>2. Implement structured logging</p><p>3. Use feature flags for gradual rollouts</p><p>4. Automate deployment pipelines</p><p>5. Monitor all service dependencies</p></div>' +
          '<div class="knowledge-card"><h3>By Domain</h3><p>Architecture: 12</p><p>Security: 8</p><p>Performance: 7</p><p>Reliability: 6</p><p>Cost: 5</p></div>' +
          '<div class="knowledge-card"><h3>Confidence</h3><p>High (80-100%): 28</p><p>Medium (50-79%): 12</p><p>Low (below 50%): 5</p></div>';
      },
      similarProjects() {
        return '<div class="knowledge-card"><h3>Similarity Search</h3><input type="text" class="knowledge-input" placeholder="Enter project ID or features..." /><button class="knowledge-btn" onclick="alert(\'Similarity search triggered\')">Find Similar</button></div>' +
          '<div class="knowledge-card"><h3>Top Matches</h3><p>Project A: 92% match</p><p>Project B: 85% match</p><p>Project C: 78% match</p><p>Project D: 71% match</p></div>' +
          '<div class="knowledge-card"><h3>Common Patterns</h3><p>Shared architecture: Microservices</p><p>Common stack: Node.js + React</p><p>Similar scale: 10-50 services</p></div>';
      },
      search() {
        return '<div class="knowledge-card"><h3>Knowledge Search</h3><input type="text" class="knowledge-input" style="width:80%" placeholder="Search knowledge base..." /><button class="knowledge-btn" onclick="alert(\'Search triggered\')">Search</button></div>' +
          '<div class="knowledge-card"><h3>Recent Queries</h3><p>"deployment best practices" - 12 results</p><p>"incident response pattern" - 8 results</p><p>"cost optimization workflow" - 6 results</p><p>"microservices anti-pattern" - 15 results</p></div>' +
          '<div class="knowledge-card"><h3>Facets</h3><p>By source: Architecture (45), Workflow (32), Deployment (28)</p><p>By type: Pattern (134), Lesson (42), Case (67)</p></div>';
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { KnowledgeCenter };
  } else {
    window.KnowledgeCenter = KnowledgeCenter;
  }
})();
