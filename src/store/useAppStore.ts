import { create } from 'zustand';
import type { Machine, PriceAlert } from '@/types';
import { mockMachines } from '@/data/machines';
import { mockPriceAlerts } from '@/data/mine';

interface AppState {
  machines: Machine[];
  collectedIds: string[];
  priceAlerts: PriceAlert[];
  toggleCollect: (id: string) => void;
  getMachineById: (id: string) => Machine | undefined;
  addMachine: (machine: Machine) => void;
  addPriceAlert: (alert: PriceAlert) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  machines: mockMachines,
  collectedIds: mockMachines.filter((m) => m.collected).map((m) => m.id),
  priceAlerts: mockPriceAlerts,

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

  addMachine: (machine) => {
    set((state) => ({ machines: [machine, ...state.machines] }));
  },

  addPriceAlert: (alert) => {
    set((state) => ({ priceAlerts: [alert, ...state.priceAlerts] }));
  },
}));
