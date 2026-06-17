import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classnames from 'classnames';
import type { Machine } from '@/types';
import { formatPrice, formatHours, formatRelativeTime } from '@/utils/format';
import Tag from '@/components/Tag';
import styles from './index.module.scss';

interface MachineCardProps {
  machine: Machine;
  onClick?: () => void;
  onCollect?: (id: string) => void;
  layout?: 'vertical' | 'horizontal';
}

const conditionLabelMap: Record<string, { text: string; color: 'orange' | 'green' | 'gray' }> = {
  excellent: { text: '车况优秀', color: 'green' },
  good: { text: '车况良好', color: 'orange' },
  fair: { text: '车况一般', color: 'gray' },
};

const MachineCard: React.FC<MachineCardProps> = ({ machine, onClick, onCollect, layout = 'vertical' }) => {
  const cond = conditionLabelMap[machine.condition] || conditionLabelMap.fair;

  return (
    <View
      className={classnames(styles.card, layout === 'horizontal' && styles.horizontal)}
      onClick={onClick}
    >
      <View className={styles.coverWrap}>
        <Image className={styles.cover} src={machine.cover} mode="aspectFill" />
        {machine.canViewToday && (
          <View className={styles.todayBadge}>
            <Text className={styles.todayText}>当天可看</Text>
          </View>
        )}
        <View className={styles.videoBadge}>
          <Text className={styles.videoText}>视频 {machine.videos.length}</Text>
        </View>
      </View>

      <View className={styles.body}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{machine.title}</Text>
        </View>

        <View className={styles.tagRow}>
          <Tag text={machine.categoryLabel} color="orange" />
          <Tag text={cond.text} color={cond.color} />
          {machine.includeTransport ? (
            <Tag text="包板车" color="blue" />
          ) : (
            <Tag text="自提" color="gray" />
          )}
        </View>

        <View className={styles.metaRow}>
          <Text className={styles.meta}>{machine.year}年</Text>
          <Text className={styles.metaDot}>·</Text>
          <Text className={styles.meta}>{formatHours(machine.hours)}</Text>
          <Text className={styles.metaDot}>·</Text>
          <Text className={styles.meta}>📹 {machine.videos.length}</Text>
        </View>

        <View className={styles.siteRow}>
          <Text className={styles.siteIcon}>📍</Text>
          <Text className={styles.siteText} numberOfLines={1}>
            {machine.site ? `${machine.site} · ${machine.city}` : machine.city}
          </Text>
        </View>

        {machine.sellPoint.highlights && machine.sellPoint.highlights.length > 0 && (
          <View className={styles.highlightRow}>
            {machine.sellPoint.highlights.slice(0, 2).map((h, i) => (
              <View key={i} className={styles.highlightChip}>
                <Text className={styles.highlightText}>{h}</Text>
              </View>
            ))}
          </View>
        )}

        <View className={styles.bottomRow}>
          <View className={styles.priceWrap}>
            <Text className={styles.priceSymbol}>¥</Text>
            <Text className={styles.price}>{formatPrice(machine.minPrice)}</Text>
            <Text className={styles.priceSuffix}>最低出手</Text>
          </View>
          <View className={styles.rightInfo}>
            <Text className={styles.time}>{formatRelativeTime(machine.publishedAt)}</Text>
            {onCollect && (
              <View
                className={styles.collectBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onCollect(machine.id);
                }}
              >
                <Text className={machine.collected ? styles.collectActive : styles.collect}>
                  {machine.collected ? '★ 已收藏' : '☆ 收藏'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default MachineCard;
