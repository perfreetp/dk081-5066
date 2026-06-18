import React, { useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { formatDate } from '@/utils/format';
import styles from './index.module.scss';

const MY_ROLE: Record<string, { label: string; emoji: string }> = {
  buyer: { label: '我是买方', emoji: '🛒' },
  seller: { label: '我是卖方', emoji: '🚜' },
};

const FulfillmentPage: React.FC = () => {
  const router = useRouter();
  const agreementId = (router.params.agreementId as string) || '';

  const agreements = useAppStore((s) => s.agreements);
  const getFulfillmentByAgreement = useAppStore((s) => s.getFulfillmentByAgreement);
  const createFulfillment = useAppStore((s) => s.createFulfillment);
  const markFulfillmentStepDone = useAppStore((s) => s.markFulfillmentStepDone);
  const startHandover = useAppStore((s) => s.startHandover);

  const agreement = useMemo(() => agreements.find((a) => a.id === agreementId), [agreements, agreementId]);

  const fulfillment = useMemo(() => {
    if (!agreement) return null;
    const existing = getFulfillmentByAgreement(agreementId);
    return existing || createFulfillment(agreementId);
  }, [agreement, agreementId, getFulfillmentByAgreement, createFulfillment]);

  if (!agreement || !fulfillment) {
    return (
      <View className={styles.page}>
        <Text className={styles.emptyTip}>未找到对应履约记录</Text>
      </View>
    );
  }

  const roleInfo = MY_ROLE[agreement.myRole] || { label: '', emoji: '' };
  const finalPaymentYuan = fulfillment.finalPayment || Math.max(0, Math.round(agreement.dealPrice * 10000 - agreement.deposit));
  const finalPaymentWan = (finalPaymentYuan / 10000).toFixed(1);

  const handleStepAction = (stepKey: string) => {
    if (stepKey === 'deposit') {
      Taro.showModal({
        title: '确认定金已到账',
        content: agreement.myRole === 'seller' ? '确认买家已全额支付定金？' : '确认定金已支付完成？',
        success: (res) => {
          if (res.confirm) {
            markFulfillmentStepDone(agreementId, 'deposit', '定金已全额到账');
            Taro.showToast({ title: '已标记定金到账', icon: 'success' });
          }
        },
      });
    } else if (stepKey === 'handover') {
      // 启动交机后跳转到交机清单
      const hId = startHandover(agreementId);
      if (hId) {
        markFulfillmentStepDone(agreementId, 'handover', '现场交机已完成');
      }
      Taro.navigateTo({ url: `/pages/handover/index?agreementId=${agreementId}` });
    } else if (stepKey === 'final_payment') {
      Taro.showModal({
        title: '确认尾款已结清',
        content: `尾款金额 ¥${finalPaymentWan}万，确认已结清？`,
        success: (res) => {
          if (res.confirm) {
            markFulfillmentStepDone(agreementId, 'final_payment', `尾款 ¥${finalPaymentWan}万 已全额到账`);
            Taro.showToast({ title: '已标记尾款结清', icon: 'success' });
          }
        },
      });
    } else if (stepKey === 'followup') {
      Taro.showModal({
        title: '售后回访完成',
        content: agreement.myRole === 'seller' ? '确认已完成对买家的售后回访？' : '确认已完成售后回访？',
        success: (res) => {
          if (res.confirm) {
            markFulfillmentStepDone(agreementId, 'followup', '设备运行正常，回访完成');
            Taro.showToast({ title: '已完成售后回访', icon: 'success' });
          }
        },
      });
    }
  };

  return (
    <View className={styles.page}>
      {/* 设备与金额信息 */}
      <View className={styles.machineCard}>
        <Image className={styles.machineCover} src={agreement.machineCover} mode="aspectFill" />
        <View className={styles.machineBody}>
          <Text className={styles.machineTitle} numberOfLines={1}>{agreement.machineTitle}</Text>
          <Text className={styles.roleChip}>{roleInfo.emoji} {roleInfo.label}</Text>
          <View className={styles.priceRow}>
            <View className={styles.priceBlock}>
              <Text className={styles.priceLabel}>成交价</Text>
              <Text className={styles.priceNum}>{agreement.dealPrice}万</Text>
            </View>
            <View className={styles.priceBlock}>
              <Text className={styles.priceLabel}>定金</Text>
              <Text className={styles.depositNum}>{(agreement.deposit / 10000).toFixed(1)}万</Text>
            </View>
            <View className={styles.priceBlock}>
              <Text className={styles.priceLabel}>尾款</Text>
              <Text className={styles.finalNum}>{finalPaymentWan}万</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 买卖双方 */}
      <View className={styles.partyBlock}>
        <Text className={styles.blockTitle}>交易双方</Text>
        <View className={styles.partyRow}>
          <Text className={styles.partyLabel}>卖方</Text>
          <Text className={styles.partyValue}>{agreement.sellerName} · {agreement.sellerPhone}</Text>
        </View>
        <View className={styles.partyRow}>
          <Text className={styles.partyLabel}>买方</Text>
          <Text className={styles.partyValue}>{agreement.buyerName} · {agreement.buyerPhone}</Text>
        </View>
      </View>

      {/* 履约时间线 */}
      <View className={styles.timelineCard}>
        <Text className={styles.blockTitle}>履约进度</Text>
        {fulfillment.steps.map((step, idx) => {
          const isDone = step.done;
          const isCurrent = !isDone && idx === fulfillment.currentStep;
          const dotClass = isDone ? styles.stepDotDone : isCurrent ? styles.stepDotCurrent : styles.stepDotPending;
          const labelClass = isDone ? styles.stepLabelDone : isCurrent ? styles.stepLabelCurrent : styles.stepLabelPending;
          const lineClass = isDone ? styles.stepLineDone : '';
          return (
            <View key={step.key} className={styles.stepItem}>
              <View className={styles.stepLeft}>
                <View className={classnames(styles.stepDot, dotClass)}>
                  <Text>{isDone ? '✓' : idx + 1}</Text>
                </View>
                <View className={classnames(styles.stepLine, lineClass)} />
              </View>
              <View className={styles.stepRight}>
                <View className={styles.stepHeader}>
                  <Text className={classnames(styles.stepLabel, labelClass)}>{step.label}</Text>
                  {step.at && (
                    <Text className={styles.stepAt}>{formatDate(step.at)}</Text>
                  )}
                </View>
                {step.note && (
                  <Text className={styles.stepNote}>{step.note}</Text>
                )}
                {!isDone && isCurrent && (
                  <View className={styles.stepAction}>
                    <View className={styles.stepBtn} onClick={() => handleStepAction(step.key)}>
                      <Text>去完成</Text>
                    </View>
                  </View>
                )}
                {isDone && (
                  <View className={styles.stepAction}>
                    <View className={classnames(styles.stepBtn, styles.stepBtnDone)}>
                      <Text>✓ 已完成</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* 售后回访备注（如有） */}
      {fulfillment.followupNote && (
        <View className={styles.followupCard}>
          <Text className={styles.blockTitle}>回访备注</Text>
          <Text className={styles.followupText}>{fulfillment.followupNote}</Text>
        </View>
      )}
    </View>
  );
};

export default FulfillmentPage;
