/**
 * NRG ENGINE — UNIFIED REAL AI PROVIDER ENGINE
 * Shared single source of truth for provider resolution, key-prefix routing,
 * real HTTP / SSE streaming completions, connection testing, and honest diagnostics.
 * Zero fake/simulated AI responses.
 */

const PROVIDERS = Object.freeze({
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
    defaultPredictModel: 'gemini-2.0-flash',
    defaultAssistModel: 'gemini-2.0-flash',
    envKeys: ['NRG_GEMINI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY'],
    modelEnvKeys: ['NRG_GEMINI_MODEL', 'GEMINI_MODEL'],
    endpointEnvKeys: ['NRG_GEMINI_BASE_URL', 'GEMINI_BASE_URL'],
    requiresKey: true
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    defaultEndpoint: 'https://api.openai.com/v1',
    defaultPredictModel: 'gpt-4o-mini',
    defaultAssistModel: 'gpt-4o-mini',
    envKeys: ['NRG_OPENAI_API_KEY', 'OPENAI_API_KEY'],
    modelEnvKeys: ['NRG_OPENAI_MODEL', 'OPENAI_MODEL'],
    endpointEnvKeys: ['NRG_OPENAI_BASE_URL', 'OPENAI_BASE_URL'],
    requiresKey: true
  },
  groq: {
    id: 'groq',
    label: 'Groq Cloud',
    defaultEndpoint: 'https://api.groq.com/openai/v1',
    defaultPredictModel: 'llama-3.1-8b-instant',
    defaultAssistModel: 'llama-3.3-70b-versatile',
    envKeys: ['NRG_GROQ_API_KEY', 'GROQ_API_KEY'],
    modelEnvKeys: ['NRG_GROQ_MODEL', 'GROQ_MODEL'],
    endpointEnvKeys: ['NRG_GROQ_BASE_URL', 'GROQ_BASE_URL'],
    requiresKey: true
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic Claude',
    defaultEndpoint: 'https://api.anthropic.com/v1',
    defaultPredictModel: 'claude-3-5-haiku-latest',
    defaultAssistModel: 'claude-3-5-sonnet-latest',
    envKeys: ['NRG_ANTHROPIC_API_KEY', 'ANTHROPIC_API_KEY'],
    modelEnvKeys: ['NRG_ANTHROPIC_MODEL', 'ANTHROPIC_MODEL'],
    endpointEnvKeys: ['NRG_ANTHROPIC_BASE_URL', 'ANTHROPIC_BASE_URL'],
    requiresKey: true
  },
  ollama: {
    id: 'ollama',
    label: 'Ollama (Local)',
    defaultEndpoint: 'http://127.0.0.1:11434',
    defaultPredictModel: 'qwen2.5-coder:3b',
    defaultAssistModel: 'qwen2.5-coder:7b',
    envKeys: [],
    modelEnvKeys: ['NRG_OLLAMA_MODEL', 'OLLAMA_MODEL'],
    endpointEnvKeys: ['NRG_OLLAMA_HOST', 'OLLAMA_HOST'],
    requiresKey: false
  },
  custom: {
    id: 'custom',
    label: 'Custom OpenAI-Compatible',
    defaultEndpoint: '',
    defaultPredictModel: 'gpt-4o-mini',
    defaultAssistModel: 'gpt-4o-mini',
    envKeys: ['NRG_CUSTOM_AI_API_KEY', 'NRG_OPENAI_API_KEY'],
    modelEnvKeys: ['NRG_CUSTOM_AI_MODEL'],
    endpointEnvKeys: ['NRG_CUSTOM_AI_BASE_URL'],
    requiresKey: false
  }
});

const AUTO_ENV_ORDER = ['gemini', 'openai', 'groq', 'anthropic', 'ollama'];

function firstEnv(keys = []) {
  for (const k of keys) {
    const val = String(process.env[k] || '').trim();
    if (val) return { key: k, value: val };
  }
  return { key: '', value: '' };
}

