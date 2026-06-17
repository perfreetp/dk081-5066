import React, { useState, useMemo } from 'react';
import { View, Text, Input, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { VIDEO_TYPES, generateSellPoints } from '@/utils/sellpoint';
import { mockMyMachines } from '@/data/mine';
import type { Machine, SellPoint, MachineCategory } from '@/types';
import SellPointCard from '@/components/SellPointCard';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const CATEGORY_OPTIONS: { label: string; value: MachineCategory }[] = [
  { label: '挖掘机', value: 'excavator' },
  { label: '装载机', value: 'loader' },
  { label: '推土机', value: 'bulldozer' },
  { label: '汽车吊', value: 'crane' },
  { label: '叉车', value: 'forklift' },
  { label: '压路机', value: 'roller' },
];

interface FormState {
  category: MachineCategory;
  categoryLabel: string;
  brand: string;
  model: string;
  year: string;
  hours: string;
  city: string;
  site: string;
  minPrice: string;
}

const PublishPage: React.FC = () => {
  const router = useRouter();
  const initialTab = router.params.tab === 'list' ? 'list' : 'form';
  const [tab, setTab] = useState<'form' | 'list'>(initialTab as 'form' | 'list');

  const [form, setForm] = useState<FormState>({
    category: 'excavator',
    categoryLabel: '挖掘机',
    brand: '',
    model: '',
    year: String(new Date().getFullYear()),
    hours: '',
    city: '成都市',
    site: '',
    minPrice: '',
  });

  const [videos, setVideos] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({
    engineStart: true,
    travelOk: true,
    slewingOk: true,
    boomOk: true,
    noOilLeak: true,
    noRepair: true,
    paperComplete: true,
  });

  const updateForm = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const toggleVideo = (type: string) => {
    setVideos((v) => {
      const next = { ...v };
      if (next[type]) {
        delete next[type];
      } else {
        next[type] = `https://picsum.photos/id/${Math.floor(Math.random() * 1000) + 1}/300/200`;
      }
      return next;
    });
  };

  const toggleCheck = (key: string) => {
    setChecks((c) => ({ ...c, [key]: !c[key] }));
  };

  // 构建预览 Machine 对象
  const previewMachine = useMemo<Machine>(() => {
    const sellPoint: SellPoint = {
      engineStart: !!checks.engineStart,
      travelOk: !!checks.travelOk,
      slewingOk: !!checks.slewingOk,
      boomOk: !!checks.boomOk,
      noOilLeak: !!checks.noOilLeak,
      noRepair: !!checks.noRepair,
      paperComplete: !!checks.paperComplete,
      highlights: [],
    };
    const { highlights } = generateSellPoints({
      year: Number(form.year) || new Date().getFullYear(),
      hours: Number(form.hours) || 0,
      brand: form.brand || '品牌待填',
      sellPoint,
    });
    return {
      id: 'preview',
      title: `${form.brand || '品牌'} ${form.model || '机型'}`.trim() || '车源预览',
      category: form.category,
      categoryLabel: form.categoryLabel,
      brand: form.brand || '品牌待填',
      model: form.model || '机型待填',
      year: Number(form.year) || new Date().getFullYear(),
      hours: Number(form.hours) || 0,
      city: form.city || '城市待填',
      site: form.site || '工地待填',
      minPrice: Number(form.minPrice) || 0,
      condition: 'good',
      cover: 'https://picsum.photos/id/787/600/450',
      images: ['https://picsum.photos/id/787/600/450'],
      videos: [],
      sellPoint: { ...sellPoint, highlights },
      canViewToday: true,
      includeTransport: false,
      sellerId: 'me',
      sellerName: '我',
      sellerAvatar: '',
      publishedAt: new Date().toISOString(),
      collected: false,
    };
  }, [form, checks]);

  const handlePublish = () => {
    if (!form.brand || !form.model || !form.hours || !form.minPrice) {
      Taro.showToast({ title: '请补全必填信息', icon: 'none' });
      return;
    }
    if (Object.keys(videos).length === 0) {
      Taro.showToast({ title: '请至少上传1个验机视频', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '发布成功',
      content: '车源已发布，卖点卡片已自动生成。买家可立即看到您的车源！',
      showCancel: false,
      confirmText: '我知道了',
      success: () => setTab('list'),
    });
  };

  const checkOptions: { key: string; label: string }[] = [
    { key: 'noOilLeak', label: '无漏油' },
    { key: 'noRepair', label: '无大修' },
    { key: 'paperComplete', label: '手续齐全' },
  ];

  return (
    <View className={styles.page}>
      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tabItem, tab === 'form' && styles.tabActive)}
          onClick={() => setTab('form')}
        >
          <Text className={styles.tabText}>发布新车源</Text>
        </View>
        <View
          className={classnames(styles.tabItem, tab === 'list' && styles.tabActive)}
          onClick={() => setTab('list')}
        >
          <Text className={styles.tabText}>我的车源</Text>
        </View>
      </View>

      {tab === 'form' ? (
        <View className={styles.form}>
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>🚜</Text> 基本信息
            </Text>
            <View className={styles.fieldRow}>
              <Text className={styles.fieldLabel}>机型分类<Text className={styles.fieldRequired}>*</Text></Text>
              <View style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '8rpx', justifyContent: 'flex-end' }}>
                {CATEGORY_OPTIONS.map((c) => (
                  <View
                    key={c.value}
                    onClick={() => setForm((f) => ({ ...f, category: c.value, categoryLabel: c.label }))}
                    style={{
                      padding: '4rpx 16rpx',
                      borderRadius: '999rpx',
                      background: form.category === c.value ? '#ff6b00' : '#f2f3f5',
                      color: form.category === c.value ? '#fff' : '#4e5969',
                      fontSize: '24rpx',
                    }}
                  >
                    {c.label}
                  </View>
                ))}
              </View>
            </View>
            <View className={styles.fieldRow}>
              <Text className={styles.fieldLabel}>品牌<Text className={styles.fieldRequired}>*</Text></Text>
              <Input
                className={styles.fieldInput}
                placeholder="如 小松、卡特"
                value={form.brand}
                onInput={(e) => updateForm('brand', e.detail.value)}
              />
            </View>
            <View className={styles.fieldRow}>
              <Text className={styles.fieldLabel}>机型<Text className={styles.fieldRequired}>*</Text></Text>
              <Input
                className={styles.fieldInput}
                placeholder="如 PC200-8"
                value={form.model}
                onInput={(e) => updateForm('model', e.detail.value)}
              />
            </View>
            <View className={styles.fieldRow}>
              <Text className={styles.fieldLabel}>年份</Text>
              <Input
                className={styles.fieldInput}
                type="number"
                placeholder="如 2021"
                value={form.year}
                onInput={(e) => updateForm('year', e.detail.value)}
              />
              <Text className={styles.fieldSuffix}>年</Text>
            </View>
            <View className={styles.fieldRow}>
              <Text className={styles.fieldLabel}>工时表读数<Text className={styles.fieldRequired}>*</Text></Text>
              <Input
                className={styles.fieldInput}
                type="digit"
                placeholder="如 5200"
                value={form.hours}
                onInput={(e) => updateForm('hours', e.detail.value)}
              />
              <Text className={styles.fieldSuffix}>小时</Text>
            </View>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📍</Text> 工地与价格
            </Text>
            <View className={styles.fieldRow}>
              <Text className={styles.fieldLabel}>常驻工地城市</Text>
              <Input
                className={styles.fieldInput}
                placeholder="如 成都市"
                value={form.city}
                onInput={(e) => updateForm('city', e.detail.value)}
              />
            </View>
            <View className={styles.fieldRow}>
              <Text className={styles.fieldLabel}>常驻工地</Text>
              <Input
                className={styles.fieldInput}
                placeholder="如 天府新区某土方工地"
                value={form.site}
                onInput={(e) => updateForm('site', e.detail.value)}
              />
            </View>
            <View className={styles.fieldRow}>
              <Text className={styles.fieldLabel}>最低出手价<Text className={styles.fieldRequired}>*</Text></Text>
              <Input
                className={styles.fieldInput}
                type="digit"
                placeholder="如 42"
                value={form.minPrice}
                onInput={(e) => updateForm('minPrice', e.detail.value)}
              />
              <Text className={styles.fieldSuffix}>万元</Text>
            </View>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>🎬</Text> 验机短视频
            </Text>
            <Text style={{ fontSize: '24rpx', color: '#86909c' }}>上传发动机启动、行走、回转、臂架动作视频</Text>
            <View className={styles.videoGrid}>
              {VIDEO_TYPES.map((v) => {
                const has = !!videos[v.type];
                return (
                  <View
                    key={v.type}
                    className={styles.videoItem}
                    onClick={() => toggleVideo(v.type)}
                  >
                    {has ? (
                      <>
                        <Image className={styles.videoCover} src={videos[v.type]} mode="aspectFill" />
                        <View className={styles.videoPlay}>
                          <Text className={styles.videoPlayText}>▶</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <Text className={styles.videoPlus}>+</Text>
                        <Text className={styles.videoLabel}>{v.label}</Text>
                        <Text className={styles.videoDesc}>{v.desc}</Text>
                      </>
                    )}
                  </View>
                );
              })}
            </View>
            <View className={styles.checkRow}>
              {checkOptions.map((c) => (
                <View key={c.key} className={styles.checkItem} onClick={() => toggleCheck(c.key)}>
                  <View className={classnames(styles.checkBox, checks[c.key] && styles.checkActive)}>
                    <Text>{checks[c.key] ? '✓' : ''}</Text>
                  </View>
                  <Text className={styles.checkText}>{c.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <SectionHeader title="卖点卡片预览" subtitle="自动生成" />
          <SellPointCard machine={previewMachine} />

          <View style={{ height: '32rpx' }} />
        </View>
      ) : (
        <View className={styles.myList}>
          <SectionHeader title="我的车源" subtitle={`${mockMyMachines.length}台`} />
          {mockMyMachines.length === 0 ? (
            <EmptyState text="还没有发过的车源" hint="点击上方发布新车源" />
          ) : (
            mockMyMachines.map((m) => (
              <View key={m.id} className={styles.myItem}>
                <Image className={styles.myCover} src={m.cover} mode="aspectFill" />
                <View className={styles.myBody}>
                  <Text className={styles.myTitle}>{m.title}</Text>
                  <View className={styles.myStatusRow}>
                    <View
                      style={{
                        padding: '2rpx 12rpx',
                        borderRadius: '4rpx',
                        background: m.status === '在售' ? '#fff3e8' : '#f2f3f5',
                        color: m.status === '在售' ? '#ff6b00' : '#86909c',
                        fontSize: '22rpx',
                      }}
                    >
                      {m.status}
                    </View>
                    <Text className={styles.myViews}>浏览 {m.views}</Text>
                  </View>
                  <View className={styles.myStatusRow}>
                    <Text className={styles.myPrice}>¥{m.price}万</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {tab === 'form' && (
        <View className={styles.footer}>
          <View className={styles.publishBtn} onClick={handlePublish}>
            <Text className={styles.publishBtnText}>发布车源</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default PublishPage;
