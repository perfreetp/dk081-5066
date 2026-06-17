import React, { useMemo } from 'react';
import { View, Text, Image, Swiper, SwiperItem } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { formatHours } from '@/utils/format';
import SellPointCard from '@/components/SellPointCard';
import Tag from '@/components/Tag';
import styles from './index.module.scss';

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

  const cond = useMemo(() => (machine ? conditionMap[machine.condition] : conditionMap.good), [machine]);

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
        <View className={styles.footerIconBtn} onClick={handleChat}>
          <Text className={styles.footerIcon}>💬</Text>
          <Text className={styles.footerIconText}>聊一聊</Text>
        </View>
        <View className={styles.bookBtn} onClick={handleBook}>
          <Text className={styles.bookBtnText}>预约当天看机</Text>
        </View>
      </View>
    </View>
  );
};

export default DetailPage;
