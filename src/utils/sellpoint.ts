import type { Machine, SellPoint } from '@/types';

// 验机视频类型定义
export const VIDEO_TYPES: { type: 'engine' | 'travel' | 'slewing' | 'boom'; label: string; desc: string }[] = [
  { type: 'engine', label: '发动机启动', desc: '冷启动顺畅无异常' },
  { type: 'travel', label: '行走动作', desc: '前进后退转向正常' },
  { type: 'slewing', label: '回转动作', desc: '回转平稳无异响' },
  { type: 'boom', label: '臂架动作', desc: '举升下降动作到位' },
];

// 工时判断车况
const hoursToConditionLabel = (hours: number): string => {
  if (hours < 3000) return '低工时';
  if (hours < 6000) return '正常工时';
  return '高工时';
};

// 自动生成标准卖点卡片
export const generateSellPoints = (machine: {
  year: number;
  hours: number;
  brand: string;
  sellPoint: SellPoint;
}): { highlights: string[]; summary: string } => {
  const { year, hours, brand, sellPoint } = machine;
  const highlights: string[] = [];

  // 年份
  const age = new Date().getFullYear() - year;
  if (age <= 3) highlights.push(`${year}年准新机`);
  else if (age <= 6) highlights.push(`${year}年次新`);
  else highlights.push(`${year}年经典款`);

  // 工时
  highlights.push(`${hoursToConditionLabel(hours)}${hours.toLocaleString()}h`);

  // 验机项
  const passedItems: string[] = [];
  if (sellPoint.engineStart) passedItems.push('发动机启动正常');
  if (sellPoint.travelOk) passedItems.push('行走正常');
  if (sellPoint.slewingOk) passedItems.push('回转正常');
  if (sellPoint.boomOk) passedItems.push('臂架动作到位');
  if (sellPoint.noOilLeak) passedItems.push('无漏油渗油');
  if (sellPoint.noRepair) passedItems.push('无大修记录');
  if (sellPoint.paperComplete) passedItems.push('手续齐全可过户');

  const summary = `${brand} | ${year}年 | ${hours.toLocaleString()}小时 | 验机${passedItems.length}/${VIDEO_TYPES.length + 3}项通过`;
  return { highlights, summary };
};

// 卖点卡片完整描述
export const buildSellPointDesc = (machine: Machine): string => {
  const sp = machine.sellPoint;
  const lines: string[] = [];
  lines.push(`【基本信息】${machine.brand} ${machine.model}，${machine.year}年，工时${machine.hours.toLocaleString()}h`);
  lines.push(`【常驻工地】${machine.city} ${machine.site}`);
  lines.push(`【验机情况】`);
  if (sp.engineStart) lines.push('  ✓ 发动机冷启动顺畅，无蓝烟异响');
  if (sp.travelOk) lines.push('  ✓ 行走系统正常，履带/轮胎磨损小');
  if (sp.slewingOk) lines.push('  ✓ 回转支承平稳，无异响卡顿');
  if (sp.boomOk) lines.push('  ✓ 臂架举升下降动作到位');
  if (sp.noOilLeak) lines.push('  ✓ 各部位无漏油渗油');
  if (sp.noRepair) lines.push('  ✓ 发动机变速箱无大修');
  if (sp.paperComplete) lines.push('  ✓ 手续齐全，可正常过户');
  return lines.join('\n');
};
