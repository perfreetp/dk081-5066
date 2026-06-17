import React, { useMemo, useState } from 'react';
import { View, Text, Image, Swiper, SwiperItem, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { formatHours, formatPrice } from '@/utils/format';
import SellPointCard from '@/components/SellPointCard';
import Tag from '@/components/Tag';
import styles from './index.module.scss';

const CATEGORIES = ['挖掘机', '装载机', '推土机', '压路机', '起重机', '泵车', '自卸车', '叉车'];

const conditionMap: Record<string, { text: string; color: 'orange' | 'green' | 'gray' }> = {
  excellent: { text: '车况优秀', color: 'green' },
  good: { text: '车况良好', color: 'orange' },
  fair: { text: '车况一般', color: 'gray' },
};

const DetailPage: React.FC = () => {
  const router = useRouter();
  const id = router.params.id || '';
  const machine = useAppStore((s) => s.getMachineById(id));
  const toggleCollect = useAppStore((s) => s.toggleCollect);
  const priceAlerts = useAppStore((s) => s.priceAlerts);
  const addPriceAlert = useAppStore((s) => s.addPriceAlert);
  const removePriceAlert = useAppStore((s) => s.removePriceAlert);

  const cond = useMemo(() => (machine ? conditionMap[machine.condition] : conditionMap.good), [machine]);

  const hasAlert = useMemo(() => {
    if (!machine) return false;
    return priceAlerts.some((a) => a.categoryLabel === machine.categoryLabel);
  }, [priceAlerts, machine]);

  const [showAlertSheet, setShowAlertSheet] = useState(false);
  const [alertCategoryLabel, setAlertCategoryLabel] = useState(machine?.categoryLabel || '挖掘机');
  const [modelKeyword, setModelKeyword] = useState('');
  const [targetPrice, setTargetPrice] = useState('');

  if (!machine) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '48rpx', textAlign: 'center' }}>
          <Text>车源不存在或已下架</Text>
        </View>
      </View>
    );
  }

  const handleBook = () => {
    Taro.navigateTo({ url: `/pages/booking/index?id=${machine.id}` });
  };

  const handleCall = () => {
    Taro.showModal({
      title: '联系卖家',
      content: `拨打 ${machine.sellerName} 的电话？`,
      confirmText: '拨打',
      success: (res) => {
        if (res.confirm) {
          console.info('[Detail] call seller', machine.sellerId);
          Taro.showToast({ title: '正在拨打...', icon: 'none' });
        }
      },
    });
  };

  const handleChat = () => {
    Taro.navigateTo({ url: `/pages/chat/index?id=c001` });
  };

  const handleVideoPlay = (label: string) => {
    Taro.showToast({ title: `播放：${label}`, icon: 'none' });
  };

  const handleOpenAlert = () => {
    setAlertCategoryLabel(machine.categoryLabel);
    setModelKeyword('');
    setTargetPrice(String(Math.floor(machine.minPrice * 0.9)));
    setShowAlertSheet(true);
  };

  const handleSaveAlert = () => {
    const price = Number(targetPrice);
    if (!price || price <= 0) {
      Taro.showToast({ title: '请输入有效的目标价', icon: 'none' });
      return;
    }
    addPriceAlert({
      categoryLabel: alertCategoryLabel,
      modelKeyword,
      targetPrice: price,
    });
    setShowAlertSheet(false);
    Taro.showToast({ title: '已关注降价提醒', icon: 'success' });
  };

  const handleRemoveAlert = () => {
    const alert = priceAlerts.find((a) => a.categoryLabel === machine.categoryLabel);
    if (alert) {
      removePriceAlert(alert.id);
      Taro.showToast({ title: '已取消关注', icon: 'none' });
    }
  };

  return (
    <View className={styles.page}>
      <Swiper
        className={styles.swiper}
        autoplay={false}
        indicatorColor="rgba(255,255,255,0.4)"
        indicatorActiveColor="#ffffff"
        circular
      >
        {machine.images.map((img, idx) => (
          <SwiperItem key={idx}>
            <Image className={styles.swiperImg} src={img} mode="aspectFill" />
          </SwiperItem>
        ))}
      </Swiper>

      <View className={styles.content}>
        <View className={styles.priceCard}>
          <View className={styles.titleRow}>
            <Text className={styles.detailTitle}>{machine.title}</Text>
            <View className={styles.collectBtn} onClick={() => toggleCollect(machine.id)}>
              <Text className={styles.collectIcon}>{machine.collected ? '★' : '☆'}</Text>
            </View>
          </View>
          <View className={styles.priceRow}>
            <Text className={styles.priceSymbol}>¥</Text>
            <Text className={styles.priceValue}>{machine.minPrice}</Text>
            <Text className={styles.priceUnit}>万</Text>
            <View className={styles.priceTag}>
              <Text>最低出手价</Text>
            </View>
          </View>
          <View className={styles.tagRow}>
            <Tag text={machine.categoryLabel} color="orange" />
            <Tag text={cond.text} color={cond.color} />
            <Tag text={machine.canViewToday ? '当天可看' : '需预约'} color={machine.canViewToday ? 'green' : 'gray'} />
            <Tag text={machine.includeTransport ? '包板车运输' : '自提'} color="blue" />
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📌</Text> 基本信息
          </Text>
          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>品牌</Text>
              <Text className={styles.infoValue}>{machine.brand}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>机型</Text>
              <Text className={styles.infoValue}>{machine.model}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>出厂年份</Text>
              <Text className={styles.infoValue}>{machine.year}年</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>工时表</Text>
              <Text className={styles.infoValue}>{formatHours(machine.hours)}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>常驻城市</Text>
              <Text className={styles.infoValue}>{machine.city}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>常驻工地</Text>
              <Text className={styles.infoValue}>{machine.site}</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🎬</Text> 验机短视频
          </Text>
          <View className={styles.videoGrid}>
            {machine.videos.map((v, idx) => (
              <View key={idx} className={styles.videoItem} onClick={() => handleVideoPlay(v.label)}>
                <Image className={styles.videoCover} src={v.cover} mode="aspectFill" />
                <View className={styles.videoPlay}>
                  <Text className={styles.videoPlayIcon}>▶</Text>
                </View>
                <View className={styles.videoLabel}>
                  <Text>{v.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <SellPointCard machine={machine} />

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>👤</Text> 卖家信息
          </Text>
          <View className={styles.seller}>
            <Image className={styles.sellerAvatar} src={machine.sellerAvatar} mode="aspectFill" />
            <View className={styles.sellerBody}>
              <Text className={styles.sellerName}>{machine.sellerName}</Text>
              <Text className={styles.sellerSub}>常驻 {machine.city} · 已发布多台车源</Text>
            </View>
            <View className={styles.callBtn} onClick={handleCall}>
              <Text className={styles.callText}>拨打电话</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.footer}>
        <View className={styles.footerIconBtn} onClick={() => toggleCollect(machine.id)}>
          <Text className={styles.footerIcon}>{machine.collected ? '★' : '☆'}</Text>
          <Text className={styles.footerIconText}>{machine.collected ? '已收藏' : '收藏'}</Text>
        </View>
        <View
          className={styles.footerIconBtn}
          onClick={hasAlert ? handleRemoveAlert : handleOpenAlert}
        >
          <Text className={classnames(styles.footerIcon, hasAlert && styles.footerIconActive)}>
            {hasAlert ? '🔔' : '🔕'}
          </Text>
          <Text className={classnames(styles.footerIconText, hasAlert && styles.footerIconTextActive)}>
            {hasAlert ? '已关注降价' : '降价提醒'}
          </Text>
        </View>
        <View className={styles.footerIconBtn} onClick={handleChat}>
          <Text className={styles.footerIcon}>💬</Text>
          <Text className={styles.footerIconText}>聊一聊</Text>
        </View>
        <View className={styles.bookBtn} onClick={handleBook}>
          <Text className={styles.bookBtnText}>预约当天看机</Text>
        </View>
      </View>

      {showAlertSheet && (
        <View className={styles.mask} onClick={() => setShowAlertSheet(false)}>
          <View className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <View className={styles.sheetHeader}>
              <Text className={styles.sheetTitle}>关注降价提醒</Text>
              <Text className={styles.sheetClose} onClick={() => setShowAlertSheet(false)}>✕</Text>
            </View>

            <View className={styles.sheetBody}>
              <View className={styles.formSection}>
                <Text className={styles.formLabel}>关注机型</Text>
                <View className={styles.tagRow}>
                  {CATEGORIES.map((c) => {
                    const active = alertCategoryLabel === c;
                    return (
                      <View
                        key={c}
                        className={classnames(styles.tagItem, active && styles.tagActive)}
                        onClick={() => setAlertCategoryLabel(c)}
                      >
                        <Text className={styles.tagText}>{c}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View className={styles.formRow}>
                <Text className={styles.formLabel}>具体型号</Text>
                <Input
                  className={styles.formInput}
                  value={modelKeyword}
                  onInput={(e) => setModelKeyword(e.detail.value)}
                  placeholder="如：20吨、220、带破碎锤"
                />
              </View>

              <View className={styles.formRow}>
                <Text className={styles.formLabel}>目标价（万元）</Text>
                <Input
                  className={styles.formInput}
                  type="digit"
                  value={targetPrice}
                  onInput={(e) => setTargetPrice(e.detail.value)}
                  placeholder="心里预期价位"
                />
              </View>

              <View className={styles.formHint}>
                <Text className={styles.formHintText}>
                  当前 {alertCategoryLabel} 最低价约 ¥{formatPrice(machine.minPrice)}万，
                  低于您的目标价时将自动通知
                </Text>
              </View>
            </View>

            <View className={styles.sheetFooter}>
              <View className={styles.submitBtn} onClick={handleSaveAlert}>
                <Text className={styles.submitBtnText}>保存关注</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default DetailPage;
