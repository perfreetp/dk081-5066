import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { mockBroadcasts } from '@/data/broadcasts';
import { CATEGORY_FILTERS } from '@/data/machines';
import type { Broadcast } from '@/types';
import FilterBar, { type FilterState } from '@/components/FilterBar';
import MachineCard from '@/components/MachineCard';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import BroadcastCard from '@/components/BroadcastCard';
import styles from './index.module.scss';

const FindPage: React.FC = () => {
  const machines = useAppStore((s) => s.machines);
  const toggleCollect = useAppStore((s) => s.toggleCollect);
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<FilterState>({
    category: 'all',
    sameCity: false,
    canViewToday: false,
    includeTransport: false,
  });

  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      if (filter.category !== 'all' && m.category !== filter.category) return false;
      if (filter.sameCity && m.city !== '成都市') return false;
      if (filter.canViewToday && !m.canViewToday) return false;
      if (filter.includeTransport && !m.includeTransport) return false;
      if (keyword && !m.title.includes(keyword) && !m.model.includes(keyword) && !m.brand.includes(keyword)) return false;
      return true;
    });
  }, [machines, filter, keyword]);

  const handleMachineClick = useCallback((id: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` });
  }, []);

  const handleBroadcastRespond = useCallback((b: Broadcast) => {
    Taro.showToast({ title: `已向${b.buyerName}推送车源`, icon: 'success' });
  }, []);

  const handleUrgentEntry = () => {
    Taro.navigateTo({ url: '/pages/message/index?tab=broadcast' });
  };

  const handleSearch = () => {
    if (!keyword) return;
    Taro.showToast({ title: `搜索"${keyword}"`, icon: 'none' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.cityRow}>
          <Text className={styles.cityIcon}>📍</Text>
          <Text className={styles.cityText}>成都市</Text>
          <Text className={styles.cityArrow}>▾</Text>
          <Text className={styles.headerSub}>工地附近 · 当天能看 · 价格透明</Text>
        </View>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜机型/品牌，如 卡特320"
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
            confirmType="search"
            onConfirm={handleSearch}
          />
          <View className={styles.searchBtn} onClick={handleSearch}>
            <Text>搜索</Text>
          </View>
        </View>
      </View>

      <FilterBar
        categories={[...CATEGORY_FILTERS]}
        filter={filter}
        onChange={setFilter}
      />

      <View
        className={styles.urgentEntry}
        onClick={handleUrgentEntry}
      >
        <View className={styles.urgentBadge}>
          <Text>急</Text>
        </View>
        <View className={styles.urgentEntryText}>
          <Text className={styles.urgentEntryTitle}>急找设备 · 广播给周边卖家</Text>
          <Text className={styles.urgentEntrySub}>已有{mockBroadcasts.length}位买家正在急找，速来应答</Text>
        </View>
        <View className={styles.urgentEntryBtn}>
          <Text className={styles.urgentEntryBtnText}>去发布</Text>
        </View>
      </View>

      <View className={styles.content}>
        <ScrollView scrollX className={styles.broadcastScroll} enhanced showScrollbar={false}>
          <View className={styles.broadcastInner}>
            {mockBroadcasts.slice(0, 3).map((b) => (
              <View key={b.id} className={styles.broadcastItem}>
                <BroadcastCard broadcast={b} onRespond={() => handleBroadcastRespond(b)} />
              </View>
            ))}
          </View>
        </ScrollView>

        <SectionHeader
          title="附近车源"
          subtitle={`${filteredMachines.length}台`}
        />

        {filteredMachines.length === 0 ? (
          <EmptyState text="没有符合条件的车源" hint="试试调整筛选条件" />
        ) : (
          <View>
            {filteredMachines.map((m) => (
              <View key={m.id} style={{ marginBottom: '24rpx' }}>
                <MachineCard
                  machine={m}
                  onClick={() => handleMachineClick(m.id)}
                  onCollect={toggleCollect}
                />
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default FindPage;
