import type { DepositAgreement, FailRecord, Handover, PriceAlert, Booking, Fulfillment, MachineInteraction, DailyStatsTrend } from '@/types';

// 我的收藏车源（引用 machines 中 collected 为 true 的）
export const mockMyCollectedMachineIds = ['m002', 'm006'];

// 关注机型降价提醒
export const mockPriceAlerts: PriceAlert[] = [
  {
    id: 'pa001',
    categoryLabel: '挖掘机',
    modelKeyword: '三一 SY75C',
    targetPrice: 17,
    currentMinPrice: 17.5,
    matched: true,
  },
  {
    id: 'pa002',
    categoryLabel: '装载机',
    modelKeyword: '柳工 855N',
    targetPrice: 24,
    currentMinPrice: 26,
    matched: false,
  },
  {
    id: 'pa003',
    categoryLabel: '挖掘机',
    modelKeyword: '小松 PC200',
    targetPrice: 55,
    currentMinPrice: 58,
    matched: false,
  },
];

// 我的发车列表（机主视角）
export const mockMyMachines = [
  { id: 'my001', title: '斗山DX55-9C 迷你挖', cover: 'https://picsum.photos/id/3/200/200', status: '在售', views: 36, price: 14 },
  { id: 'my002', title: '临工L956F 装载机', cover: 'https://picsum.photos/id/1082/200/200', status: '已售', views: 128, price: 23.5 },
];

// 定金协议
export const mockAgreements: DepositAgreement[] = [
  {
    id: 'a001',
    machineId: 'm008',
    machineTitle: '中联重科 汽车吊 25吨',
    machineCover: 'https://picsum.photos/id/787/200/200',
    sellerName: '吊装老周',
    sellerPhone: '136-6000-8888',
    buyerName: '我',
    buyerPhone: '139-9000-5678',
    myRole: 'buyer',
    dealPrice: 66,
    deposit: 20000,
    signedAt: '2026-06-16 16:30:00',
    status: 'signed',
    paymentStatus: 'partial',
    paymentNote: '已转定金1万，剩余1万下午3点前到账',
  },
  {
    id: 'a002',
    machineId: 'm007',
    machineTitle: '临工L956F 装载机 砂石场利器',
    machineCover: 'https://picsum.photos/id/1082/200/200',
    sellerName: '我',
    sellerPhone: '139-9000-5678',
    buyerName: '陈老板',
    buyerPhone: '135-5000-3333',
    myRole: 'seller',
    dealPrice: 23.5,
    deposit: 10000,
    signedAt: '2026-06-12 11:00:00',
    status: 'completed',
    paymentStatus: 'paid',
    handoverId: 'h001',
  },
];

// 交机清单
export const mockHandovers: Handover[] = [
  {
    id: 'h001',
    agreementId: 'a002',
    machineId: 'm007',
    machineTitle: '临工L956F 装载机 砂石场利器',
    machineCover: 'https://picsum.photos/id/1082/200/200',
    sellerName: '我',
    sellerPhone: '139-9000-5678',
    buyerName: '陈老板',
    buyerPhone: '135-5000-3333',
    dealPrice: 23.5,
    deposit: 10000,
    handoverAt: '2026-06-15 10:00:00',
    status: 'done',
    items: [
      { label: '机器实体验收（与视频一致）', checked: true },
      { label: '发动机/变速箱运转正常', checked: true },
      { label: '液压系统无漏油', checked: true },
      { label: '随车工具齐全', checked: true },
      { label: '购车发票原件', checked: true },
      { label: '合格证原件', checked: true },
      { label: '登记证书（大绿本）', checked: true },
      { label: '尾款结清凭证', checked: true },
    ],
  },
];

// 预约看机记录
export const mockBookings: Booking[] = [
  {
    id: 'bk001',
    machineId: 'm002',
    machineTitle: '卡特320GC 挖掘机',
    machineCover: 'https://picsum.photos/id/1082/200/200',
    sellerName: '川渝二手机',
    sellerPhone: '138-8000-1234',
    site: '龙泉驿区某道路工地',
    city: '成都市',
    viewDate: '2026-06-19',
    viewTimeSlot: '14:00-16:00',
    buyerName: '我',
    buyerPhone: '139-9000-5678',
    status: 'pending',
  },
  {
    id: 'bk002',
    machineId: 'm006',
    machineTitle: '斗山DX55-9C 迷你挖',
    machineCover: 'https://picsum.photos/id/3/200/200',
    sellerName: '老赵挖掘',
    sellerPhone: '137-7000-9999',
    site: '武侯区某拆迁工地',
    city: '成都市',
    viewDate: '2026-06-18',
    viewTimeSlot: '09:00-11:00',
    buyerName: '我',
    buyerPhone: '139-9000-5678',
    status: 'confirmed',
  },
];