function sanitizeEndpointUrl(rawUrl) {
  const trimmed = String(rawUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return parsed.toString().replace(/\/+$/, '');
  } catch (_) {
    return '';
  }
}

function detectProviderFromKey(apiKey) {
  const k = String(apiKey || '').trim();
  if (!k) return '';
  if (k.startsWith('AIza')) return 'gemini';
  if (k.startsWith('gsk_')) return 'groq';
  if (k.startsWith('sk-ant-')) return 'anthropic';
  if (k.startsWith('sk-')) return 'openai';
  return '';
}

function buildMissingConfigReport(requestedProvider) {
  return {
    configured: false,
    provider: requestedProvider || 'none',
    errorCode: 'NO_AI_CREDENTIALS',
    error: 'No AI provider API key or local LLM endpoint is configured.',
    missingConfig: {
      requiredOneOf: [
        'GEMINI_API_KEY (or NRG_GEMINI_API_KEY)',
        'OPENAI_API_KEY (or NRG_OPENAI_API_KEY)',
        'GROQ_API_KEY (or NRG_GROQ_API_KEY)',
        'ANTHROPIC_API_KEY (or NRG_ANTHROPIC_API_KEY)',
        'OLLAMA_HOST (e.g. http://127.0.0.1:11434)'
      ],
      uiSetupHint: 'Open the AI Studio panel or Settings -> 4. AI & Intelligence to enter an API key, model, or custom OpenAI/Ollama endpoint.'
    }
  };
}

/**
 * Resolve concrete AI provider configuration without ever mutating or hiding failures.
 * Supports explicit user `aiConfig` ({ provider, apiKey, model, endpoint }) and server env vars.
 */
function resolveAiConfig(aiConfig = {}, task = 'assist') {
  const cfg = aiConfig && typeof aiConfig === 'object' ? aiConfig : {};
  let requestedProvider = String(cfg.provider || 'auto').trim().toLowerCase();
  if (!requestedProvider || requestedProvider === 'default' || requestedProvider === 'env') {
    requestedProvider = 'auto';
  }
  const userKey = String(cfg.apiKey || '').trim();
  const userModel = String(cfg.model || '').trim();
  const userEndpoint = sanitizeEndpointUrl(cfg.endpoint || cfg.baseUrl || '');

  // Determine target provider ID cleanly
  let targetId = '';
  if (requestedProvider !== 'auto' && PROVIDERS[requestedProvider]) {
    targetId = requestedProvider;
  } else if (userKey || userEndpoint) {
    const inferred = detectProviderFromKey(userKey);
    if (inferred) {
      targetId = inferred;
    } else if (userEndpoint) {
      targetId = userEndpoint.includes(':11434') ? 'ollama' : 'custom';
    } else {
      // Unrecognized key prefix in auto mode -> try custom/openai compatible first
      targetId = 'openai';
    }
  } else {
    // Auto mode from server environment variables
    for (const pid of AUTO_ENV_ORDER) {
      const def = PROVIDERS[pid];
      if (pid === 'ollama') {
        if (firstEnv(def.endpointEnvKeys).value) { targetId = pid; break; }
      } else if (firstEnv(def.envKeys).value) {
        targetId = pid;
        break;
      }
    }
  }

  if (!targetId || !PROVIDERS[targetId]) {
    return buildMissingConfigReport(requestedProvider);
  }

  const def = PROVIDERS[targetId];
  const envKeyHit = firstEnv(def.envKeys);
  const envModelHit = firstEnv(def.modelEnvKeys);
  const envEndpointHit = firstEnv(def.endpointEnvKeys);

  const apiKey = userKey || envKeyHit.value;
  const endpoint = userEndpoint || sanitizeEndpointUrl(envEndpointHit.value) || def.defaultEndpoint;
  const defaultModel = task === 'predict' ? def.defaultPredictModel : def.defaultAssistModel;
  const model = userModel || envModelHit.value || defaultModel;

  // Validate required credentials/endpoint
  if (def.requiresKey && !apiKey) {
    const missing = buildMissingConfigReport(targetId);
    missing.error = `${def.label} is selected, but no API key is configured (${def.envKeys.join(' / ')} or UI API Key field).`;
    return missing;
  }
  if ((targetId === 'ollama' || targetId === 'custom') && !endpoint) {
    const missing = buildMissingConfigReport(targetId);
    missing.error = `${def.label} requires an HTTP/HTTPS endpoint URL (e.g. ${targetId === 'ollama' ? 'http://127.0.0.1:11434' : 'https://api.openai.com/v1'}).`;
    return missing;
  }

  return {
    configured: true,
    provider: targetId,
    label: def.label,
    apiKey,
    model,
    endpoint,
    configSource: (userKey || userEndpoint) ? 'client-config' : 'server-env',
    envKeyUsed: userKey ? '' : envKeyHit.key
  };
}

