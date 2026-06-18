import { create } from 'zustand';
import dayjs from 'dayjs';
import type { Machine, PriceAlert, Booking, Broadcast, DepositAgreement, Handover, HandoverItem, MachineOpLog, MachineStats, Fulfillment, FulfillmentStep, MachineInteraction, DailyStatsTrend } from '@/types';
import { mockMachines, CATEGORY_FILTERS } from '@/data/machines';
import { mockBroadcasts } from '@/data/broadcasts';
import { mockBookings, mockPriceAlerts, mockAgreements, mockHandovers, mockFulfillments, mockMachineInteractions, mockDailyTrends } from '@/data/mine';

// 默认检查项模板（从协议启动交机时使用）
const DEFAULT_HANDOVER_ITEMS: HandoverItem[] = [
  { label: '机器实体验收（与视频一致）', checked: false },
  { label: '发动机/变速箱运转正常', checked: false },
  { label: '液压系统无漏油', checked: false },
  { label: '随车工具齐全', checked: false },
  { label: '购车发票原件', checked: false },
  { label: '合格证原件', checked: false },
  { label: '登记证书（大绿本）', checked: false },
  { label: '尾款结清凭证', checked: false },
];

const DEFAULT_STATS: MachineStats = { views: 0, collects: 0, consults: 0, bookings: 0 };

interface AppState {
  // 当前用户
  currentUser: {
    id: string;
    name: string;
    phone: string;
    city: string;
    avatar: string;
  };

  // 车源（含 mock + 用户发布的）
  machines: Machine[];
  collectedIds: string[];
  myMachineIds: string[];

  // 车源操作记录
  machineOpLogs: MachineOpLog[];

  // 预约记录
  bookings: Booking[];

  // 急找广播
  broadcasts: Broadcast[];

  // 降价提醒
  priceAlerts: PriceAlert[];

  // 定金协议
  agreements: DepositAgreement[];

  // 交机清单
  handovers: Handover[];

  // 履约进度
  fulfillments: Fulfillment[];

  // 车源咨询/预约明细
  machineInteractions: MachineInteraction[];

  // 近7天运营趋势
  dailyTrends: DailyStatsTrend[];

  // Actions
  toggleCollect: (id: string) => void;
  getMachineById: (id: string) => Machine | undefined;
  getMachineOpLogs: (machineId: string) => MachineOpLog[];
  getHandoverByAgreement: (agreementId: string) => Handover | undefined;
  getFulfillmentByAgreement: (agreementId: string) => Fulfillment | undefined;
  getInteractionsForMachine: (machineId: string) => MachineInteraction[];
  getDailyTrendsForMachine: (machineId?: string) => DailyStatsTrend[];

  // 发布车源
  publishMachine: (machine: Machine) => void;

  // 车源管理
  updateMachinePrice: (id: string, newPrice: number) => void;
  toggleMachineStatus: (id: string, status: Machine['status']) => void;
  refreshAvailable: (id: string, canViewToday: boolean, nextDate: string) => void;
  incMachineStat: (id: string, key: keyof MachineStats) => void;

  // 预约看机
  addBooking: (booking: Booking) => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  rescheduleBooking: (id: string, viewDate: string, viewTimeSlot: string) => void;

  // 急找广播
  addBroadcast: (broadcast: Broadcast) => void;

  // 降价提醒
  addPriceAlert: (alert: Omit<PriceAlert, 'id' | 'currentMinPrice' | 'matched'>) => void;
  removePriceAlert: (id: string) => void;
  refreshPriceAlertMatches: () => void;
  getMatchedMachines: (categoryLabel: string, modelKeyword: string) => Machine[];

  // 定金协议
  addAgreement: (agreement: DepositAgreement) => void;
  updateAgreementPayment: (id: string, status: DepositAgreement['paymentStatus'], note?: string) => void;
  startHandover: (id: string) => string; // 返回 handoverId
  completeAgreement: (id: string) => void;
  completeHandover: (agreementId: string) => void; // 完成交机并同步协议状态
  markHandoverFailed: (agreementId: string, reasonLabel: string) => void;

