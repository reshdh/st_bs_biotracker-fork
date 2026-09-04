// 本轮移植/新增 UI 功能的合同测试：settings.html 的 API 格式控件、
// index.js 的血缘窗口/精液占比环/孕期压力量表渲染函数、
// style.css 的尿意便意图标与白桃主题，防止后续重构时静默断线。
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('settings.html 提供 API 格式四选项与端点预览', async () => {
  const html = await readFile(new URL('settings.html', root), 'utf8');
  assert.match(html, /<select id="bs-bt-api-format"/);
  for (const value of ['openai_compat', 'openai_responses', 'claude_messages', 'gemini_interactions']) {
    assert.match(html, new RegExp(`value="${value}"`), `缺少选项 ${value}`);
  }
  assert.match(html, /id="bs-bt-api-endpoint-preview"/);
  assert.match(html, /id="bs-bt-api-endpoint-preview-code"/);
});

test('index.js 的血缘窗口、占比环、压力量表、API 预览均接线完整', async () => {
  const controller = await readFile(new URL('index.js', root), 'utf8');

  // API 格式切换链路
  assert.match(controller, /function updateApiEndpointPreview\(\)/);
  assert.match(controller, /getElementById\('bs-bt-api-endpoint-preview-code'\)/);
  assert.match(controller, /setValue\('bs-bt-api-format', normalizeApiFormat\(settings\.apiFormat\)\)/);
  assert.match(controller, /getElementById\('bs-bt-api-format'\)/);
  assert.match(controller, /getApiFormatPreview|getApiUrlForFormat/);

  // 血缘窗口
  assert.match(controller, /const LINEAGE_ID = 'bs-bt-lineage'/);
  assert.match(controller, /function openLineageWindow\(/);
  assert.match(controller, /function closeLineageWindow\(/);
  assert.match(controller, /function renderLineageChart\(/);
  assert.match(controller, /function selectLineageNode\(/);
  assert.match(controller, /bs-bt-lineage-open/);
  assert.match(controller, /data-lineage-center=/);
  assert.match(controller, /buildLineageView\(/);
  assert.match(controller, /relatedNodeIds\(/);

  // 精液来源占比环注入轮播 lead
  assert.match(controller, /const SPERM_SHARE_STEPS = /);
  assert.match(controller, /function renderSpermShareChart\(/);
  assert.match(controller, /lead: renderSpermShareChart\(/);

  // 孕期衣著压力量表
  assert.match(controller, /const PREGFIT_DIM_LABELS = /);
  assert.match(controller, /function renderPregFitGauge\(/);
  assert.match(controller, /bs-bt-pregfit__/);

  // 状态标签进入角色概览
  assert.match(controller, /getCharacterStatusTags\(/);
  assert.match(controller, /function renderTrackOverview\(viewModel\)/);
  assert.match(controller, /viewModel\.statusTags/);
  assert.match(controller, /bs-bt-status-bar/);
});

test('style.css 覆盖尿意/便意图标、白桃主题与新窗口样式', async () => {
  const css = await readFile(new URL('style.css', root), 'utf8');

  // 尿意/便意拆分后的图标（droplet / toilet-paper），旧的 excretion 保留兼容
  for (const key of ['urine', 'stool', 'excretion']) {
    const block = css.match(new RegExp(`#bs-biotracker-settings \\.bs-bt-need-icon--${key} \\{[\\s\\S]*?\\}`));
    assert.ok(block, `缺少 --${key} 图标定义`);
    assert.match(block[0], /mask-image: url\(/, `--${key} 缺少 mask-image`);
  }

  // 白桃主题（含血缘窗口的配色延伸）
  assert.match(css, /\.theme-peach/);
  assert.match(css, /\.bs-bt-lineage\.theme-peach/);

  // 血缘窗口与占比环、压力量表的样式
  assert.match(css, /bs-bt-sperm-share__ring/);
  assert.match(css, /bs-bt-pregfit__dim-label|bs-bt-pregfit/);
  assert.match(css, /bs-bt-tag--stage|bs-bt-status-bar/);
});
