import React, { useState, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { mockFailRecords, FAIL_REASON_OPTIONS } from '@/data/mine';
import { useAppStore } from '@/store/useAppStore';
import { formatPrice, formatRelativeTime, formatDate } from '@/utils/format';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

type Tab = 'agreement' | 'fail' | 'alert';

const PAYMENT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  unpaid: { label: '定金未付', color: '#f53f3f', bg: '#ffece8' },
  partial: { label: '部分付款', color: '#ff7d00', bg: '#fff7e8' },
  paid: { label: '定金已收', color: '#00b42a', bg: '#e8ffea' },
};

const AGREEMENT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  signed: { label: '已签约', color: '#ff6b00', bg: '#fff3e8' },
  handover_start: { label: '交机中', color: '#165dff', bg: '#e8f3ff' },
  completed: { label: '交易完成', color: '#00b42a', bg: '#e8ffea' },
  cancelled: { label: '已取消', color: '#86909c', bg: '#f2f3f5' },
};

const MY_ROLE: Record<string, { label: string; emoji: string }> = {
  buyer: { label: '我是买方', emoji: '🛒' },
  seller: { label: '我是卖方', emoji: '🚜' },
};

const AgreementPage: React.FC = () => {
  const router = useRouter();
  const initialTab = (router.params.tab as Tab) || 'agreement';
  const [tab, setTab] = useState<Tab>(initialTab === 'fail' || initialTab === 'alert' ? initialTab : 'agreement');

  const agreements = useAppStore((s) => s.agreements);
  const priceAlerts = useAppStore((s) => s.priceAlerts);
  const removePriceAlert = useAppStore((s) => s.removePriceAlert);
  const updateAgreementPayment = useAppStore((s) => s.updateAgreementPayment);
  const startHandover = useAppStore((s) => s.startHandover);
  const completeAgreement = useAppStore((s) => s.completeAgreement);

  const failStats = useMemo(() => {
    const map: Record<string, number> = { price_gap: 0, condition_mismatch: 0, paper_issue: 0 };
    mockFailRecords.forEach((f) => {
      map[f.reason] = (map[f.reason] || 0) + 1;
    });
    return map;
  }, []);

  const handleViewHandover = (agreementId?: string) => {
    // 如果有 agreementId 且还没启动交机，先启动
    if (agreementId) {
      const ag = agreements.find((a) => a.id === agreementId);
      if (ag && ag.status !== 'handover_start' && ag.status !== 'completed') {
        startHandover(agreementId);
      }
    }
    Taro.navigateTo({ url: '/pages/handover/index' + (agreementId ? `?agreementId=${agreementId}` : '') });
  };

  const handleViewAgreement = (id: string) => {
    const a = agreements.find((x) => x.id === id);
    if (!a) return;
    const roleText = MY_ROLE[a.myRole]?.label || '';
    const payText = PAYMENT_STATUS[a.paymentStatus]?.label || '';
    const detail =
      `${roleText}\n` +
      `卖方：${a.sellerName} ${a.sellerPhone || ''}\n` +
      `买方：${a.buyerName} ${a.buyerPhone || ''}\n` +
      `成交价：¥${formatPrice(a.dealPrice)}万\n` +
      `定金：¥${a.deposit.toLocaleString()}元\n` +
      `付款状态：${payText}\n` +
      `${a.paymentNote ? `备注：${a.paymentNote}` : ''}`;
    Taro.showModal({ title: `定金协议 · ${AGREEMENT_STATUS[a.status]?.label || ''}`, content: detail.trim(), showCancel: false });
  };

  // 付款操作
  const handleMarkPayment = (id: string, status: 'unpaid' | 'partial' | 'paid') => {
    const notes: Record<string, string> = {
      partial: '买家已付部分定金，待补齐',
      paid: '买家已全额付清定金',
      unpaid: '定金尚未支付',
    };
    updateAgreementPayment(id, status, notes[status]);
    Taro.showToast({ title: PAYMENT_STATUS[status].label, icon: 'success' });
  };

  // 交机完成
  const handleMarkCompleted = (id: string) => {
    Taro.showModal({
      title: '确认完成交易',
      content: '确认交易已完成？车源将标记为已成交',
      success: (res) => {
        if (res.confirm) {
          completeAgreement(id);
          Taro.showToast({ title: '交易已完成', icon: 'success' });
        }
      },
    });
  };

  // 取消降价提醒
  const handleRemoveAlert = (id: string) => {
    Taro.showModal({
      title: '取消降价提醒',
      content: '确认不再关注该机型降价？',
      success: (res) => {
        if (res.confirm) {
          removePriceAlert(id);
          Taro.showToast({ title: '已取消关注', icon: 'success' });
        }
      },
    });
  };

  const handleFailDetail = (id: string) => {
    Taro.showToast({ title: '失败记录详情', icon: 'none' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tabItem, tab === 'agreement' && styles.tabActive)}
          onClick={() => setTab('agreement')}
        >
          <Text className={styles.tabText}>定金协议({agreements.length})</Text>
        </View>
        <View
          className={classnames(styles.tabItem, tab === 'fail' && styles.tabActive)}
          onClick={() => setTab('fail')}
        >
          <Text className={styles.tabText}>成交失败({mockFailRecords.length})</Text>
        </View>
        <View
          className={classnames(styles.tabItem, tab === 'alert' && styles.tabActive)}
          onClick={() => setTab('alert')}
        >
          <Text className={styles.tabText}>降价提醒({priceAlerts.length})</Text>
        </View>
      </View>

      <View className={styles.list}>
        {tab === 'agreement' && (
          <>
            {agreements.length === 0 ? (
              <EmptyState text="还没有定金协议" hint="聊天中买卖双方确认成交后自动生成" />
            ) : (
              agreements.map((a) => {
                const payInfo = PAYMENT_STATUS[a.paymentStatus] || PAYMENT_STATUS.unpaid;
                const agInfo = AGREEMENT_STATUS[a.status] || AGREEMENT_STATUS.signed;
                const roleInfo = MY_ROLE[a.myRole] || { label: '', emoji: '' };
                return (
                  <View key={a.id} className={styles.agreementItem}>
                    <View className={styles.agreementHeader}>
                      <Image className={styles.agreementCover} src={a.machineCover} mode="aspectFill" />
                      <View className={styles.agreementTitleWrap}>
                        <View className={styles.agreementTitleRow}>
                          <Text className={styles.agreementTitle} numberOfLines={1}>{a.machineTitle}</Text>
                          <Text className={styles.roleChip}>{roleInfo.emoji} {roleInfo.label}</Text>
                        </View>
                        <View className={styles.agreementStatusRow}>
                          <View
                            className={classnames(styles.agreementStatus, styles.statusCustom)}
                            style={{ background: agInfo.bg, color: agInfo.color }}
                          >
                            <Text>{agInfo.label}</Text>
                          </View>
                          <View
                            className={classnames(styles.agreementStatus, styles.statusCustom)}
                            style={{ background: payInfo.bg, color: payInfo.color }}
                          >
                            <Text>{payInfo.label}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View className={styles.agreementBody}>
                      <View className={styles.partyRow}>
                        <Text className={styles.partyLabel}>卖方</Text>
                        <Text className={styles.partyValue}>{a.sellerName} · {a.sellerPhone || '暂无'}</Text>
                      </View>
                      <View className={styles.partyRow}>
                        <Text className={styles.partyLabel}>买方</Text>
                        <Text className={styles.partyValue}>{a.buyerName} · {a.buyerPhone || '暂无'}</Text>
                      </View>
                      <View className={styles.priceRow}>
                        <View className={styles.priceBlock}>
                          <Text className={styles.priceLabel}>成交价</Text>
                          <Text className={styles.priceNum}>¥{formatPrice(a.dealPrice)}</Text>
                        </View>
                        <View className={styles.depositBlock}>
                          <Text className={styles.priceLabel}>定金</Text>
                          <Text className={styles.depositNum}>¥{a.deposit.toLocaleString()}</Text>
                        </View>
                      </View>
                      {a.paymentNote && (
                        <Text style={{ fontSize: '22rpx', color: '#ff7d00', marginTop: '8rpx', display: 'block' }}>
                          备注：{a.paymentNote}
                        </Text>
                      )}
                      <Text style={{ fontSize: '22rpx', color: '#86909c', marginTop: '12rpx', display: 'block' }}>
                        签订时间：{formatDate(a.signedAt)}
                      </Text>
                    </View>

                    {/* 付款状态操作 */}
                    {a.status !== 'completed' && a.status !== 'cancelled' && (
                      <View className={styles.paymentActions}>
                        <Text className={styles.paymentActionsTitle}>📌 标记付款：</Text>
                        <View className={styles.paymentChips}>
                          <View
                            className={classnames(styles.payChip, a.paymentStatus === 'unpaid' && styles.payChipActive)}
                            onClick={() => handleMarkPayment(a.id, 'unpaid')}
                          >
                            <Text>未付</Text>
                          </View>
                          <View
                            className={classnames(styles.payChip, a.paymentStatus === 'partial' && styles.payChipActive)}
                            onClick={() => handleMarkPayment(a.id, 'partial')}
                          >
                            <Text>部分</Text>
                          </View>
                          <View
                            className={classnames(styles.payChip, a.paymentStatus === 'paid' && styles.payChipActive)}
                            onClick={() => handleMarkPayment(a.id, 'paid')}
                          >
                            <Text>已收</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    <View className={styles.agreementActions}>
                      <View className={classnames(styles.actionBtn, styles.ghostBtn)} onClick={() => handleViewAgreement(a.id)}>
                        <Text className={styles.ghostText}>查看协议</Text>
                      </View>
                      {a.status === 'completed' ? (
                        <View className={classnames(styles.actionBtn, styles.doneBtn)}>
                          <Text className={styles.primaryText}>✓ 交易已完成</Text>
                        </View>
                      ) : a.status === 'handover_start' ? (
                        <>
                          <View className={classnames(styles.actionBtn, styles.primaryBtn)} onClick={() => handleViewHandover(a.id)}>
                            <Text className={styles.primaryText}>继续交机</Text>
                          </View>
                          <View className={classnames(styles.actionBtn, styles.successBtn)} onClick={() => handleMarkCompleted(a.id)}>
                            <Text className={styles.primaryText}>标记完成</Text>
                          </View>
                        </>
                      ) : (
                        <View className={classnames(styles.actionBtn, styles.primaryBtn)} onClick={() => handleViewHandover(a.id)}>
                          <Text className={styles.primaryText}>启动交机</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {tab === 'fail' && (
          <>
            <View style={{
              display: 'flex',
              background: '#fff',
              borderRadius: '16rpx',
              padding: '24rpx',
              marginBottom: '24rpx',
              boxShadow: '0 2rpx 12rpx rgba(0,0,0,0.08)',
            }}>
              {FAIL_REASON_OPTIONS.map((opt) => (
                <View key={opt.value} style={{ flex: 1, textAlign: 'center', borderRight: opt.value === 'paper_issue' ? 'none' : '1rpx solid #f2f3f5' }}>
                  <Text style={{ fontSize: '36rpx', fontWeight: 'bold', color: '#f53f3f' }}>{failStats[opt.value] || 0}</Text>
                  <Text style={{ fontSize: '22rpx', color: '#86909c', display: 'block', marginTop: '4rpx' }}>{opt.label}</Text>
                </View>
              ))}
            </View>
            {mockFailRecords.length === 0 ? (
              <EmptyState text="暂无成交失败记录" />
            ) : (
              mockFailRecords.map((f) => (
                <View key={f.id} className={styles.failItem} onClick={() => handleFailDetail(f.id)}>
                  <Image className={styles.failCover} src={f.machineCover} mode="aspectFill" />
                  <View className={styles.failBody}>
                    <Text className={styles.failTitle}>{f.machineTitle}</Text>
                    <View className={styles.failReason}>
                      <Text>{f.reasonLabel}</Text>
                    </View>
                    <Text className={styles.failNote}>{f.note}</Text>
                    <Text className={styles.failTime}>{formatRelativeTime(f.createdAt)}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {tab === 'alert' && (
          <>
            {priceAlerts.length === 0 ? (
              <EmptyState text="还没有关注机型" hint="找车页或车源详情页可关注降价提醒" />
            ) : (
              priceAlerts.map((p) => {
                const gap = p.currentMinPrice - p.targetPrice;
                const gapText = p.currentMinPrice > 0
                  ? (p.matched
                    ? `已比目标价低 ¥${Math.abs(gap).toFixed(1)}万`
                    : `还差 ¥${gap.toFixed(1)}万`)
                  : '暂无匹配车源';
                return (
                  <View key={p.id} className={classnames(styles.alertItem, p.matched && styles.alertItemMatched)}>
                    <View className={classnames(styles.alertIcon, p.matched && styles.alertIconMatched)}>
                      <Text>{p.matched ? '📣' : '🔔'}</Text>
                    </View>
                    <View className={styles.alertBody}>
                      <View className={styles.alertTitleRow}>
                        <Text className={styles.alertTitle}>{p.categoryLabel}</Text>
                        {p.modelKeyword && (
                          <Text className={styles.alertModel}>· {p.modelKeyword}</Text>
                        )}
                      </View>
                      <View className={styles.alertPriceRow}>
                        <View className={styles.alertPriceBlock}>
                          <Text className={styles.alertPriceLabel}>目标价</Text>
                          <Text className={styles.alertTargetPrice}>≤ {p.targetPrice}万</Text>
                        </View>
                        <Text className={styles.alertDivider}>vs</Text>
                        <View className={styles.alertPriceBlock}>
                          <Text className={styles.alertPriceLabel}>当前最低</Text>
                          <Text className={classnames(
                            styles.alertCurrentPrice,
                            p.matched && styles.alertCurrentPriceMatched
                          )}>
                            {p.currentMinPrice > 0 ? `${p.currentMinPrice}万` : '--'}
                          </Text>
                        </View>
                      </View>
                      <Text className={classnames(styles.alertSub, p.matched && styles.alertSubMatched)}>
                        {gapText}
                      </Text>
                    </View>
                    <View className={styles.alertRight}>
                      {p.matched ? (
                        <Text className={styles.alertMatched}>已降价 ✓</Text>
                      ) : (
                        <Text className={styles.alertWaiting}>等待中</Text>
                      )}
                      <View className={styles.alertRemove} onClick={() => handleRemoveAlert(p.id)}>
                        <Text>取消</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default AgreementPage;
