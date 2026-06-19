function formatForProvider(prompt, provider, options = {}) {
  switch (provider) {
    case 'openai':
      return formatOpenAI(prompt, options);
    case 'anthropic':
      return formatAnthropic(prompt, options);
    case 'gemini':
      return formatGemini(prompt, options);
    case 'ollama':
      return formatOllama(prompt, options);
    default:
      return prompt;
  }
}

function formatOpenAI(prompt, options) {
  if (Array.isArray(prompt)) return prompt;
  const systemMsg = options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : [];
  return [...systemMsg, ...buildMessages(prompt)];
}

function formatAnthropic(prompt, options) {
  if (Array.isArray(prompt)) return prompt;
  const messages = buildMessages(prompt);
  if (options.systemPrompt) {
    return [{ role: 'user', content: `${options.systemPrompt}\n\n${messages[0]?.content || ''}` }];
  }
  return messages;
}

function formatGemini(prompt, options) {
  if (Array.isArray(prompt)) return prompt;
  return buildMessages(prompt);
}

function formatOllama(prompt, options) {
  if (typeof prompt === 'string') return prompt;
  if (Array.isArray(prompt)) return prompt.map(m => m.content || m.text || '').join('\n');
  return String(prompt);
}

function buildMessages(prompt) {
  if (typeof prompt === 'string') return [{ role: 'user', content: prompt }];
  if (Array.isArray(prompt)) return prompt;
  return [{ role: 'user', content: JSON.stringify(prompt) }];
}

function addSystemPrompt(messages, systemPrompt) {
  if (!systemPrompt) return messages;
  const msgs = Array.isArray(messages) ? [...messages] : [{ role: 'user', content: String(messages) }];
  if (msgs[0]?.role === 'system') {
    msgs[0] = { ...msgs[0], content: `${systemPrompt}\n\n${msgs[0].content}` };
  } else {
    msgs.unshift({ role: 'system', content: systemPrompt });
  }
  return msgs;
}

module.exports = { formatForProvider, addSystemPrompt };
