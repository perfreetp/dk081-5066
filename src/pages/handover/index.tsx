import React, { useState, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { FAIL_REASON_OPTIONS } from '@/data/mine';
import type { HandoverItem, FailReason } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { formatPrice, formatDate } from '@/utils/format';
import styles from './index.module.scss';

const HandoverPage: React.FC = () => {
  const router = useRouter();
  const agreementId = router.params.agreementId as string | undefined;

  const handovers = useAppStore((s) => s.handovers);
  const agreements = useAppStore((s) => s.agreements);
  const completeHandover = useAppStore((s) => s.completeHandover);
  const markHandoverFailed = useAppStore((s) => s.markHandoverFailed);

  // 找到对应交机清单：优先按 agreementId 找，没找到则用第一项
  const handover = useMemo(() => {
    if (agreementId) {
      return handovers.find((h) => h.agreementId === agreementId);
    }
    return handovers[0];
  }, [agreementId, handovers]);

  // 同步协议（用于展示买卖身份等）
  const agreement = useMemo(() => {
    if (handover?.agreementId) {
      return agreements.find((a) => a.id === handover.agreementId);
    }
    return undefined;
  }, [handover, agreements]);

  const [items, setItems] = useState<HandoverItem[]>(handover ? handover.items : []);
  const [failReason, setFailReason] = useState<FailReason | null>(null);

  const checkedCount = useMemo(() => items.filter((i) => i.checked).length, [items]);
  const progress = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  const toggleItem = (idx: number) => {
    if (handover?.status === 'done' || handover?.status === 'failed') return;
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, checked: !it.checked } : it)));
  };

  const handleConfirm = () => {
    if (!handover) return;
    if (checkedCount < items.length) {
      Taro.showToast({ title: '请完成全部检查项', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '交机确认',
      content: '双方已确认交机清单，交易完成！定金已转尾款。',
      showCancel: false,
      confirmText: '完成',
      success: () => {
        completeHandover(handover.agreementId);
        Taro.showToast({ title: '交易已完成', icon: 'success' });
        setTimeout(() => Taro.navigateBack(), 600);
      },
    });
  };

  const handleMarkFail = () => {
    if (!handover) return;
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
      success: () => {
        markHandoverFailed(handover.agreementId, reasonLabel);
        Taro.showToast({ title: '已标记失败', icon: 'success' });
        setTimeout(() => Taro.navigateBack(), 600);
      },
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

  const isReadOnly = handover.status === 'done' || handover.status === 'failed';
  const roleText = agreement ? (agreement.myRole === 'buyer' ? '我是买方' : '我是卖方') : '';

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        <View className={styles.machineCard}>
          <Image className={styles.machineCover} src={handover.machineCover} mode="aspectFill" />
          <View className={styles.machineBody}>
            <Text className={styles.machineTitle}>{handover.machineTitle}</Text>
            <Text className={styles.machineParty}>卖方：{handover.sellerName} · {handover.sellerPhone}</Text>
            <Text className={styles.machineParty}>买方：{handover.buyerName} · {handover.buyerPhone}</Text>
            <Text className={styles.machineTime}>交机时间：{formatDate(handover.handoverAt, 'YYYY-MM-DD HH:mm')}</Text>
          </View>
        </View>

        {/* 关联定金 */}
        <View className={styles.depositCard}>
          <View className={styles.depositRow}>
            <View className={styles.depositBlock}>
              <Text className={styles.depositLabel}>成交价</Text>
              <Text className={styles.depositNum}>¥{formatPrice(handover.dealPrice)}万</Text>
            </View>
            <View className={styles.depositBlock}>
              <Text className={styles.depositLabel}>定金</Text>
              <Text className={styles.depositNum}>¥{handover.deposit.toLocaleString()}</Text>
            </View>
            <View className={styles.depositBlock}>
              <Text className={styles.depositLabel}>我的身份</Text>
              <Text className={styles.depositRole}>{roleText || '—'}</Text>
            </View>
          </View>
          {isReadOnly && (
            <View className={classnames(styles.handoverStatus, handover.status === 'done' && styles.statusDone, handover.status === 'failed' && styles.statusFailed)}>
              <Text>{handover.status === 'done' ? '✓ 交机已完成' : '✗ 已标记成交失败'}</Text>
            </View>
          )}
        </View>

        <View className={styles.progressCard}>
          <View className={styles.progressTop}>
            <Text className={styles.progressLabel}>交机检查进度</Text>
            <Text className={styles.progressValue}>{checkedCount}/{items.length}</Text>
          </View>
          <View className={styles.progressBar}>
            <View className={styles.progressFill} style={{ width: `${progress}%` }} />
          </View>
          <Text className={styles.progressHint}>{isReadOnly ? '交机已完成，清单只读' : '双方共同核验，全部勾选后可确认交机'}</Text>
        </View>

        <View className={styles.checkList}>
          <Text className={styles.sectionTitle}>
            <Text>📋</Text> 交机检查项
          </Text>
          {items.map((it, idx) => (
            <View
              key={idx}
              className={classnames(styles.checkItem, isReadOnly && styles.checkItemReadOnly)}
              onClick={() => toggleItem(idx)}
            >
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

        {!isReadOnly && (
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
        )}
      </View>

      {!isReadOnly && (
        <View className={styles.footer}>
          <View className={styles.failBtn} onClick={handleMarkFail}>
            <Text className={styles.failBtnText}>标记失败</Text>
          </View>
          <View className={styles.confirmBtn} onClick={handleConfirm}>
            <Text className={styles.confirmBtnText}>确认交机</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default HandoverPage;
