// API 格式切换（上游 v0.9.6 移植）的覆盖测试：
// 4 种格式的端点拼接、认证头、请求体转换与响应归一化。
// Node 环境无 window，isBrowserRuntime()=false，所有请求走 direct fetch，
// 因此 mock globalThis.fetch 即可捕获实际发出的 URL 与 body。
import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

import {
  API_FORMATS,
  getApiEndpointSuffix,
  getApiUrlForFormat,
  normalizeApiFormat,
} from '../scripts/state.js';
import { getApiFormatPreview, getAuthHeaders, callOpenAICompatible } from '../scripts/api.js';

const ORIGINAL_FETCH = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
});

function baseSettings(overrides = {}) {
  return {
    apiUrl: 'https://api.example.com/v1',
    apiKey: 'sk-test',
    model: 'test-model',
    apiFormat: API_FORMATS.OPENAI_COMPAT,
    ...overrides,
  };
}

function registryPayload() {
  // 带 target_character 走注册路径（应带 max_tokens: 30720）
  return { target_character: '雪乃', recent_messages: [] };
}

function mockFetch(respond) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init: init || {} });
    return respond(calls[calls.length - 1]);
  };
  return calls;
}

function jsonResponse(body) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  };
}

test('normalizeApiFormat 识别各别名并回退到 OpenAI 兼容', () => {
  assert.equal(normalizeApiFormat('claude'), API_FORMATS.CLAUDE_MESSAGES);
  assert.equal(normalizeApiFormat('anthropic'), API_FORMATS.CLAUDE_MESSAGES);
  assert.equal(normalizeApiFormat('custom_claude_messages'), API_FORMATS.CLAUDE_MESSAGES);
  assert.equal(normalizeApiFormat('gemini'), API_FORMATS.GEMINI_INTERACTIONS);
  assert.equal(normalizeApiFormat('responses'), API_FORMATS.OPENAI_RESPONSES);
  assert.equal(normalizeApiFormat('openai_responses'), API_FORMATS.OPENAI_RESPONSES);
  assert.equal(normalizeApiFormat(''), API_FORMATS.OPENAI_COMPAT);
  assert.equal(normalizeApiFormat('unknown-garbage'), API_FORMATS.OPENAI_COMPAT);
  assert.equal(normalizeApiFormat(null), API_FORMATS.OPENAI_COMPAT);
});

test('getApiUrlForFormat 按格式拼接端点，Gemini 自动补 v1beta', () => {
  assert.equal(getApiEndpointSuffix('claude'), '/messages');
  assert.equal(getApiEndpointSuffix('gemini'), '/interactions');
  assert.equal(getApiEndpointSuffix('responses'), '/responses');
  assert.equal(getApiEndpointSuffix('openai_compat'), '/chat/completions');

  assert.equal(getApiUrlForFormat('https://api.example.com/v1', 'claude'), 'https://api.example.com/v1/messages');
  // 尾斜杠清理
  assert.equal(getApiUrlForFormat('https://api.example.com/v1/', 'claude'), 'https://api.example.com/v1/messages');
  // Gemini 无版本后缀时补 /v1beta
  assert.equal(getApiUrlForFormat('https://api.example.com', 'gemini'), 'https://api.example.com/v1beta/interactions');
  // Gemini 已带 /v1beta 时不再重复补
  assert.equal(getApiUrlForFormat('https://api.example.com/v1beta', 'gemini'), 'https://api.example.com/v1beta/interactions');
  assert.equal(getApiUrlForFormat('https://api.example.com/v1', 'openai_compat'), 'https://api.example.com/v1/chat/completions');
  assert.equal(getApiFormatPreview(baseSettings()), 'https://api.example.com/v1/chat/completions');
});

