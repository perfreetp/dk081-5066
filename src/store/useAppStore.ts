import { create } from 'zustand';
import dayjs from 'dayjs';
import type { Machine, PriceAlert, Booking, Broadcast, DepositAgreement } from '@/types';
import { mockMachines, CATEGORY_FILTERS } from '@/data/machines';
import { mockBroadcasts } from '@/data/broadcasts';
import { mockBookings, mockPriceAlerts, mockAgreements } from '@/data/mine';

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

  // 预约记录
  bookings: Booking[];

  // 急找广播
  broadcasts: Broadcast[];

  // 降价提醒
  priceAlerts: PriceAlert[];

  // 定金协议
  agreements: DepositAgreement[];

  // Actions
  toggleCollect: (id: string) => void;
  getMachineById: (id: string) => Machine | undefined;

  // 发布车源
  publishMachine: (machine: Machine) => void;

  // 车源管理
  updateMachinePrice: (id: string, newPrice: number) => void;
  toggleMachineStatus: (id: string, status: Machine['status']) => void;
  refreshAvailable: (id: string, canViewToday: boolean, nextDate: string) => void;

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

  // 定金协议
  addAgreement: (agreement: DepositAgreement) => void;
  updateAgreementPayment: (id: string, status: DepositAgreement['paymentStatus'], note?: string) => void;
  startHandover: (id: string) => string; // 返回 handoverId
  completeAgreement: (id: string) => void;
}

// 计算某类机型的当前最低价
const calcMinPriceFor = (machines: Machine[], categoryLabel: string, modelKeyword: string): number => {
  const filtered = machines.filter((m) => {
    if (m.status !== 'online') return false;
    if (categoryLabel && m.categoryLabel !== categoryLabel) return false;
    if (modelKeyword) {
      const kw = modelKeyword.toLowerCase();
      if (
        !m.model.toLowerCase().includes(kw) &&
        !m.title.toLowerCase().includes(kw) &&
        !m.brand.toLowerCase().includes(kw)
      ) {
        return false;
      }
    }
    return true;
  });
  if (filtered.length === 0) return 0;
  return Math.min(...filtered.map((m) => m.minPrice));
};

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: {
    id: 'u_self',
    name: '老王',
    phone: '139-9000-5678',
    city: '成都市',
    avatar: 'https://picsum.photos/id/64/200/200',
  },

  machines: mockMachines.map((m) => ({ ...m, status: (m.status || 'online') as Machine['status'], originalPrice: m.originalPrice || m.minPrice })),
  collectedIds: mockMachines.filter((m) => m.collected).map((m) => m.id),
  myMachineIds: [],
  bookings: mockBookings,
  broadcasts: mockBroadcasts,
  priceAlerts: mockPriceAlerts,
  agreements: mockAgreements,

  toggleCollect: (id) => {
    set((state) => {
      const has = state.collectedIds.includes(id);
      return {
        collectedIds: has
          ? state.collectedIds.filter((cid) => cid !== id)
          : [...state.collectedIds, id],
        machines: state.machines.map((m) =>
          m.id === id ? { ...m, collected: !has } : m
        ),
      };
    });
  },

  getMachineById: (id) => get().machines.find((m) => m.id === id),

  publishMachine: (machine) => {
    set((state) => ({
      machines: [{ ...machine, status: 'online', originalPrice: machine.originalPrice || machine.minPrice }, ...state.machines],
      myMachineIds: [machine.id, ...state.myMachineIds],
    }));
    // 发布后刷新降价提醒匹配
    get().refreshPriceAlertMatches();
  },

  // 车源管理
  updateMachinePrice: (id, newPrice) => {
    set((state) => ({
      machines: state.machines.map((m) =>
        m.id === id ? { ...m, minPrice: newPrice } : m
      ),
    }));
    get().refreshPriceAlertMatches();
  },

  toggleMachineStatus: (id, status) => {
    set((state) => ({
      machines: state.machines.map((m) =>
        m.id === id ? { ...m, status } : m
      ),
    }));
  },

  refreshAvailable: (id, canViewToday, nextDate) => {
    set((state) => ({
      machines: state.machines.map((m) =>
        m.id === id ? { ...m, canViewToday, nextAvailableDate: nextDate } : m
      ),
    }));
  },

  addBooking: (booking) => {
    set((state) => ({
      bookings: [booking, ...state.bookings],
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
    const currentMinPrice = calcMinPriceFor(get().machines, alert.categoryLabel, alert.modelKeyword || '');
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
      const minPrice = calcMinPriceFor(machines, a.categoryLabel, a.modelKeyword || '');
      return {
        ...a,
        currentMinPrice: minPrice || a.currentMinPrice,
        matched: minPrice > 0 && minPrice <= a.targetPrice,
      };
    });
    set({ priceAlerts: updated });
  },

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
    const handoverId = `hd_${Date.now()}`;
    set((state) => ({
      agreements: state.agreements.map((a) =>
        a.id === id ? { ...a, status: 'handover_start', handoverId } : a
      ),
    }));
    return handoverId;
  },

  completeAgreement: (id) => {
    set((state) => ({
      agreements: state.agreements.map((a) =>
        a.id === id ? { ...a, status: 'completed' } : a
      ),
    }));
  },
}));
