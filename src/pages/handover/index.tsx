import React, { useState, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { mockHandovers, FAIL_REASON_OPTIONS } from '@/data/mine';
import type { HandoverItem, FailReason } from '@/types';
import { formatDate } from '@/utils/format';
import styles from './index.module.scss';

const HandoverPage: React.FC = () => {
  const handover = mockHandovers[0];
  const [items, setItems] = useState<HandoverItem[]>(handover ? handover.items : []);
  const [failReason, setFailReason] = useState<FailReason | null>(null);

  const checkedCount = useMemo(() => items.filter((i) => i.checked).length, [items]);
  const progress = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  const toggleItem = (idx: number) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, checked: !it.checked } : it)));
  };

  const handleConfirm = () => {
    if (checkedCount < items.length) {
      Taro.showToast({ title: '请完成全部检查项', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '交机确认',
      content: '双方已确认交机清单，交易完成！定金已转尾款。',
      showCancel: false,
      confirmText: '完成',
      success: () => Taro.navigateBack(),
    });
  };

  const handleMarkFail = () => {
    if (!failReason) {
      Taro.showToast({ title: '请选择成交失败原因', icon: 'none' });
      return;
    }
    const reasonLabel = FAIL_REASON_OPTIONS.find((r) => r.value === failReason)?.label || '';
    Taro.showModal({
      title: '标记成交失败',
      content: `已记录失败原因：${reasonLabel}。该信息将用于优化后续撮合推荐。`,
      showCancel: false,
      confirmText: '已记录',
      success: () => Taro.navigateBack(),
    });
  };

  if (!handover) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '48rpx', textAlign: 'center' }}>
          <Text>暂无交机清单</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={styles.machineCard}>
          <Image className={styles.machineCover} src={handover.machineCover} mode="aspectFill" />
          <View className={styles.machineBody}>
            <Text className={styles.machineTitle}>{handover.machineTitle}</Text>
            <Text className={styles.machineParty}>卖方：{handover.sellerName} → 买方：{handover.buyerName}</Text>
            <Text className={styles.machineTime}>交机时间：{formatDate(handover.handoverAt, 'YYYY-MM-DD HH:mm')}</Text>
          </View>
        </View>

        <View className={styles.progressCard}>
          <View className={styles.progressTop}>
            <Text className={styles.progressLabel}>交机检查进度</Text>
            <Text className={styles.progressValue}>{checkedCount}/{items.length}</Text>
          </View>
          <View className={styles.progressBar}>
            <View className={styles.progressFill} style={{ width: `${progress}%` }} />
          </View>
          <Text className={styles.progressHint}>双方共同核验，全部勾选后可确认交机</Text>
        </View>

        <View className={styles.checkList}>
          <Text className={styles.sectionTitle}>
            <Text>📋</Text> 交机检查项
          </Text>
          {items.map((it, idx) => (
            <View key={idx} className={styles.checkItem} onClick={() => toggleItem(idx)}>
              <View className={classnames(styles.checkBox, it.checked && styles.checked)}>
                <Text>{it.checked ? '✓' : ''}</Text>
              </View>
              <Text className={styles.checkLabel}>{it.label}</Text>
              <Text className={classnames(styles.checkStatus, it.checked && styles.checkedStatus)}>
                {it.checked ? '已确认' : '待核验'}
              </Text>
            </View>
          ))}
        </View>

        <View className={styles.failSection}>
          <Text className={styles.failTitle}>
            <Text>❌</Text> 成交失败标记
          </Text>
          <Text className={styles.failDesc}>若本次未能成交，请选择失败原因，用于优化后续撮合</Text>
          <View className={styles.reasonRow}>
            {FAIL_REASON_OPTIONS.map((r) => (
              <View
                key={r.value}
                className={classnames(styles.reasonItem, failReason === r.value && styles.reasonActive)}
                onClick={() => setFailReason(r.value)}
              >
                <Text className={styles.reasonText}>{r.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.footer}>
        <View className={styles.failBtn} onClick={handleMarkFail}>
          <Text className={styles.failBtnText}>标记失败</Text>
        </View>
        <View className={styles.confirmBtn} onClick={handleConfirm}>
          <Text className={styles.confirmBtnText}>确认交机</Text>
        </View>
      </View>
    </View>
  );
};

export default HandoverPage;
