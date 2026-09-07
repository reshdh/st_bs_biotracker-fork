import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';
import { callOpenAICompatible, isApiDeadlineError, isApiTimeoutError } from '../scripts/api.js';

const original = Object.fromEntries(['fetch', 'window', 'document', 'location', 'SillyTavern', 'setTimeout', '__TAURITAVERN__'].map(key => [key, globalThis[key]]));
const settings = { apiUrl: 'https://policy.invalid/v1', apiKey: 'test-key', model: 'test', useStPresetForAsync: false };
const payload = { target_character: 'Alice', recent_messages: [] };
let waits;
beforeEach(() => {
  waits = [];
  // Keep backoff assertions deterministic without waiting on wall-clock time.
  globalThis.setTimeout = (fn, ms, ...args) => {
    if (ms >= 1000 && ms <= 10000) { waits.push(ms); return original.setTimeout(fn, 0, ...args); }
    return original.setTimeout(fn, ms, ...args);
  };
});
afterEach(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
  delete globalThis.__bs_biotracker_host_proxy_disabled__;
});
function response(data, status = 200, retryAfter = null) {
  return { ok: status >= 200 && status < 300, status,
    headers: { get: name => name.toLowerCase() === 'retry-after' ? retryAfter : null },
    text: async () => typeof data === 'string' ? data : JSON.stringify(data) };
}
function completion(format, content, extra = {}) {
  if (format === 'openai_responses') return { output_text: content, ...extra };
  if (format === 'claude_messages') return { content: [{ type: 'text', text: content }], ...extra };
  if (format === 'gemini_interactions') return { status: 'completed', steps: [{ type: 'model_output', content: [{ type: 'text', text: content }] }], ...extra };
  return { choices: [{ message: { content }, finish_reason: extra.finish_reason || 'stop' }], ...extra };
}
function mockFetch(answer) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const call = { url, body: JSON.parse(init.body) }; calls.push(call);
    return answer(calls.length, call);
  };
  return calls;
}
const diagnostics = () => globalThis.__bs_biotracker_debug_last_effective_request__?.diagnostics;
function browser(formatted = false) {
  globalThis.window = {};
  globalThis.document = { cookie: '' };
  globalThis.location = { origin: 'http://localhost:8000', href: 'http://localhost:8000/' };
  globalThis.SillyTavern = { getContext: () => null, getRequestHeaders: () => ({}) };
  if (formatted) globalThis.__TAURITAVERN__ = { ready: true };
}

for (const format of ['openai_compat', 'openai_responses', 'claude_messages', 'gemini_interactions']) {
  test(format + ' preserves output budget through JSON repair', async () => {
    const usage = format === 'openai_compat' ? { prompt_tokens: 12, completion_tokens: 3 }
      : format === 'gemini_interactions' ? { total_input_tokens: 12, total_output_tokens: 3 }
        : { input_tokens: 12, output_tokens: 3 };
    const calls = mockFetch(n => response(completion(format, n === 1 ? 'invalid' : '{"ok":true}', { usage })));
    assert.deepEqual(await callOpenAICompatible({ ...settings, apiFormat: format }, payload, 'Return JSON.'), { ok: true });
    assert.equal(calls.length, 2);
    for (const { body } of calls) {
      assert.equal(body.max_tokens ?? body.max_output_tokens ?? body.generation_config?.max_output_tokens, 30720);
    }
    assert.deepEqual(diagnostics().responses.map(item => [item.inputTokens, item.outputTokens]), [[12, 3], [12, 3]]);
  });
}

test('response-format and minimal fallback both retain the effective output budget', async () => {
  const calls = mockFetch(n => n < 3 ? response({ error: n === 1 ? 'unsupported response_format' : 'invalid argument' }, 400)
    : response(completion('openai_compat', '{"ok":true}')));
  await callOpenAICompatible(settings, payload, 'Return JSON.');
  assert.deepEqual(calls.map(x => x.body.max_tokens), [30720, 30720, 30720]);
  assert.equal(calls[1].body.response_format, undefined);
  assert.equal(calls[2].body.temperature, undefined);
});

