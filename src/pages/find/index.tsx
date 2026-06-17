import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { CATEGORY_FILTERS } from '@/data/machines';
import type { Broadcast } from '@/types';
import FilterBar, { type FilterState } from '@/components/FilterBar';
import MachineCard from '@/components/MachineCard';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import BroadcastCard from '@/components/BroadcastCard';
import styles from './index.module.scss';

const CATEGORY_LABELS = CATEGORY_FILTERS.filter((c) => c.value !== 'all').map((c) => c.label);

const FindPage: React.FC = () => {
  const machines = useAppStore((s) => s.machines);
  const toggleCollect = useAppStore((s) => s.toggleCollect);
  const broadcasts = useAppStore((s) => s.broadcasts);
  const priceAlerts = useAppStore((s) => s.priceAlerts);
  const addPriceAlert = useAppStore((s) => s.addPriceAlert);

  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<FilterState>({
    category: 'all',
    sameCity: false,
    canViewToday: false,
    includeTransport: false,
  });

  const [showAlertSheet, setShowAlertSheet] = useState(false);
  const [alertCategoryLabel, setAlertCategoryLabel] = useState('挖掘机');
  const [modelKeyword, setModelKeyword] = useState('');
  const [targetPrice, setTargetPrice] = useState('20');

  const categoryKeyToLabel: Record<string, string> = {
    excavator: '挖掘机',
    loader: '装载机',
    bulldozer: '推土机',
    roller: '压路机',
    crane: '汽车吊',
    pump: '泵车',
    truck: '自卸车',
    forklift: '叉车',
  };

  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      if (m.status !== 'online') return false;
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

  const handleOpenAlert = () => {
    const catKey = filter.category === 'all' ? 'excavator' : filter.category;
    const catLabel = categoryKeyToLabel[catKey] || '挖掘机';
    setAlertCategoryLabel(catLabel);
    setModelKeyword('');
    const catMachines = machines.filter((m) => m.categoryLabel === catLabel);
    const minPrice = catMachines.length > 0
      ? Math.min(...catMachines.map((m) => m.minPrice))
      : 20;
    setTargetPrice(String(Math.floor(minPrice * 0.9)));
    setShowAlertSheet(true);
  };

  const handleSaveAlert = () => {
    const price = Number(targetPrice);
    if (!price || price <= 0) {
      Taro.showToast({ title: '请输入有效的目标价', icon: 'none' });
      return;
    }
    addPriceAlert({
      categoryLabel: alertCategoryLabel,
      modelKeyword,
      targetPrice: price,
    });
    setShowAlertSheet(false);
    Taro.showToast({ title: '已关注降价提醒', icon: 'success' });
  };

  const getCategoryMinPrice = (label: string) => {
    const catMachines = machines.filter((m) => m.categoryLabel === label);
    return catMachines.length > 0 ? Math.min(...catMachines.map((m) => m.minPrice)) : 0;
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
          <Text className={styles.urgentEntrySub}>已有{broadcasts.length}位买家正在急找，速来应答</Text>
        </View>
        <View className={styles.urgentEntryBtn}>
          <Text className={styles.urgentEntryBtnText}>去发布</Text>
        </View>
      </View>

      <View className={styles.alertEntry} onClick={handleOpenAlert}>
        <View className={styles.alertIcon}>
          <Text>🔔</Text>
        </View>
        <View className={styles.alertBody}>
          <Text className={styles.alertTitle}>降价提醒</Text>
          <Text className={styles.alertSub}>关注的机型降到目标价自动通知</Text>
        </View>
        <View className={styles.alertCount}>
          <Text className={styles.alertCountText}>{priceAlerts.length}项关注</Text>
        </View>
        <Text className={styles.alertArrow}>›</Text>
      </View>

      <View className={styles.content}>
        <ScrollView scrollX className={styles.broadcastScroll} enhanced showScrollbar={false}>
          <View className={styles.broadcastInner}>
            {broadcasts.slice(0, 3).map((b) => (
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

      {showAlertSheet && (
        <View className={styles.mask} onClick={() => setShowAlertSheet(false)}>
          <View className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <View className={styles.sheetHeader}>
              <Text className={styles.sheetTitle}>关注降价提醒</Text>
              <Text className={styles.sheetClose} onClick={() => setShowAlertSheet(false)}>✕</Text>
            </View>

            <View className={styles.sheetBody}>
              <View className={styles.formSection}>
                <Text className={styles.formLabel}>关注机型</Text>
                <View className={styles.tagRow}>
                  {CATEGORY_LABELS.map((label) => (
                    <View
                      key={label}
                      className={classnames(styles.tagItem, alertCategoryLabel === label && styles.tagActive)}
                      onClick={() => setAlertCategoryLabel(label)}
                    >
                      <Text className={styles.tagText}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.formRow}>
                <Text className={styles.formLabel}>具体型号</Text>
                <Input
                  className={styles.formInput}
                  value={modelKeyword}
                  onInput={(e) => setModelKeyword(e.detail.value)}
                  placeholder="如：20吨、220、带破碎锤"
                />
              </View>

              <View className={styles.formRow}>
                <Text className={styles.formLabel}>目标价（万元）</Text>
                <Input
                  className={styles.formInput}
                  type="digit"
                  value={targetPrice}
                  onInput={(e) => setTargetPrice(e.detail.value)}
                  placeholder="心里预期价位"
                />
              </View>

              <View className={styles.formHint}>
                <Text className={styles.formHintText}>
                  {alertCategoryLabel} 当前最低价约 ¥{getCategoryMinPrice(alertCategoryLabel)}万，
                  低于您的目标价时将自动通知
                </Text>
              </View>
            </View>

            <View className={styles.sheetFooter}>
              <View className={styles.submitBtn} onClick={handleSaveAlert}>
                <Text className={styles.submitBtnText}>保存关注</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default FindPage;