// 成交失败记录
export const mockFailRecords: FailRecord[] = [
  {
    id: 'f001',
    machineTitle: '三一SY135C 挖掘机',
    machineCover: 'https://picsum.photos/id/1082/200/200',
    reason: 'price_gap',
    reasonLabel: '价格差距大',
    note: '卖家32万不松口，买家预算28万，差距4万未谈拢。',
    createdAt: '2026-06-10 15:00:00',
  },
  {
    id: 'f002',
    machineTitle: '徐工 推土机 TY160',
    machineCover: 'https://picsum.photos/id/787/200/200',
    reason: 'condition_mismatch',
    reasonLabel: '车况不符',
    note: '视频显示回转异响明显，实地试车确认液压有问题。',
    createdAt: '2026-06-08 11:30:00',
  },
  {
    id: 'f003',
    machineTitle: '中联重科 汽车吊 25吨',
    machineCover: 'https://picsum.photos/id/3/200/200',
    reason: 'paper_issue',
    reasonLabel: '手续不齐',
    note: '登记证书缺失，买家担心无法过户，暂缓成交。',
    createdAt: '2026-06-05 09:40:00',
  },
];

// 成交失败原因选项
export const FAIL_REASON_OPTIONS: { value: 'price_gap' | 'condition_mismatch' | 'paper_issue'; label: string }[] = [
  { value: 'price_gap', label: '价格差距大' },
  { value: 'condition_mismatch', label: '车况不符' },
  { value: 'paper_issue', label: '手续不齐' },
];

// 履约进度
export const mockFulfillments: Fulfillment[] = [
  {
    id: 'ff001',
    agreementId: 'a001',
    steps: [
      { key: 'deposit', label: '定金到账', done: true, at: '2026-06-16 16:30:00', note: '已转定金1万，剩余1万下午3点前到账' },
      { key: 'handover', label: '现场交机', done: false },
      { key: 'final_payment', label: '尾款结清', done: false },
      { key: 'followup', label: '售后回访', done: false },
    ],
    currentStep: 1,
    finalPayment: 640000,
    updatedAt: '2026-06-16 16:30:00',
  },
  {
    id: 'ff002',
    agreementId: 'a002',
    steps: [
      { key: 'deposit', label: '定金到账', done: true, at: '2026-06-12 11:00:00', note: '买家已全额付清定金' },
      { key: 'handover', label: '现场交机', done: true, at: '2026-06-15 10:00:00' },
      { key: 'final_payment', label: '尾款结清', done: true, at: '2026-06-15 10:30:00', note: '尾款 22.5万 已全额到账' },
      { key: 'followup', label: '售后回访', done: true, at: '2026-06-17 09:00:00', note: '买家确认设备运行正常，无异常反馈' },
    ],
    currentStep: 3,
    finalPayment: 225000,
    followupNote: '买家确认设备运行正常，无异常反馈',
    updatedAt: '2026-06-17 09:00:00',
  },
];

// 车源咨询/预约明细
export const mockMachineInteractions: MachineInteraction[] = [
  {
    id: 'mi001',
    machineId: 'm004',
    type: 'consult',
    source: 'find',
    userName: '李老板',
    userAvatar: 'https://picsum.photos/id/1005/200/200',
    userPhone: '138-1111-2222',
    content: '这车还在吗？能不能再少点？',
    createdAt: '2026-06-18 09:15:00',
  },
  {
    id: 'mi002',
    machineId: 'm004',
    type: 'booking',
    source: 'price_alert',
    userName: '张总',
    userAvatar: 'https://picsum.photos/id/1012/200/200',
    userPhone: '137-3333-4444',
    content: '明天上午来看车',
    createdAt: '2026-06-17 17:20:00',
  },
  {
    id: 'mi003',
    machineId: 'm004',
    type: 'consult',
    source: 'detail',
    userName: '王老板',
    userAvatar: 'https://picsum.photos/id/1027/200/200',
    userPhone: '139-5555-6666',
    content: '有没有详细车况报告？',
    createdAt: '2026-06-17 11:40:00',
  },
  {
    id: 'mi004',
    machineId: 'm004',
    type: 'booking',
    source: 'find',
    userName: '陈老板',
    userAvatar: 'https://picsum.photos/id/1025/200/200',
    userPhone: '135-6666-7777',
    content: '约下周六看机',
    createdAt: '2026-06-16 14:30:00',
  },
  {
    id: 'mi005',
    machineId: 'm008',
    type: 'consult',
    source: 'find',
    userName: '刘总',
    userAvatar: 'https://picsum.photos/id/1011/200/200',
    userPhone: '136-7777-8888',
    content: '25吨汽车吊最低价多少？',
    createdAt: '2026-06-18 10:05:00',
  },
];

// 近7天运营趋势
export const mockDailyTrends: DailyStatsTrend[] = [
  { date: '06-12', views: 18, collects: 2, consults: 1, bookings: 0 },
  { date: '06-13', views: 24, collects: 3, consults: 2, bookings: 1 },
  { date: '06-14', views: 31, collects: 1, consults: 3, bookings: 0 },
  { date: '06-15', views: 42, collects: 4, consults: 2, bookings: 2 },
  { date: '06-16', views: 36, collects: 2, consults: 4, bookings: 1 },
  { date: '06-17', views: 58, collects: 5, consults: 3, bookings: 2 },
  { date: '06-18', views: 27, collects: 2, consults: 1, bookings: 0 },
];