test('permanent malformed model JSON stops after one repair', async () => {
  const calls = mockFetch(() => response(completion('openai_compat', 'broken')));
  await assert.rejects(callOpenAICompatible(settings, payload, 'Return JSON.'), error => error.code === 'BS_MODEL_JSON');
  assert.equal(calls.length, 2);
  assert.equal(diagnostics().jsonRepairs, 1);
  assert.equal(diagnostics().httpRequests, 2);
});

test('JSON repair allowance survives a transport failure and global retry', async () => {
  const calls = mockFetch(n => n === 2 ? response({ error: 'overloaded' }, 503) : response(completion('openai_compat', 'broken')));
  await assert.rejects(callOpenAICompatible(settings, payload, 'Return JSON.'), error => error.code === 'BS_MODEL_JSON');
  assert.equal(calls.length, 3);
  assert.equal(diagnostics().jsonRepairs, 1);
  assert.equal(diagnostics().globalRetries, 1);
});

for (const [content, code] of [['', 'BS_MODEL_EMPTY'], ['[]', 'BS_MODEL_SHAPE'], ['23', 'BS_MODEL_SHAPE'], ['null', 'BS_MODEL_SHAPE']]) {
  test('invalid model result ' + JSON.stringify(content) + ' is not applied or sent for syntax repair', async () => {
    const calls = mockFetch(() => response(completion('openai_compat', content)));
    await assert.rejects(callOpenAICompatible(settings, payload, 'Return JSON.'), error => error.code === code);
    assert.equal(calls.length, 1);
  });
}

for (const format of ['openai_responses', 'claude_messages', 'gemini_interactions']) {
  test(format + ' empty model output stops without a syntax repair', async () => {
    const calls = mockFetch(() => response(completion(format, '')));
    await assert.rejects(callOpenAICompatible({ ...settings, apiFormat: format }, payload, 'Return JSON.'), error => error.code === 'BS_MODEL_EMPTY');
    assert.equal(calls.length, 1);
  });
}

for (const [format, extra] of [
  ['openai_compat', { finish_reason: 'length' }],
  ['openai_responses', { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } }],
  ['claude_messages', { stop_reason: 'max_tokens' }],
  ['gemini_interactions', { status: 'incomplete' }],
]) {
  for (const content of ['{"ok":true}', '']) {
    test(format + ' reports truncation with ' + (content ? 'parseable JSON' : 'no visible text'), async () => {
      const calls = mockFetch(() => response(completion(format, content, extra)));
      await assert.rejects(callOpenAICompatible({ ...settings, apiFormat: format }, payload, 'Return JSON.'), error => error.code === 'BS_MODEL_TRUNCATED');
      assert.equal(calls.length, 1);
    });
  }
}

test('upstream authentication errors passed through the host do not fall back or retry', async () => {
  browser();
  const calls = mockFetch(() => response({ error: { message: 'invalid_api_key', api_key: 'secret-value' } }, 403));
  await assert.rejects(callOpenAICompatible(settings, payload, 'Return JSON.'), error => error.status === 403 && !error.message.includes('secret-value'));
  assert.equal(calls.length, 1);
  assert.equal(globalThis.__bs_biotracker_host_proxy_disabled__, undefined);
});

for (const message of ['Cannot POST /api/backends/chat-completions/generate', 'route not found']) {
  test('a JSON host route error still permits direct fallback: ' + message, async () => {
    browser();
    const calls = mockFetch(n => n === 1 ? response({ error: message }, 404)
      : response(completion('openai_compat', '{"ok":true}')));
    await callOpenAICompatible(settings, payload, 'Return JSON.');
    assert.equal(calls.length, 2);
    assert.equal(calls[1].url, settings.apiUrl + '/chat/completions');
    assert.equal(diagnostics().proxyFallbacks, 1);
    assert.equal(globalThis.__bs_biotracker_host_proxy_disabled__, true);
  });
}

