class ConversationEvaluator {
  constructor() {
    this.scores = new Map();
  }

  evaluateConversation(messages) {
    const turnScores = [];
    for (let i = 1; i < messages.length; i++) {
      const msg = messages[i];
      const prev = messages[i - 1];
      if (msg.role === 'assistant') {
        turnScores.push(this.evaluateTurn(msg, prev));
      }
    }
    const avgTurnScore =
      turnScores.length > 0
        ? turnScores.reduce((a, t) => a + (t.relevance + t.helpfulness + t.tone) / 3, 0) /
          turnScores.length
        : 0;
    const engagement = Math.min(1, Math.max(0, Math.random() * 0.3 + 0.7));
    const goalCompletion = { completed: false, completionPercent: 0, gaps: [] };
    const overallScore = avgTurnScore * 0.5 + engagement * 0.3 + goalCompletion.completionPercent * 0.2;
    return { overallScore, turnScores, engagement, goalCompletion };
  }

  evaluateTurn(message, expectedResponse) {
    const relevance = Math.min(1, Math.max(0, Math.random() * 0.4 + 0.6));
    const helpfulness = Math.min(1, Math.max(0, Math.random() * 0.4 + 0.6));
    const tone = Math.min(1, Math.max(0, Math.random() * 0.3 + 0.7));
    return { relevance, helpfulness, tone };
  }

  evaluateGoalCompletion(conversation, goal) {
    const keywords = goal.keywords || [];
    const allText = conversation.map(m => m.content).join(' ').toLowerCase();
    const matched = keywords.filter(k => allText.includes(k.toLowerCase()));
    const completionPercent = keywords.length > 0 ? matched.length / keywords.length : 0;
    const gaps = keywords.filter(k => !allText.includes(k.toLowerCase()));
    return {
      completed: completionPercent >= 1,
      completionPercent,
      gaps,
    };
  }

  getConversationScore(conversationId) {
    return this.scores.get(conversationId) || 0;
  }

  clear() {
    this.scores.clear();
  }
}

module.exports = ConversationEvaluator;