  // 履约进度
  createFulfillment: (agreementId: string) => Fulfillment;
  markFulfillmentStepDone: (agreementId: string, stepKey: FulfillmentStep['key'], note?: string) => void;
  setFinalPayment: (agreementId: string, amount: number) => void;
  setFollowupNote: (agreementId: string, note: string) => void;
}

// 计算某类机型的当前最低价
const calcMinPriceFor = (machines: Machine[], categoryLabel: string, modelKeyword: string): number => {
  const matched = matchMachinesFor(machines, categoryLabel, modelKeyword);
  if (matched.length === 0) return 0;
  return Math.min(...matched.map((m) => m.minPrice));
};

// 命中车源（按机型维度匹配，支持空格分词的 AND 匹配）
const matchMachinesFor = (machines: Machine[], categoryLabel: string, modelKeyword: string): Machine[] => {
  const keywords = modelKeyword
    ? modelKeyword.toLowerCase().split(/\s+/).filter(Boolean)
    : [];
  return machines.filter((m) => {
    if (m.status !== 'online') return false;
    if (categoryLabel && m.categoryLabel !== categoryLabel) return false;
    if (keywords.length > 0) {
      const haystack = `${m.model} ${m.title} ${m.brand}`.toLowerCase();
      return keywords.every((kw) => haystack.includes(kw));
    }
    return true;
  });
};