function getEnvConfiguredProviders() {
  const list = [];
  for (const pid of Object.keys(PROVIDERS)) {
    const def = PROVIDERS[pid];
    if (pid === 'ollama') {
      if (firstEnv(def.endpointEnvKeys).value) list.push(pid);
    } else if (firstEnv(def.envKeys).value) {
      list.push(pid);
    }
  }
  return list;
}

function maskEndpointOrigin(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    return u.origin;
  } catch (_) {
    return '';
  }
}

function getAiPublicStatus(aiConfig = {}) {
  const envProviders = getEnvConfiguredProviders();
  const resolved = resolveAiConfig(aiConfig, 'assist');
  if (!resolved.configured) {
    return {
      configured: false,
      activeProvider: 'none',
      providerLabel: 'Unconfigured',
      model: '',
      endpointOrigin: '',
      source: 'unconfigured',
      envConfigured: envProviders,
      errorCode: resolved.errorCode,
      error: resolved.error,
      missingConfig: resolved.missingConfig
    };
  }
  return {
    configured: true,
    activeProvider: resolved.provider,
    providerLabel: resolved.label,
    model: resolved.model,
    endpointOrigin: maskEndpointOrigin(resolved.endpoint),
    source: resolved.configSource,
    envConfigured: envProviders
  };
}

function createProviderError(message, statusCode = 502, errorCode = 'AI_PROVIDER_ERROR', provider = '') {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.errorCode = errorCode;
  err.provider = provider;
  return err;
}

async function parseErrorBody(resp, providerLabel) {
  let detail = resp.statusText || `HTTP ${resp.status}`;
  try {
    const txt = await resp.text();
    if (txt) {
      try {
        const j = JSON.parse(txt);
        detail = j?.error?.message || j?.message || j?.error || txt.slice(0, 280);
      } catch (_) {
        detail = txt.slice(0, 280);
      }
    }
  } catch (_) {}
  const code = resp.status === 401 || resp.status === 403
    ? 'AI_AUTH_ERROR'
    : (resp.status === 429 ? 'AI_RATE_LIMIT' : 'AI_UPSTREAM_ERROR');
  return createProviderError(`${providerLabel} rejected request (${resp.status}): ${detail}`, resp.status, code, providerLabel);
}

function normalizeMessagesToSystemAndTurns(messages = []) {
  const systemParts = [];
  const turns = [];
  for (const m of messages) {
    if (!m || typeof m.content !== 'string') continue;
    const role = String(m.role || 'user').toLowerCase();
    if (role === 'system') systemParts.push(m.content);
    else turns.push({ role: role === 'assistant' ? 'assistant' : 'user', content: m.content });
  }
  return { systemPrompt: systemParts.join('\n\n'), turns };
}

/**
 * Consume an SSE Response stream line-by-line and invoke `extractDelta(payload)` on JSON lines.
 */
