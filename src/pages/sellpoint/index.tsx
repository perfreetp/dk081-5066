import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { mockMachines } from '@/data/machines';
import { buildSellPointDesc } from '@/utils/sellpoint';
import SellPointCard from '@/components/SellPointCard';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const SellpointPage: React.FC = () => {
  const router = useRouter();
  const id = router.params.id || '';
  const machine = useAppStore((s) => s.getMachineById(id)) || mockMachines[0];

  const handleCopy = () => {
    if (!machine) return;
    const desc = buildSellPointDesc(machine);
    Taro.setClipboardData({
      data: desc,
      success: () => Taro.showToast({ title: '已复制卖点描述', icon: 'success' }),
      fail: (err) => {
        console.error('[Sellpoint] copy failed', err);
        Taro.showToast({ title: '复制失败', icon: 'none' });
      },
    });
  };

  const handleShare = () => {
    Taro.showToast({ title: '已生成分享卡片', icon: 'success' });
  };

  if (!machine) {
    return (
      <View className={styles.page}>
        <View className={styles.content}>
          <EmptyState text="车源不存在" />
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={styles.headerCard}>
          <View className={styles.headerIcon}>
            <Text>📋</Text>
          </View>
          <View className={styles.headerText}>
            <Text className={styles.headerTitle}>{machine.title}</Text>
            <Text className={styles.headerSub}>系统自动生成标准卖点，避免描述太乱</Text>
          </View>
        </View>

        <SellPointCard machine={machine} />
      </View>

      <View className={styles.footer}>
        <View className={styles.copyBtn} onClick={handleCopy}>
          <Text className={styles.copyBtnText}>复制描述</Text>
        </View>
        <View className={styles.shareBtn} onClick={handleShare}>
          <Text className={styles.shareBtnText}>分享卖点卡片</Text>
        </View>
      </View>
    </View>
  );
};

export default SellpointPage;
