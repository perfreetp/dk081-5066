import React, { useState, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { mockAgreements, mockFailRecords, FAIL_REASON_OPTIONS } from '@/data/mine';
import { useAppStore } from '@/store/useAppStore';
import { formatPrice, formatRelativeTime, formatDate } from '@/utils/format';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

type Tab = 'agreement' | 'fail' | 'alert';

const AgreementPage: React.FC = () => {
  const router = useRouter();
  const initialTab = (router.params.tab as Tab) || 'agreement';
  const [tab, setTab] = useState<Tab>(initialTab === 'fail' || initialTab === 'alert' ? initialTab : 'agreement');

  const priceAlerts = useAppStore((s) => s.priceAlerts);

  const failStats = useMemo(() => {
    const map: Record<string, number> = { price_gap: 0, condition_mismatch: 0, paper_issue: 0 };
    mockFailRecords.forEach((f) => {
      map[f.reason] = (map[f.reason] || 0) + 1;
    });
    return map;
  }, []);

  const handleViewHandover = () => {
    Taro.navigateTo({ url: '/pages/handover/index' });
  };

  const handleViewAgreement = (id: string) => {
    Taro.showToast({ title: '查看协议详情', icon: 'none' });
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
          <Text className={styles.tabText}>定金协议({mockAgreements.length})</Text>
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
            {mockAgreements.length === 0 ? (
              <EmptyState text="还没有定金协议" hint="买卖双方确认后自动生成" />
            ) : (
              mockAgreements.map((a) => (
                <View key={a.id} className={styles.agreementItem}>
                  <View className={styles.agreementHeader}>
                    <Image className={styles.agreementCover} src={a.machineCover} mode="aspectFill" />
                    <View className={styles.agreementTitleWrap}>
                      <Text className={styles.agreementTitle}>{a.machineTitle}</Text>
                      <View
                        className={classnames(
                          styles.agreementStatus,
                          a.status === 'signed' ? styles.statusSigned : styles.statusCompleted
                        )}
                      >
                        <Text>{a.status === 'signed' ? '已签约定金' : '已完成交易'}</Text>
                      </View>
                    </View>
                  </View>
                  <View className={styles.agreementBody}>
                    <View className={styles.partyRow}>
                      <Text className={styles.partyLabel}>卖方</Text>
                      <Text className={styles.partyValue}>{a.sellerName}</Text>
                    </View>
                    <View className={styles.partyRow}>
                      <Text className={styles.partyLabel}>买方</Text>
                      <Text className={styles.partyValue}>{a.buyerName}</Text>
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
                    <Text style={{ fontSize: '22rpx', color: '#86909c', marginTop: '12rpx', display: 'block' }}>
                      签订时间：{formatDate(a.signedAt)}
                    </Text>
                  </View>
                  <View className={styles.agreementActions}>
                    <View className={classnames(styles.actionBtn, styles.ghostBtn)} onClick={() => handleViewAgreement(a.id)}>
                      <Text className={styles.ghostText}>查看协议</Text>
                    </View>
                    <View className={classnames(styles.actionBtn, styles.primaryBtn)} onClick={handleViewHandover}>
                      <Text className={styles.primaryText}>交机清单</Text>
                    </View>
                  </View>
                </View>
              ))
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
              <EmptyState text="还没有关注机型" hint="关注某类机型获取降价提醒" />
            ) : (
              priceAlerts.map((p) => (
                <View key={p.id} className={styles.alertItem}>
                  <View className={styles.alertIcon}>
                    <Text>🔔</Text>
                  </View>
                  <View className={styles.alertBody}>
                    <Text className={styles.alertTitle}>{p.categoryLabel} · {p.modelKeyword}</Text>
                    <Text className={styles.alertSub}>目标价 ≤ {p.targetPrice}万</Text>
                  </View>
                  <View className={styles.alertRight}>
                    {p.matched ? (
                      <Text className={styles.alertMatched}>已降价 ✓</Text>
                    ) : (
                      <>
                        <Text className={styles.alertPriceVal}>{p.currentMinPrice}万</Text>
                        <Text className={styles.alertTarget}>未达预期</Text>
                      </>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default AgreementPage;
