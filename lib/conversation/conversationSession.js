function createSession({ projectId, workspaceId, metadata }) {
  return {
    id: `conv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    projectId: projectId || null,
    workspaceId: workspaceId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
    metadata: metadata || {
      title: 'New Conversation',
      tags: [],
      source: 'manual',
    },
    summary: null,
    context: {
      currentIntent: null,
      detectedEntities: [],
      pendingQuestions: [],
      answeredQuestions: [],
      contextVariables: {},
    },
    status: 'active',
  };
}

function updateSessionTimestamps(session) {
  session.updatedAt = new Date().toISOString();
}

module.exports = { createSession, updateSessionTimestamps };