const pushOpLog = (logs: MachineOpLog[], machineId: string, type: MachineOpLog['type'], label: string, detail?: string): MachineOpLog[] => {
  const log: MachineOpLog = {
    id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    machineId,
    type,
    label,
    createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    detail,
  };
  return [log, ...logs].slice(0, 50);
};

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: {
    id: 'u_self',
    name: '老王',
    phone: '139-9000-5678',
    city: '成都市',
    avatar: 'https://picsum.photos/id/64/200/200',
  },

  machines: mockMachines.map((m, idx) => ({
    ...m,
    status: (m.status || 'online') as Machine['status'],
    originalPrice: m.originalPrice || m.minPrice,
    stats: m.stats || { views: 30 + idx * 12, collects: 2 + (idx % 4), consults: 1 + (idx % 5), bookings: idx % 3 },
  })),
  collectedIds: mockMachines.filter((m) => m.collected).map((m) => m.id),
  myMachineIds: [],
  machineOpLogs: [],
  bookings: mockBookings,
  broadcasts: mockBroadcasts,
  priceAlerts: mockPriceAlerts,
  agreements: mockAgreements,
  handovers: mockHandovers,
  fulfillments: mockFulfillments,
  machineInteractions: mockMachineInteractions,
  dailyTrends: mockDailyTrends,

  toggleCollect: (id) => {
    set((state) => {
      const has = state.collectedIds.includes(id);
      return {
        collectedIds: has
          ? state.collectedIds.filter((cid) => cid !== id)
          : [...state.collectedIds, id],
        machines: state.machines.map((m) =>
          m.id === id
            ? {
                ...m,
                collected: !has,
                stats: { ...m.stats, collects: Math.max(0, m.stats.collects + (has ? -1 : 1)) },
              }
            : m
        ),
      };
    });
  },

  getMachineById: (id) => get().machines.find((m) => m.id === id),

  getMachineOpLogs: (machineId) => get().machineOpLogs.filter((l) => l.machineId === machineId),

  getHandoverByAgreement: (agreementId) => get().handovers.find((h) => h.agreementId === agreementId),

  getFulfillmentByAgreement: (agreementId) => get().fulfillments.find((f) => f.agreementId === agreementId),

  getInteractionsForMachine: (machineId) => get().machineInteractions.filter((x) => x.machineId === machineId),

  getDailyTrendsForMachine: (_machineId?) => get().dailyTrends,

  publishMachine: (machine) => {
    set((state) => ({
      machines: [{ ...machine, status: 'online', originalPrice: machine.originalPrice || machine.minPrice, stats: machine.stats || { ...DEFAULT_STATS } }, ...state.machines],
      myMachineIds: [machine.id, ...state.myMachineIds],
      machineOpLogs: pushOpLog(state.machineOpLogs, machine.id, 'publish', '发布车源上线'),
    }));
    get().refreshPriceAlertMatches();
  },

  // 车源管理
  updateMachinePrice: (id, newPrice) => {
    set((state) => {
      const m = state.machines.find((x) => x.id === id);
      const oldPrice = m?.minPrice || 0;
      const diff = +(newPrice - oldPrice).toFixed(1);
      const detail = diff < 0 ? `由 ¥${oldPrice}万 → ¥${newPrice}万（降价 ¥${Math.abs(diff)}万）` : `由 ¥${oldPrice}万 → ¥${newPrice}万（涨价 ¥${diff}万）`;
      return {
        machines: state.machines.map((x) =>
          x.id === id ? { ...x, minPrice: newPrice } : x
        ),
        machineOpLogs: pushOpLog(state.machineOpLogs, id, 'price', '改价', detail),
      };
    });
    get().refreshPriceAlertMatches();
  },

  toggleMachineStatus: (id, status) => {
    set((state) => {
      const labelMap: Record<Machine['status'], string> = { online: '上架', offline: '下架', sold: '标记已售' };
      return {
        machines: state.machines.map((m) =>
          m.id === id ? { ...m, status } : m
        ),
        machineOpLogs: pushOpLog(state.machineOpLogs, id, status, labelMap[status]),
      };
    });
    get().refreshPriceAlertMatches();
  },

  refreshAvailable: (id, canViewToday, nextDate) => {
    set((state) => ({
      machines: state.machines.map((m) =>
        m.id === id ? { ...m, canViewToday, nextAvailableDate: nextDate } : m
      ),
      machineOpLogs: pushOpLog(
        state.machineOpLogs,
        id,
        'refresh',
        '刷新可看时间',
        canViewToday ? `当天可看，时段 ${nextDate}` : `最近可看：${nextDate}`
      ),
    }));
  },

  incMachineStat: (id, key) => {
    set((state) => ({
      machines: state.machines.map((m) =>
        m.id === id ? { ...m, stats: { ...m.stats, [key]: m.stats[key] + 1 } } : m
      ),
    }));
  },

  addBooking: (booking) => {
    set((state) => ({
      bookings: [booking, ...state.bookings],
      machines: state.machines.map((m) =>
        m.id === booking.machineId ? { ...m, stats: { ...m.stats, bookings: m.stats.bookings + 1 } } : m
      ),
    }));
  },

  updateBookingStatus: (id, status) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, status } : b
      ),
    }));
  },

  rescheduleBooking: (id, viewDate, viewTimeSlot) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, viewDate, viewTimeSlot, status: 'pending' } : b
      ),
    }));
  },

  addBroadcast: (broadcast) => {
    set((state) => ({
      broadcasts: [broadcast, ...state.broadcasts],
    }));
  },

  addPriceAlert: (alert) => {
    const id = `pa_${Date.now()}`;
    const matchedMachines = matchMachinesFor(get().machines, alert.categoryLabel, alert.modelKeyword || '');
    const currentMinPrice = matchedMachines.length > 0 ? Math.min(...matchedMachines.map((m) => m.minPrice)) : 0;
    const matched = currentMinPrice > 0 && currentMinPrice <= alert.targetPrice;
    const newAlert: PriceAlert = {
      ...alert,
      id,
      currentMinPrice,
      matched,
    };
    set((state) => ({
      priceAlerts: [newAlert, ...state.priceAlerts],
    }));
  },

  removePriceAlert: (id) => {
    set((state) => ({
      priceAlerts: state.priceAlerts.filter((a) => a.id !== id),
    }));
  },

  refreshPriceAlertMatches: () => {
    const { machines, priceAlerts } = get();
    const updated = priceAlerts.map((a) => {
      const matchedMachines = matchMachinesFor(machines, a.categoryLabel, a.modelKeyword || '');
      const minPrice = matchedMachines.length > 0 ? Math.min(...matchedMachines.map((m) => m.minPrice)) : 0;
      return {
        ...a,
        currentMinPrice: minPrice,
        matched: minPrice > 0 && minPrice <= a.targetPrice,
      };
    });
    set({ priceAlerts: updated });
  },

  getMatchedMachines: (categoryLabel, modelKeyword) =>
    matchMachinesFor(get().machines, categoryLabel, modelKeyword || ''),

  addAgreement: (agreement) => {
    set((state) => ({
      agreements: [agreement, ...state.agreements],
    }));
  },

  updateAgreementPayment: (id, status, note) => {
    set((state) => ({
      agreements: state.agreements.map((a) =>
        a.id === id ? { ...a, paymentStatus: status, paymentNote: note || a.paymentNote } : a
      ),
    }));
  },

  startHandover: (id) => {
    const ag = get().agreements.find((a) => a.id === id);
    if (!ag) return '';
    const existing = get().handovers.find((h) => h.agreementId === id);
    if (existing) {
      set((state) => ({
        agreements: state.agreements.map((a) =>
          a.id === id ? { ...a, status: 'handover_start', handoverId: existing.id } : a
        ),
      }));
      return existing.id;
    }
    const handoverId = `hd_${Date.now()}`;
    const newHandover: Handover = {
      id: handoverId,
      agreementId: id,
      machineId: ag.machineId,
      machineTitle: ag.machineTitle,
      machineCover: ag.machineCover,
      sellerName: ag.sellerName,
      sellerPhone: ag.sellerPhone,
      buyerName: ag.buyerName,
      buyerPhone: ag.buyerPhone,
      dealPrice: ag.dealPrice,
      deposit: ag.deposit,
      handoverAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      items: DEFAULT_HANDOVER_ITEMS.map((i) => ({ ...i })),
      status: 'pending',
    };
    set((state) => ({
      agreements: state.agreements.map((a) =>
        a.id === id ? { ...a, status: 'handover_start', handoverId } : a
      ),
      handovers: [newHandover, ...state.handovers],
    }));
    return handoverId;
  },

  completeAgreement: (id) => {
    set((state) => {
      const ag = state.agreements.find((a) => a.id === id);
      const handover = state.handovers.find((h) => h.agreementId === id);
      const soldMachineId = handover?.machineId || ag?.machineId;
      return {
        agreements: state.agreements.map((a) =>
          a.id === id ? { ...a, status: 'completed' } : a
        ),
        // 交机清单也同步完成
        handovers: state.handovers.map((h) =>
          h.agreementId === id
            ? { ...h, status: 'done', items: h.items.map((i) => ({ ...i, checked: true })) }
            : h
        ),
        // 车源标记为已售
        machines: soldMachineId
          ? state.machines.map((m) =>
              m.id === soldMachineId ? { ...m, status: 'sold' as Machine['status'] } : m
            )
          : state.machines,
        machineOpLogs: soldMachineId
          ? pushOpLog(state.machineOpLogs, soldMachineId, 'sold', '交易完成，车源已成交')
          : state.machineOpLogs,
      };
    });
  },

  completeHandover: (agreementId) => {
    set((state) => {
      const handover = state.handovers.find((h) => h.agreementId === agreementId);
      return {
        handovers: state.handovers.map((h) =>
          h.agreementId === agreementId
            ? { ...h, status: 'done', items: h.items.map((i) => ({ ...i, checked: true })) }
            : h
        ),
        agreements: state.agreements.map((a) =>
          a.id === agreementId ? { ...a, status: 'completed' } : a
        ),
        // 同步把车源标记为已售，并记一条操作日志
        machines: handover
          ? state.machines.map((m) =>
              m.id === handover.machineId ? { ...m, status: 'sold' as Machine['status'] } : m
            )
          : state.machines,
        machineOpLogs: handover
          ? pushOpLog(state.machineOpLogs, handover.machineId, 'sold', '交机完成，车源已售出')
          : state.machineOpLogs,
      };
    });
  },

  markHandoverFailed: (agreementId, reasonLabel) => {
    set((state) => ({
      handovers: state.handovers.map((h) =>
        h.agreementId === agreementId ? { ...h, status: 'failed' } : h
      ),
      agreements: state.agreements.map((a) =>
        a.id === agreementId ? { ...a, status: 'cancelled' } : a
      ),
    }));
    void reasonLabel;
  },

  // 创建履约进度记录（如果已存在则返回已有）
  createFulfillment: (agreementId) => {
    const existing = get().fulfillments.find((f) => f.agreementId === agreementId);
    if (existing) return existing;
    const ag = get().agreements.find((a) => a.id === agreementId);
    const initSteps: FulfillmentStep[] = [
      { key: 'deposit', label: '定金到账', done: false },
      { key: 'handover', label: '现场交机', done: false },
      { key: 'final_payment', label: '尾款结清', done: false },
      { key: 'followup', label: '售后回访', done: false },
    ];
    if (ag?.paymentStatus === 'paid') {
      initSteps[0].done = true;
      initSteps[0].at = ag.signedAt;
      initSteps[0].note = '定金已全额到账';
    }
    if (ag?.paymentStatus === 'partial') {
      initSteps[0].done = true;
      initSteps[0].at = ag.signedAt;
      initSteps[0].note = ag.paymentNote || '部分定金已到账，待补齐';
    }
    // 如果已完成交机或已完成整个协议，提前勾上
    const hd = get().handovers.find((h) => h.agreementId === agreementId);
    if (hd?.status === 'done') {
      initSteps[1].done = true;
      initSteps[1].at = hd.handoverAt;
    }
    if (ag?.status === 'completed') {
      initSteps[2].done = true;
      initSteps[3].done = true;
    }
    // 计算当前进行中步骤
    const firstUndone = initSteps.findIndex((s) => !s.done);
    const currentStep = firstUndone === -1 ? initSteps.length - 1 : firstUndone;
    const newF: Fulfillment = {
      id: `ff_${Date.now()}`,
      agreementId,
      steps: initSteps,
      currentStep,
      finalPayment: ag ? Math.max(0, Math.round(ag.dealPrice * 10000 - ag.deposit)) : undefined,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };
    set((state) => ({
      fulfillments: [newF, ...state.fulfillments],
    }));
    return newF;
  },

  markFulfillmentStepDone: (agreementId, stepKey, note) => {
    set((state) => {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
      const updated = state.fulfillments.map((f) => {
        if (f.agreementId !== agreementId) return f;
        const newSteps = f.steps.map((s, idx) => {
          if (s.key !== stepKey) return s;
          // 同时自动将之前所有未勾选的也视为已完成
          return { ...s, done: true, at: s.at || now, note: note || s.note };
        });
        // 将该步骤之前的所有步骤全部视为完成（顺序保证）
        const stepIdx = newSteps.findIndex((s) => s.key === stepKey);
        for (let i = 0; i < stepIdx; i++) {
          if (!newSteps[i].done) {
            newSteps[i] = { ...newSteps[i], done: true, at: now };
          }
        }
        const firstUndone = newSteps.findIndex((s) => !s.done);
        const currentStep = firstUndone === -1 ? newSteps.length - 1 : firstUndone;
        return { ...f, steps: newSteps, currentStep, updatedAt: now };
      });
      return { fulfillments: updated };
    });
  },

  setFinalPayment: (agreementId, amount) => {
    set((state) => ({
      fulfillments: state.fulfillments.map((f) =>
        f.agreementId === agreementId ? { ...f, finalPayment: amount } : f
      ),
    }));
  },

  setFollowupNote: (agreementId, note) => {
    set((state) => ({
      fulfillments: state.fulfillments.map((f) =>
        f.agreementId === agreementId ? { ...f, followupNote: note } : f
      ),
    }));
  },
}));

// 初始化时校正降价提醒匹配状态，确保 mock 数据与真实车源一致
useAppStore.getState().refreshPriceAlertMatches();