async function readSseStream(resp, extractDelta, onDelta) {
  if (!resp.body || typeof resp.body.getReader !== 'function') {
    throw createProviderError('Streaming response body unavailable from AI provider.', 502, 'AI_STREAM_ERROR');
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nlIdx;
    while ((nlIdx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nlIdx).replace(/\r$/, '').trim();
      buffer = buffer.slice(nlIdx + 1);
      if (!line) continue;

      if (line.startsWith('data:')) {
        const dataStr = line.slice(5).trim();
        if (!dataStr || dataStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(dataStr);
          const delta = extractDelta(parsed);
          if (delta) {
            fullText += delta;
            if (typeof onDelta === 'function') onDelta(delta);
          }
        } catch (_) {}
      } else if (line.startsWith('{')) {
        // Ollama NDJSON line
        try {
          const parsed = JSON.parse(line);
          const delta = extractDelta(parsed);
          if (delta) {
            fullText += delta;
            if (typeof onDelta === 'function') onDelta(delta);
          }
        } catch (_) {}
      }
    }
  }
  return fullText;
}

/**
 * Execute a real completion or chat request against the resolved AI provider.
 * Throws structured error on missing credentials, auth failure, rate limit, network error, or timeout.
 */
async function invokeChatCompletion({
  resolved,
  messages = [],
  temperature = 0.2,
  maxTokens = 900,
  timeoutMs = 25000,
  stream = false,
  onDelta = null
}) {
  if (!resolved || !resolved.configured) {
    throw createProviderError(
      resolved?.error || 'No AI provider is configured.',
      503,
      resolved?.errorCode || 'NO_AI_CREDENTIALS',
      resolved?.provider || ''
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const pid = resolved.provider;

  try {
    // 1. OpenAI, Groq, or Custom OpenAI-Compatible
    if (pid === 'openai' || pid === 'groq' || pid === 'custom') {
      const headers = { 'Content-Type': 'application/json' };
      if (resolved.apiKey) headers.Authorization = `Bearer ${resolved.apiKey}`;
      const resp = await fetch(`${resolved.endpoint}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: resolved.model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: Boolean(stream)
        }),
        signal: controller.signal
      });
      if (!resp.ok) throw await parseErrorBody(resp, resolved.label);

      if (stream) {
        const ctype = (resp.headers.get('content-type') || '').toLowerCase();
        if (ctype.includes('text/event-stream')) {
          const text = await readSseStream(resp, (p) => p?.choices?.[0]?.delta?.content || p?.choices?.[0]?.text || '', onDelta);
          return { text, model: resolved.model, provider: pid, streamed: true };
        }
      }
      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
      if (!text && data?.error?.message) {
        throw createProviderError(`${resolved.label}: ${data.error.message}`, 502, 'AI_UPSTREAM_ERROR', pid);
      }
      if (stream && text && typeof onDelta === 'function') onDelta(text);
      return { text, model: data?.model || resolved.model, provider: pid, streamed: false };
    }

    // 2. Google Gemini
    if (pid === 'gemini') {
      const { systemPrompt, turns } = normalizeMessagesToSystemAndTurns(messages);
      const contents = turns.map((t) => ({
        role: t.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: t.content }]
      }));
      const body = {
        contents,
        generationConfig: { temperature, maxOutputTokens: maxTokens }
      };
      if (systemPrompt) {
        body.systemInstruction = { parts: [{ text: systemPrompt }] };
      }
      const action = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
      const sep = action.includes('?') ? '&' : '?';
      const url = `${resolved.endpoint}/models/${encodeURIComponent(resolved.model)}:${action}${sep}key=${encodeURIComponent(resolved.apiKey)}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      if (!resp.ok) throw await parseErrorBody(resp, resolved.label);

      if (stream) {
        const text = await readSseStream(
          resp,
          (p) => (p?.candidates?.[0]?.content?.parts || []).map((x) => x.text || '').join(''),
          onDelta
        );
        return { text, model: resolved.model, provider: pid, streamed: true };
      }
      const data = await resp.json();
      const text = (data?.candidates?.[0]?.content?.parts || []).map((x) => x.text || '').join('');
      return { text, model: resolved.model, provider: pid, streamed: false };
    }

    // 3. Anthropic Claude
    if (pid === 'anthropic') {
      const { systemPrompt, turns } = normalizeMessagesToSystemAndTurns(messages);
      const resp = await fetch(`${resolved.endpoint}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': resolved.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: resolved.model,
          system: systemPrompt || undefined,
          messages: turns,
          temperature,
          max_tokens: maxTokens,
          stream: Boolean(stream)
        }),
        signal: controller.signal
      });
      if (!resp.ok) throw await parseErrorBody(resp, resolved.label);

      if (stream) {
        const text = await readSseStream(
          resp,
          (p) => (p?.type === 'content_block_delta' ? (p?.delta?.text || '') : ''),
          onDelta
        );
        return { text, model: resolved.model, provider: pid, streamed: true };
      }
      const data = await resp.json();
      const text = (data?.content || []).map((b) => b.text || '').join('');
      return { text, model: data?.model || resolved.model, provider: pid, streamed: false };
    }

    // 4. Local Ollama
    if (pid === 'ollama') {
      const resp = await fetch(`${resolved.endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: resolved.model,
          messages,
          stream: Boolean(stream),
          options: { temperature, num_predict: maxTokens }
        }),
        signal: controller.signal
      });
      if (!resp.ok) throw await parseErrorBody(resp, resolved.label);

      if (stream) {
        const text = await readSseStream(resp, (p) => p?.message?.content || '', onDelta);
        return { text, model: resolved.model, provider: pid, streamed: true };
      }
      const data = await resp.json();
      return { text: data?.message?.content || '', model: resolved.model, provider: pid, streamed: false };
    }

    throw createProviderError(`Unsupported provider: ${pid}`, 400, 'UNSUPPORTED_PROVIDER', pid);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw createProviderError(`${resolved.label} request timed out after ${Math.round(timeoutMs / 1000)}s.`, 504, 'AI_TIMEOUT', pid);
    }
    if (err.statusCode) throw err;
    throw createProviderError(
      `Failed to reach ${resolved.label} (${maskEndpointOrigin(resolved.endpoint) || resolved.endpoint}): ${err.message}`,
      502,
      'AI_NETWORK_ERROR',
      pid
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Test live connectivity & credentials against the configured AI provider.
 */
async function testAiConnection(aiConfig = {}) {
  const started = Date.now();
  const resolved = resolveAiConfig(aiConfig, 'assist');
  if (!resolved.configured) {
    return {
      ok: false,
      configured: false,
      provider: resolved.provider,
      errorCode: resolved.errorCode,
      error: resolved.error,
      missingConfig: resolved.missingConfig
    };
  }

  try {
    const result = await invokeChatCompletion({
      resolved,
      messages: [
        { role: 'system', content: 'Respond with one short word: OK' },
        { role: 'user', content: 'Connection health check. Reply with OK.' }
      ],
      temperature: 0,
      maxTokens: 16,
      timeoutMs: 12000,
      stream: false
    });
    return {
      ok: true,
      configured: true,
      provider: resolved.provider,
      providerLabel: resolved.label,
      model: result.model || resolved.model,
      latencyMs: Date.now() - started,
      replyPreview: String(result.text || '').trim().slice(0, 60)
    };
  } catch (err) {
    return {
      ok: false,
      configured: true,
      provider: resolved.provider,
      providerLabel: resolved.label,
      model: resolved.model,
      statusCode: err.statusCode || 502,
      errorCode: err.errorCode || 'AI_TEST_FAILED',
      error: err.message,
      latencyMs: Date.now() - started
    };
  }
}

module.exports = {
  PROVIDERS,
  resolveAiConfig,
  getAiPublicStatus,
  invokeChatCompletion,
  testAiConnection,
  buildMissingConfigReport
};
