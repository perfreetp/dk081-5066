// ============================================
// 工程机械二手机撮合 - 类型定义
// ============================================

// 机器类型
export type MachineCategory = 'excavator' | 'loader' | 'bulldozer' | 'crane' | 'forklift' | 'roller';

// 验机视频类型
export type VideoType = 'engine' | 'travel' | 'slewing' | 'boom';

// 车况等级
export type ConditionLevel = 'excellent' | 'good' | 'fair';

// 成交失败原因
export type FailReason = 'price_gap' | 'condition_mismatch' | 'paper_issue';

// 卖点卡片
export interface SellPoint {
  engineStart: boolean; // 发动机启动正常
  travelOk: boolean; // 行走正常
  slewingOk: boolean; // 回转正常
  boomOk: boolean; // 臂架动作正常
  noOilLeak: boolean; // 无漏油
  noRepair: boolean; // 无大修
  paperComplete: boolean; // 手续齐全
  highlights: string[]; // 标准化亮点
}

// 验机短视频
export interface VerifyVideo {
  type: VideoType;
  label: string;
  cover: string;
  url: string;
}

// 车源
export interface Machine {
  id: string;
  title: string;
  category: MachineCategory;
  categoryLabel: string;
  brand: string; // 品牌
  model: string; // 机型
  year: number; // 年份
  hours: number; // 工时表读数
  city: string; // 常驻工地城市
  site: string; // 常驻工地
  minPrice: number; // 最低出手价（万元）
  originalPrice?: number; // 原始发布价（用于对比改价）
  condition: ConditionLevel;
  cover: string; // 封面图
  images: string[];
  videos: VerifyVideo[];
  sellPoint: SellPoint;
  canViewToday: boolean; // 可当天看机
  includeTransport: boolean; // 包板车运输
  nextAvailableDate?: string; // 最近可看日期（刷新时更新）
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  publishedAt: string; // 发布时间
  collected: boolean; // 是否已收藏
  status: 'online' | 'offline' | 'sold'; // 上架 / 下架 / 已售
}

// 急找设备广播
export interface Broadcast {
  id: string;
  buyerName: string;
  buyerAvatar: string;
  categoryLabel: string;
  modelKeyword: string;
  maxPrice: number; // 预算上限（万元）
  city: string;
  canTransport: boolean;
  desc: string;
  createdAt: string;
  distanceKm: number; // 距离
}

// 会话
export interface Conversation {
  id: string;
  peerName: string;
  peerAvatar: string;
  peerRole: 'owner' | 'buyer';
  machineTitle: string;
  machineCover: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  type: 'chat' | 'broadcast' | 'booking'; // 会话类型
}

// 聊天消息
export interface ChatMessage {
  id: string;
  conversationId: string;
  fromMe: boolean;
  type: 'text' | 'inspect' | 'bargain'; // 文本 / 验机重点卡片 / 砍价记录卡片
  content: string;
  // 验机重点
  inspectTags?: string[];
  // 砍价记录
  bargainFrom?: number;
  bargainTo?: number;
  bargainNote?: string;
  createdAt: string;
}

// 预约看机
export interface Booking {
  id: string;
  machineId: string;
  machineTitle: string;
  machineCover: string;
  sellerName: string;
  sellerPhone: string;
  site: string;
  city: string;
  viewDate: string; // 可看日期
  viewTimeSlot: string; // 可看时段
  buyerName: string;
  buyerPhone: string;
  status: 'pending' | 'confirmed' | 'done' | 'failed';
}

// 定金协议
export interface DepositAgreement {
  id: string;
  machineId: string;
  machineTitle: string;
  machineCover: string;
  sellerName: string;
  sellerPhone: string;
  buyerName: string;
  buyerPhone: string;
  dealPrice: number; // 成交价（万元）
  deposit: number; // 定金（元）
  myRole: 'buyer' | 'seller'; // 当前用户身份
  paymentStatus: 'unpaid' | 'paid' | 'partial'; // 付款状态
  paymentNote?: string; // 付款备注
  handoverId?: string; // 关联的交机清单ID
  signedAt: string;
  status: 'signed' | 'handover_start' | 'completed' | 'cancelled'; // 签约定金 / 交机中 / 完成 / 取消
}

// 交机清单项
export interface HandoverItem {
  label: string;
  checked: boolean;
}

// 交机清单
export interface Handover {
  id: string;
  machineTitle: string;
  machineCover: string;
  sellerName: string;
  buyerName: string;
  handoverAt: string;
  items: HandoverItem[];
}

// 成交失败记录
export interface FailRecord {
  id: string;
  machineTitle: string;
  machineCover: string;
  reason: FailReason;
  reasonLabel: string;
  note: string;
  createdAt: string;
}

// 关注机型降价提醒
export interface PriceAlert {
  id: string;
  categoryLabel: string;
  modelKeyword: string;
  targetPrice: number;
  currentMinPrice: number;
  matched: boolean;
}