test('getAuthHeaders 按格式选用认证头', () => {
  const claude = getAuthHeaders(baseSettings({ apiFormat: 'claude_messages' }));
  assert.equal(claude['anthropic-version'], '2023-06-01');
  assert.equal(claude.Authorization, 'Bearer sk-test');
  assert.equal(claude['x-api-key'], 'sk-test');

  const gemini = getAuthHeaders(baseSettings({ apiFormat: 'gemini_interactions' }));
  assert.equal(gemini['x-goog-api-key'], 'sk-test');
  assert.equal(gemini.Authorization, undefined);

  const compat = getAuthHeaders(baseSettings());
  assert.equal(compat.Authorization, 'Bearer sk-test');
  assert.equal(compat['x-api-key'], undefined);

  const noKey = getAuthHeaders(baseSettings({ apiKey: '' }));
  assert.equal(noKey.Authorization, undefined);
});

test('Claude 格式：端点 /messages、system 提到顶层、响应按 content 归一化', async () => {
  const calls = mockFetch(() => jsonResponse({
    content: [{ type: 'text', text: '{"ok":"claude"}' }],
  }));
  const result = await callOpenAICompatible(
    baseSettings({ apiFormat: 'claude_messages' }),
    registryPayload(),
    '你是测试系统提示',
  );
  assert.equal(result.ok, 'claude');
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith('/v1/messages'), `实际 URL: ${calls[0].url}`);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.system, '你是测试系统提示');
  assert.equal(body.max_tokens, 30720, '注册请求应带 30720 输出上限');
  assert.ok(Array.isArray(body.messages));
  assert.equal(body.messages[0].role, 'user');
  assert.equal(calls[0].init.headers['x-api-key'], 'sk-test');
});

test('Responses 格式：端点 /responses、system 转 developer、响应取 output_text', async () => {
  const calls = mockFetch(() => jsonResponse({ output_text: '{"ok":"responses"}' }));
  const result = await callOpenAICompatible(
    baseSettings({ apiFormat: 'openai_responses' }),
    registryPayload(),
    '你是测试系统提示',
  );
  assert.equal(result.ok, 'responses');
  assert.ok(calls[0].url.endsWith('/responses'), `实际 URL: ${calls[0].url}`);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.max_output_tokens, 30720, 'max_tokens 应映射为 max_output_tokens');
  assert.equal(body.input[0].role, 'developer');
  assert.equal(body.input[0].content, '你是测试系统提示');
});

test('Gemini 格式：端点补 v1beta/interactions、system 合并、响应按 steps 归一化', async () => {
  const calls = mockFetch(() => jsonResponse({
    status: 'completed',
    steps: [{ type: 'model_output', content: [{ type: 'text', text: '{"ok":"gemini"}' }] }],
  }));
  const result = await callOpenAICompatible(
    baseSettings({ apiFormat: 'gemini_interactions', apiUrl: 'https://api.example.com' }),
    registryPayload(),
    '你是测试系统提示',
  );
  assert.equal(result.ok, 'gemini');
  assert.ok(calls[0].url.endsWith('/v1beta/interactions'), `实际 URL: ${calls[0].url}`);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.system_instruction, '你是测试系统提示');
  assert.equal(body.input[0].type, 'user_input');
  assert.equal(body.generation_config.max_output_tokens, 30720);
  assert.equal(calls[0].init.headers['x-goog-api-key'], 'sk-test');
});

test('OpenAI 兼容格式：端点 /chat/completions、注册请求带 30720 上限', async () => {
  const calls = mockFetch(() => jsonResponse({
    choices: [{ message: { content: '{"ok":"compat"}' } }],
  }));
  const result = await callOpenAICompatible(baseSettings(), registryPayload(), '你是测试系统提示');
  assert.equal(result.ok, 'compat');
  assert.ok(calls[0].url.endsWith('/chat/completions'), `实际 URL: ${calls[0].url}`);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.max_tokens, 30720);
  assert.equal(body.messages[0].role, 'system');
  assert.equal(body.messages[1].role, 'user');
});

test('追踪请求（非注册）不设置 30720 上限', async () => {
  const calls = mockFetch(() => jsonResponse({ choices: [{ message: { content: '{}' } }] }));
  await callOpenAICompatible(baseSettings(), { recent_messages: [] }, '你是测试系统提示');
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.max_tokens, undefined);
});
