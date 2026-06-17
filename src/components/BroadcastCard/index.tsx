import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import type { Broadcast } from '@/types';
import { formatPrice, formatRelativeTime, formatDistance } from '@/utils/format';
import Tag from '@/components/Tag';
import styles from './index.module.scss';

interface BroadcastCardProps {
  broadcast: Broadcast;
  onRespond?: (id: string) => void;
}

const BroadcastCard: React.FC<BroadcastCardProps> = ({ broadcast, onRespond }) => {
  return (
    <View className={styles.card}>
      <View className={styles.topBar}>
        <Text className={styles.urgent}>急</Text>
        <Text className={styles.urgentLabel}>急找设备</Text>
        <Text className={styles.time}>{formatRelativeTime(broadcast.createdAt)}</Text>
      </View>

      <View className={styles.userInfo}>
        <Image className={styles.avatar} src={broadcast.buyerAvatar} mode="aspectFill" />
        <View className={styles.userText}>
          <Text className={styles.name}>{broadcast.buyerName}</Text>
          <Text className={styles.location}>{broadcast.city} · {formatDistance(broadcast.distanceKm)}</Text>
        </View>
      </View>

      <View className={styles.needRow}>
        <Tag text={broadcast.categoryLabel} color="orange" />
        <Tag text={broadcast.modelKeyword} color="blue" />
        <View className={styles.budget}>
          <Text className={styles.budgetLabel}>预算≤</Text>
          <Text className={styles.budgetValue}>{formatPrice(broadcast.maxPrice)}</Text>
        </View>
      </View>

      <Text className={styles.desc}>{broadcast.desc}</Text>

      <View className={styles.footer}>
        <View className={styles.transport}>
          <Text className={broadcast.canTransport ? styles.transportYes : styles.transportNo}>
            {broadcast.canTransport ? '✓ 需包板车运输' : '✗ 不需运输'}
          </Text>
        </View>
        <View className={styles.respondBtn} onClick={() => onRespond?.(broadcast.id)}>
          <Text className={styles.respondText}>我有这台机</Text>
        </View>
      </View>
    </View>
  );
};

export default BroadcastCard;
