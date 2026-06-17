import { create } from 'zustand';
import dayjs from 'dayjs';
import type { Machine, PriceAlert, Booking, Broadcast, DepositAgreement } from '@/types';
import { mockMachines, CATEGORY_FILTERS } from '@/data/machines';
import { mockBroadcasts } from '@/data/broadcasts';
import { mockBookings, mockPriceAlerts, mockAgreements } from '@/data/mine';

interface AppState {
  // 当前用户
  currentUser: {
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

  // 预约看机
  addBooking: (booking: Booking) => void;

  // 急找广播
  addBroadcast: (broadcast: Broadcast) => void;

  // 降价提醒
  addPriceAlert: (alert: Omit<PriceAlert, 'id' | 'currentMinPrice' | 'matched'>) => void;
  removePriceAlert: (id: string) => void;
  refreshPriceAlertMatches: () => void;

  // 定金协议
  addAgreement: (agreement: DepositAgreement) => void;
}

// 计算某类机型的当前最低价
const calcMinPriceFor = (machines: Machine[], categoryLabel: string, modelKeyword: string): number => {
  const filtered = machines.filter((m) => {
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
    name: '老王',
    phone: '139-9000-5678',
    city: '成都市',
    avatar: 'https://picsum.photos/id/64/200/200',
  },

  machines: mockMachines,
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
      machines: [machine, ...state.machines],
      myMachineIds: [machine.id, ...state.myMachineIds],
    }));
  },

  addBooking: (booking) => {
    set((state) => ({
      bookings: [booking, ...state.bookings],
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
}));
