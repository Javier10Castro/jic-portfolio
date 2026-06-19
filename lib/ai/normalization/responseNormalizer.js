function normalize(raw, provider, model) {
  if (!raw) return createEmpty(provider, model);

  if (raw.text !== undefined && raw.provider !== undefined) {
    return {
      text: raw.text,
      model: raw.model || model || 'unknown',
      provider: raw.provider || provider || 'unknown',
      usage: {
        inputTokens: raw.usage?.inputTokens || 0,
        outputTokens: raw.usage?.outputTokens || 0,
      },
      latency: raw.latency || 0,
      streamed: raw.streamed || false,
      chunks: raw.chunks || null,
      simulated: raw.simulated || false,
    };
  }

  if (raw.choices || raw.candidates || raw.content) {
    return normalizeAPIResponse(raw, provider, model);
  }

  if (typeof raw === 'string') {
    return {
      text: raw,
      model: model || 'unknown',
      provider: provider || 'unknown',
      usage: { inputTokens: 0, outputTokens: 0 },
      latency: 0,
      streamed: false,
      chunks: null,
      simulated: false,
    };
  }

  return {
    text: JSON.stringify(raw),
    model: model || 'unknown',
    provider: provider || 'unknown',
    usage: { inputTokens: 0, outputTokens: 0 },
    latency: 0,
    streamed: false,
    chunks: null,
    simulated: false,
  };
}

function normalizeAPIResponse(raw, provider, model) {
  let text = '';

  if (raw.choices?.[0]?.message?.content) text = raw.choices[0].message.content;
  else if (raw.choices?.[0]?.text) text = raw.choices[0].text;
  else if (raw.candidates?.[0]?.content?.parts?.[0]?.text) text = raw.candidates[0].content.parts[0].text;
  else if (raw.content?.[0]?.text) text = raw.content[0].text;
  else text = JSON.stringify(raw);

  return {
    text,
    model: raw.model || model || 'unknown',
    provider: provider || 'unknown',
    usage: {
      inputTokens: raw.usage?.prompt_tokens || raw.usage?.input_tokens || raw.usage?.promptTokens || 0,
      outputTokens: raw.usage?.completion_tokens || raw.usage?.output_tokens || raw.usage?.completionTokens || 0,
    },
    latency: 0,
    streamed: false,
    chunks: null,
    simulated: false,
  };
}

function createEmpty(provider, model) {
  return {
    text: '',
    model: model || 'unknown',
    provider: provider || 'unknown',
    usage: { inputTokens: 0, outputTokens: 0 },
    latency: 0,
    streamed: false,
    chunks: null,
    simulated: false,
  };
}

function mergeStreamed(chunks) {
  if (!Array.isArray(chunks) || chunks.length === 0) return '';
  return chunks.join('');
}

module.exports = { normalize, normalizeAPIResponse, createEmpty, mergeStreamed };
