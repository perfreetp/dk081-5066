import React, { useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { mockFailRecords } from '@/data/mine';
import MachineCard from '@/components/MachineCard';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const MinePage: React.FC = () => {
  const machines = useAppStore((s) => s.machines);
  const collectedIds = useAppStore((s) => s.collectedIds);
  const toggleCollect = useAppStore((s) => s.toggleCollect);
  const priceAlerts = useAppStore((s) => s.priceAlerts);
  const bookings = useAppStore((s) => s.bookings);
  const agreements = useAppStore((s) => s.agreements);
  const handovers = useAppStore((s) => s.handovers);

  const collectedMachines = useMemo(
    () => machines.filter((m) => collectedIds.includes(m.id)),
    [machines, collectedIds]
  );

  const failStats = useMemo(() => {
    const map: Record<string, number> = { price_gap: 0, condition_mismatch: 0, paper_issue: 0 };
    mockFailRecords.forEach((f) => {
      map[f.reason] = (map[f.reason] || 0) + 1;
    });
    return map;
  }, []);

  const pendingHandovers = useMemo(() => handovers.filter((h) => h.status === 'pending').length, [handovers]);

  const handleMachineClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` });
  };

  const handleEntry = (path: string) => {
    Taro.navigateTo({ url: path });
  };

  const handleAlertClick = () => {
    Taro.navigateTo({ url: '/pages/agreement/index?tab=alert' });
  };

  const gridItems = [
    { icon: '🚜', label: '我的发车', path: '/pages/publish/index?tab=list', badge: 0 },
    { icon: '📅', label: '预约看机', path: '/pages/booking/index', badge: bookings.length },
    { icon: '📑', label: '定金协议', path: '/pages/agreement/index', badge: agreements.length },
    { icon: '✅', label: '交机清单', path: '/pages/handover/index', badge: pendingHandovers },
    { icon: '❌', label: '成交失败', path: '/pages/agreement/index?tab=fail', badge: mockFailRecords.length },
    { icon: '🔔', label: '降价提醒', path: '/pages/agreement/index?tab=alert', badge: priceAlerts.filter((p) => p.matched).length },
    { icon: '⭐', label: '我的收藏', path: '', badge: collectedMachines.length },
    { icon: '⚙️', label: '设置', path: '', badge: 0 },
  ];

  return (
    <View className={styles.page}>
      <View className={styles.userHeader}>
        <View className={styles.userInfo}>
          <Image className={styles.avatar} src="https://picsum.photos/id/64/200/200" mode="aspectFill" />
          <View className={styles.userText}>
            <Text className={styles.userName}>老王</Text>
            <View className={styles.userRole}>
              <Text className={styles.userRoleText}>个体机主 · 成都</Text>
            </View>
          </View>
        </View>
        <View className={styles.statRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{collectedMachines.length}</Text>
            <Text className={styles.statLabel}>收藏车源</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{bookings.length}</Text>
            <Text className={styles.statLabel}>预约看机</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{agreements.length}</Text>
            <Text className={styles.statLabel}>定金协议</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{mockFailRecords.length}</Text>
            <Text className={styles.statLabel}>成交失败</Text>
          </View>
        </View>
      </View>

      <View className={styles.grid}>
        {gridItems.map((g) => (
          <View
            key={g.label}
            className={styles.gridItem}
            onClick={() => g.path && handleEntry(g.path)}
          >
            <View className={styles.gridBadge}>
              <View className={styles.gridIcon}>
                <Text>{g.icon}</Text>
              </View>
              {g.badge > 0 && <Text className={styles.gridBadgeDot}>{g.badge}</Text>}
            </View>
            <Text className={styles.gridLabel}>{g.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.content}>
        <SectionHeader title="我的收藏" subtitle={`${collectedMachines.length}台`} actionText="查看全部" />
        {collectedMachines.length === 0 ? (
          <EmptyState text="还没有收藏车源" hint="逛逛找车页收藏感兴趣的设备" />
        ) : (
          collectedMachines.map((m) => (
            <View key={m.id} style={{ marginBottom: '24rpx' }}>
              <MachineCard
                machine={m}
                layout="horizontal"
                onClick={() => handleMachineClick(m.id)}
                onCollect={toggleCollect}
              />
            </View>
          ))
        )}

        <SectionHeader title="机型降价提醒" subtitle={`${priceAlerts.length}项`} actionText="管理" onAction={handleAlertClick} />
        {priceAlerts.length === 0 ? (
          <EmptyState text="还没有关注机型" hint="关注某类机型获取降价提醒" />
        ) : (
          priceAlerts.slice(0, 3).map((p) => {
            const hasMatch = p.currentMinPrice > 0;
            return (
              <View key={p.id} className={styles.alertItem} onClick={handleAlertClick}>
                <View className={styles.alertIcon}>
                  <Text>{p.matched ? '📣' : '�'}</Text>
                </View>
                <View className={styles.alertBody}>
                  <Text className={styles.alertTitle}>{p.categoryLabel} · {p.modelKeyword}</Text>
                  <Text className={styles.alertSub}>
                    目标价 ≤ {p.targetPrice}万 · 当前最低 {hasMatch ? `${p.currentMinPrice}万` : '暂无'}
                  </Text>
                </View>
                <View className={styles.alertPrice}>
                  {p.matched ? (
                    <Text className={styles.alertMatched}>已达成 ✓</Text>
                  ) : hasMatch ? (
                    <>
                      <Text className={styles.alertPriceVal}>{p.currentMinPrice}万</Text>
                      <Text className={styles.alertTarget}>未达预期</Text>
                    </>
                  ) : (
                    <Text className={styles.alertTarget}>暂无车源</Text>
                  )}
                </View>
              </View>
            );
          })
        )}

        <SectionHeader title="成交失败原因统计" subtitle="优化后续撮合" />
        <View className={styles.failSummary}>
          <View className={styles.failStat}>
            <Text className={styles.failStatNum}>{failStats.price_gap}</Text>
            <Text className={styles.failStatLabel}>价格差距大</Text>
          </View>
          <View className={styles.failStat}>
            <Text className={styles.failStatNum}>{failStats.condition_mismatch}</Text>
            <Text className={styles.failStatLabel}>车况不符</Text>
          </View>
          <View className={styles.failStat}>
            <Text className={styles.failStatNum}>{failStats.paper_issue}</Text>
            <Text className={styles.failStatLabel}>手续不齐</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default MinePage;
