import { getUrineUrgeCap, getUrineHardCap, getUrineFloor, getUrineResidualRatio, getUrineLevel } from './scripts/metabolism_config.js';

const cases = [
  ['非孕', '黄体期', 0, 0, 0],
  ['孕中期', '孕中期', 0, 0, 91],
  ['孕晚期未入盆', '孕晚期', 0, 0, 230],
  ['孕晚期入盆满深', '孕晚期', 1, 1.0, 230],
  ['逾期入盆满深', '逾期', 1, 1.0, 287],
  ['产后', '产后恢复', 0, 0, 1],
];

console.log('当前代码状态（已改前松后紧+缩余量，但排完值没抬高）:\n');
for (const [label, stage, eng, prog, days] of cases) {
  const urge = getUrineUrgeCap(stage, eng, prog);
  const hard = getUrineHardCap(stage, eng, prog);
  const floor = getUrineFloor(stage, eng, prog);
  const resRatio = getUrineResidualRatio(stage, eng, prog);
  const afterVoid = floor + urge * resRatio;
  const level = getUrineLevel(afterVoid, urge, hard);
  const margin = hard - urge;
  // 当前档位边界（前松后紧版：无50%、低75%、中90%、满=urge、爆=urge+margin*0.5）
  const noTop = (urge * 0.5).toFixed(0);
  const lowTop = (urge * 0.75).toFixed(0);
  const midTop = (urge * 0.9).toFixed(0);
  console.log(
    label.padEnd(12),
    'urge:' + String(urge).padStart(3),
    'hard:' + String(hard).padStart(3),
    '余量:' + String(margin).padStart(3),
    '| 地板:' + String(floor).padStart(2),
    '残值:' + (urge * resRatio).toFixed(1),
    '排完:' + afterVoid.toFixed(1),
    '-> ' + level + '档',
    '| 无0-' + noTop, '低' + noTop + '-' + lowTop, '中' + lowTop + '-' + midTop, '高' + midTop + '-' + urge, '满' + urge, '爆' + (urge + margin * 0.5).toFixed(0) + '-' + hard
  );
}