test('an upstream missing-model error is not mistaken for a missing host route', async () => {
  browser();
  const calls = mockFetch(() => response({ error: { type: 'invalid_request_error', message: 'Model not found' } }, 404));
  await assert.rejects(callOpenAICompatible(settings, payload, 'Return JSON.'), error => error.status === 404);
  assert.equal(calls.length, 1);
  assert.equal(globalThis.__bs_biotracker_host_proxy_disabled__, undefined);
});

for (const format of ['openai_responses', 'claude_messages', 'gemini_interactions']) {
  for (const formatted of [true, false]) {
    test(format + ' preserves native fields and repair budget after ' + (formatted ? 'format-aware' : 'transparent') + ' proxy fallback', async () => {
      browser(formatted);
      const calls = mockFetch(n => n === 1 ? response('ForbiddenError: Invalid CSRF token', 403)
        : response(completion(format, n === 2 ? 'invalid' : '{"ok":true}')));
      assert.deepEqual(await callOpenAICompatible({ ...settings, apiFormat: format }, payload, 'Return JSON.'), { ok: true });
      assert.equal(calls.length, 3);
      assert.ok(calls[0].url.startsWith(formatted ? '/api/backends/' : '/proxy/'));
      for (const call of calls.slice(1)) {
        assert.ok(call.url.startsWith(settings.apiUrl));
        assert.equal(call.body.max_tokens ?? call.body.max_output_tokens ?? call.body.generation_config?.max_output_tokens, 30720);
        assert.ok(Array.isArray(format === 'claude_messages' ? call.body.messages : call.body.input));
        if (format !== 'claude_messages') assert.equal(call.body.messages, undefined);
      }
      assert.equal(diagnostics().proxyFallbacks, 1);
      assert.equal(diagnostics().jsonRepairs, 1);
    });
  }
}

test('429 respects Retry-After and records retries independently of HTTP calls', async () => {
  const calls = mockFetch(n => n === 1 ? response({ error: 'limited' }, 429, '2')
    : response(completion('openai_compat', '{"ok":true}', { usage: { prompt_tokens: 12, completion_tokens: 3 } })));
  await callOpenAICompatible(settings, payload, 'Return JSON.');
  assert.equal(calls.length, 2);
  assert.deepEqual(waits, [2000]);
  assert.equal(diagnostics().globalRetries, 1);
  assert.equal(diagnostics().httpRequests, 2);
  assert.equal(diagnostics().responses.at(-1).outputTokens, 3);
});

test('a deadline during Retry-After does not count an unstarted retry', async () => {
  const calls = mockFetch(() => response({ error: 'limited' }, 429, '60'));
  // beforeEach accelerates the 4-second overall deadline; the 60-second
  // Retry-After wait must be interrupted before another request starts.
  await assert.rejects(callOpenAICompatible({ ...settings, apiTimeoutMs: 1000 }, payload, 'Return JSON.'), isApiDeadlineError);
  assert.equal(calls.length, 1);
  assert.equal(diagnostics().globalRetries, 0);
  assert.equal(diagnostics().logicalRequests, 1);
  assert.equal(diagnostics().httpRequests, 1);
});

test('a timeout while reading the proxy response body does not fall back or retry', async () => {
  browser();
  globalThis.setTimeout = (fn, ms, ...args) => original.setTimeout(fn, ms === 1000 ? 0 : ms, ...args);
  let calls = 0;
  globalThis.fetch = async (_url, init) => {
    calls++;
    return { ok: true, status: 200, text: () => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new Error('body read aborted')), { once: true });
    }) };
  };
  await assert.rejects(callOpenAICompatible({ ...settings, apiTimeoutMs: 1000 }, payload, 'Return JSON.'), isApiTimeoutError);
  assert.equal(calls, 1);
  assert.equal(diagnostics().proxyFallbacks, 0);
  assert.equal(diagnostics().globalRetries, 0);
  assert.equal(diagnostics().errorCode, 'timeout');
});

test('HTTP 200 provider errors are diagnosed separately from empty model output', async () => {
  const calls = mockFetch(() => response({ error: { type: 'authentication_error', message: 'invalid api key' } }));
  await assert.rejects(callOpenAICompatible(settings, payload, 'Return JSON.'), error => error.code === 'BS_API_PROVIDER');
  assert.equal(calls.length, 1);
});
