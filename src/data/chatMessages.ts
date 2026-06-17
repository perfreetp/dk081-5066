import type { ChatMessage } from '@/types';

// 聊天消息 mock 数据
export const mockChatMessages: Record<string, ChatMessage[]> = {
  c001: [
    {
      id: 'msg1',
      conversationId: 'c001',
      fromMe: false,
      type: 'text',
      content: '老板，这台小松PC200-8还在吗？',
      createdAt: '2026-06-18 09:20:00',
    },
    {
      id: 'msg2',
      conversationId: 'c001',
      fromMe: true,
      type: 'text',
      content: '在的，2023年准新机，2600小时，可以当天来看。',
      createdAt: '2026-06-18 09:22:00',
    },
    {
      id: 'msg3',
      conversationId: 'c001',
      fromMe: false,
      type: 'inspect',
      content: '验机重点',
      inspectTags: ['发动机冷启动看蓝烟', '回转听异响', '履带张紧度', '液压油有无乳化'],
      createdAt: '2026-06-18 09:30:00',
    },
    {
      id: 'msg4',
      conversationId: 'c001',
      fromMe: true,
      type: 'text',
      content: '没问题，我明天发你验机视频，重点这几项都拍到了。',
      createdAt: '2026-06-18 09:32:00',
    },
  ],
  c002: [
    {
      id: 'msg5',
      conversationId: 'c002',
      fromMe: false,
      type: 'text',
      content: '这台卡特320GC 42万有点高，工时5200了。',
      createdAt: '2026-06-18 08:40:00',
    },
    {
      id: 'msg6',
      conversationId: 'c002',
      fromMe: true,
      type: 'bargain',
      content: '砍价记录',
      bargainFrom: 42,
      bargainTo: 39,
      bargainNote: '工时偏高，回转有轻微异响，让价3万',
      createdAt: '2026-06-18 08:50:00',
    },
  ],
  c005: [
    {
      id: 'msg7',
      conversationId: 'c005',
      fromMe: true,
      type: 'text',
      content: '王哥，这台三一SY75C什么时候能看机？',
      createdAt: '2026-06-17 10:20:00',
    },
    {
      id: 'msg8',
      conversationId: 'c005',
      fromMe: false,
      type: 'text',
      content: '明天上午都可以看机，到双流联系我',
      createdAt: '2026-06-17 10:25:00',
    },
  ],
};

// 验机重点常用标签
export const INSPECT_TAG_PRESETS = [
  '发动机冷启动看蓝烟',
  '回转听异响',
  '履带张紧度',
  '液压油有无乳化',
  '行走跑偏测试',
  '臂架举升到位',
  '各部位漏油检查',
  '电瓶电压',
  '空调制冷',
  '手续齐全可过户',
];

// 砍价理由预设
export const BARGAIN_NOTE_PRESETS = [
  '工时偏高',
  '回转有轻微异响',
  '有漏油渗油',
  '手续待补',
  '同款行情偏低',
  '需要自费整备',
];
