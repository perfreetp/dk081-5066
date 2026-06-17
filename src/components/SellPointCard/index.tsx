import React from 'react';
import { View, Text } from '@tarojs/components';
import type { Machine } from '@/types';
import { buildSellPointDesc } from '@/utils/sellpoint';
import Tag from '@/components/Tag';
import styles from './index.module.scss';

interface SellPointCardProps {
  machine: Machine;
  compact?: boolean;
}

const VIDEO_LABELS: { key: keyof Machine['sellPoint']; label: string }[] = [
  { key: 'engineStart', label: '发动机启动' },
  { key: 'travelOk', label: '行走动作' },
  { key: 'slewingOk', label: '回转动作' },
  { key: 'boomOk', label: '臂架动作' },
  { key: 'noOilLeak', label: '无漏油' },
  { key: 'noRepair', label: '无大修' },
  { key: 'paperComplete', label: '手续齐全' },
];

const SellPointCard: React.FC<SellPointCardProps> = ({ machine, compact = false }) => {
  const desc = buildSellPointDesc(machine);

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <View className={styles.headerIcon}>
          <Text className={styles.emoji}>📋</Text>
        </View>
        <View className={styles.headerText}>
          <Text className={styles.title}>标准卖点卡片</Text>
          <Text className={styles.subtitle}>系统自动生成，避免描述太乱</Text>
        </View>
      </View>

      <View className={styles.highlightRow}>
        {machine.sellPoint.highlights.map((h, idx) => (
          <Tag key={idx} text={h} color="orange" size="md" />
        ))}
      </View>

      {!compact && (
        <>
          <View className={styles.inspectGrid}>
            {VIDEO_LABELS.map((item) => {
              const ok = machine.sellPoint[item.key];
              return (
                <View key={item.key} className={styles.inspectItem}>
                  <Text className={ok ? styles.inspectOk : styles.inspectFail}>
                    {ok ? '✓' : '✗'}
                  </Text>
                  <Text className={styles.inspectLabel}>{item.label}</Text>
                </View>
              );
            })}
          </View>

          <View className={styles.descBlock}>
            <Text className={styles.descText}>{desc}</Text>
          </View>
        </>
      )}
    </View>
  );
};

export default SellPointCard;
