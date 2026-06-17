import React, { useState, useMemo } from 'react';
import { View, Text, Input, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { VIDEO_TYPES, generateSellPoints } from '@/utils/sellpoint';
import { hoursToCondition, formatHours } from '@/utils/format';
import { useAppStore } from '@/store/useAppStore';
import type { Machine, SellPoint, MachineCategory, VerifyVideo } from '@/types';
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
  canViewToday: boolean;
  includeTransport: boolean;
}

const STATUS_LABEL: Record<Machine['status'], { label: string; bg: string; color: string }> = {
  online: { label: '在售', bg: '#fff3e8', color: '#ff6b00' },
  offline: { label: '已下架', bg: '#f2f3f5', color: '#86909c' },
  sold: { label: '已成交', bg: '#e8ffea', color: '#00b42a' },
};

const TIME_SLOTS = ['上午 09:00-12:00', '下午 14:00-18:00', '全天可看'];

const PublishPage: React.FC = () => {
  const router = useRouter();
  const initialTab = router.params.tab === 'list' ? 'list' : 'form';
  const [tab, setTab] = useState<'form' | 'list'>(initialTab as 'form' | 'list');

  const currentUser = useAppStore((s) => s.currentUser);
  const machines = useAppStore((s) => s.machines);
  const myMachineIds = useAppStore((s) => s.myMachineIds);
  const publishMachine = useAppStore((s) => s.publishMachine);
  const refreshPriceAlertMatches = useAppStore((s) => s.refreshPriceAlertMatches);
  const updateMachinePrice = useAppStore((s) => s.updateMachinePrice);
  const toggleMachineStatus = useAppStore((s) => s.toggleMachineStatus);
  const refreshAvailable = useAppStore((s) => s.refreshAvailable);

  const myMachines = useMemo(
    () => machines.filter((m) => myMachineIds.includes(m.id)),
    [machines, myMachineIds]
  );

  const [form, setForm] = useState<FormState>({
    category: 'excavator',
    categoryLabel: '挖掘机',
    brand: '',
    model: '',
    year: String(new Date().getFullYear()),
    hours: '',
    city: currentUser.city,
    site: '',
    minPrice: '',
    canViewToday: true,
    includeTransport: false,
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

  // 操作弹层状态
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [actionType, setActionType] = useState<'price' | 'refresh' | 'status' | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editCanToday, setEditCanToday] = useState(true);
  const [editNextDate, setEditNextDate] = useState('');

  const updateForm = (key: keyof FormState, value: string | boolean) => {
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
    const videoList: VerifyVideo[] = VIDEO_TYPES
      .filter((v) => !!videos[v.type])
      .map((v) => ({
        type: v.type,
        label: v.label,
        cover: videos[v.type],
        url: '',
      }));
    const cond = hoursToCondition(Number(form.hours) || 0);
    const cover = videos.engineStart
      ? videos.engineStart
      : 'https://picsum.photos/id/787/600/450';
    const imageList = videoList.length > 0
      ? videoList.map((v) => v.cover)
      : ['https://picsum.photos/id/787/600/450'];
    return {
      id: 'preview',
      title: `${form.brand || '品牌'} ${form.model || '机型'} ${form.categoryLabel}`.trim() || '车源预览',
      category: form.category,
      categoryLabel: form.categoryLabel,
      brand: form.brand || '品牌待填',
      model: form.model || '机型待填',
      year: Number(form.year) || new Date().getFullYear(),
      hours: Number(form.hours) || 0,
      city: form.city || '城市待填',
      site: form.site || '工地待填',
      minPrice: Number(form.minPrice) || 0,
      originalPrice: Number(form.minPrice) || 0,
      condition: cond.level,
      cover,
      images: imageList,
      videos: videoList,
      sellPoint: { ...sellPoint, highlights },
      canViewToday: form.canViewToday,
      includeTransport: form.includeTransport,
      sellerId: 'me',
      sellerName: currentUser.name,
      sellerAvatar: currentUser.avatar,
      publishedAt: new Date().toISOString(),
      collected: false,
      status: 'online' as const,
    };
  }, [form, checks, videos, currentUser]);

  const handlePublish = () => {
    if (!form.brand || !form.model || !form.hours || !form.minPrice) {
      Taro.showToast({ title: '请补全必填信息', icon: 'none' });
      return;
    }
    if (Object.keys(videos).length === 0) {
      Taro.showToast({ title: '请至少上传1个验机视频', icon: 'none' });
      return;
    }
    const id = `m_${Date.now()}`;
    const newMachine: Machine = {
      ...previewMachine,
      id,
      title: `${form.brand} ${form.model} ${form.categoryLabel}`,
      publishedAt: new Date().toISOString(),
    };
    publishMachine(newMachine);
    // 刷新降价提醒匹配状态
    refreshPriceAlertMatches();
    Taro.showModal({
      title: '发布成功',
      content: `「${newMachine.title}」已发布，买家可在找车页搜到您的车源！`,
      showCancel: false,
      confirmText: '查看我的车源',
      success: () => setTab('list'),
    });
  };

  const toggleCategory = (value: MachineCategory, label: string) => {
    setForm((f) => ({ ...f, category: value, categoryLabel: label }));
  };

  const handleMachineClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` });
  };

  // 打开改价弹层
  const openPriceEdit = (m: Machine) => {
    setEditingMachine(m);
    setEditPrice(String(m.minPrice));
    setActionType('price');
  };

  // 打开刷新可看时间弹层
  const openRefreshEdit = (m: Machine) => {
    setEditingMachine(m);
    setEditCanToday(m.canViewToday);
    setEditNextDate(m.nextAvailableDate || dayjs().add(1, 'day').format('YYYY-MM-DD'));
    setActionType('refresh');
  };

  // 打开状态切换
  const openStatusEdit = (m: Machine) => {
    setEditingMachine(m);
    setActionType('status');
  };

  // 确认改价
  const confirmPriceEdit = () => {
    if (!editingMachine) return;
    const newPrice = Number(editPrice);
    if (!newPrice || newPrice <= 0) {
      Taro.showToast({ title: '请输入有效价格', icon: 'none' });
      return;
    }
    updateMachinePrice(editingMachine.id, newPrice);
    Taro.showToast({ title: '价格已更新', icon: 'success' });
    closeActionSheet();
  };

  // 确认刷新
  const confirmRefreshEdit = () => {
    if (!editingMachine) return;
    refreshAvailable(editingMachine.id, editCanToday, editNextDate);
    Taro.showToast({ title: '可看时间已刷新', icon: 'success' });
    closeActionSheet();
  };

  // 确认状态切换
  const confirmStatus = (status: Machine['status']) => {
    if (!editingMachine) return;
    toggleMachineStatus(editingMachine.id, status);
    Taro.showToast({ title: STATUS_LABEL[status].label, icon: 'success' });
    closeActionSheet();
  };

  const closeActionSheet = () => {
    setEditingMachine(null);
    setActionType(null);
  };

  const checkOptions: { key: string; label: string }[] = [
    { key: 'noOilLeak', label: '无漏油' },
    { key: 'noRepair', label: '无大修' },
    { key: 'paperComplete', label: '手续齐全' },
  ];

  const extraOptions: { key: keyof Pick<FormState, 'canViewToday' | 'includeTransport'>; label: string }[] = [
    { key: 'canViewToday', label: '可当天看机' },
    { key: 'includeTransport', label: '包板车运输' },
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
          <Text className={styles.tabText}>我的车源({myMachines.length})</Text>
        </View>
      </View>

      {tab === 'form' ? (
        <ScrollView scrollY className={styles.form}>
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
                    onClick={() => toggleCategory(c.value, c.label)}
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
            <Text style={{ fontSize: '24rpx', color: '#86909c' }}>
              已上传 {Object.keys(videos).length} / {VIDEO_TYPES.length} 段
            </Text>
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

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>⚙️</Text> 其他设置
            </Text>
            <View className={styles.checkRow}>
              {extraOptions.map((o) => (
                <View key={o.key} className={styles.checkItem} onClick={() => updateForm(o.key, !form[o.key])}>
                  <View className={classnames(styles.checkBox, form[o.key] && styles.checkActive)}>
                    <Text>{form[o.key] ? '✓' : ''}</Text>
                  </View>
                  <Text className={styles.checkText}>{o.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <SectionHeader title="卖点卡片预览" subtitle="自动生成" />
          <SellPointCard machine={previewMachine} />

          <View style={{ height: '32rpx' }} />
        </ScrollView>
      ) : (
        <ScrollView scrollY className={styles.myList}>
          <SectionHeader title="我的车源" subtitle={`${myMachines.length}台`} />
          {myMachines.length === 0 ? (
            <EmptyState text="还没有发过的车源" hint="点击上方发布新车源" />
          ) : (
            myMachines.map((m) => {
              const st = STATUS_LABEL[m.status];
              const priceDropped = m.originalPrice && m.minPrice < m.originalPrice;
              return (
                <View key={m.id} className={styles.myItem}>
                  <View className={styles.myItemHeader} onClick={() => handleMachineClick(m.id)}>
                    <Image className={styles.myCover} src={m.cover} mode="aspectFill" />
                    <View className={styles.myBody}>
                      <Text className={styles.myTitle} numberOfLines={1}>{m.title}</Text>
                      <View className={styles.myInfoRow}>
                        <View style={{
                          padding: '2rpx 12rpx', borderRadius: '4rpx',
                          background: st.bg, color: st.color, fontSize: '22rpx',
                        }}>
                          {st.label}
                        </View>
                        {priceDropped && (
                          <View style={{
                            padding: '2rpx 12rpx', borderRadius: '4rpx',
                            background: '#ffece8', color: '#f53f3f', fontSize: '22rpx',
                          }}>
                            ↓ ¥{(m.originalPrice! - m.minPrice).toFixed(1)}万
                          </View>
                        )}
                        <Text className={styles.myTag}>📹 {m.videos.length}</Text>
                        <Text className={styles.myTag}>⏱ {formatHours(m.hours)}</Text>
                      </View>
                      <View className={styles.myInfoRow}>
                        <Text className={styles.myPrice}>¥{m.minPrice}万</Text>
                        <Text className={styles.mySite} numberOfLines={1}>📍 {m.site || m.city}</Text>
                      </View>
                    </View>
                  </View>

                  {m.sellPoint.highlights && m.sellPoint.highlights.length > 0 && (
                    <View className={styles.myHighlights}>
                      {m.sellPoint.highlights.slice(0, 3).map((h, i) => (
                        <Text key={i} className={styles.myHighlight}>· {h}</Text>
                      ))}
                    </View>
                  )}

                  <View className={styles.myActions}>
                    {m.status === 'online' ? (
                      <>
                        <View className={styles.myBtn} onClick={() => openPriceEdit(m)}>
                          <Text>💰 改价</Text>
                        </View>
                        <View className={styles.myBtn} onClick={() => openRefreshEdit(m)}>
                          <Text>🔄 刷新可看时间</Text>
                        </View>
                        <View className={classnames(styles.myBtn, styles.myBtnWarn)} onClick={() => openStatusEdit(m)}>
                          <Text>📴 下架</Text>
                        </View>
                      </>
                    ) : m.status === 'offline' ? (
                      <>
                        <View className={classnames(styles.myBtn, styles.myBtnPrimary)} onClick={() => confirmStatus('online')}>
                          <Text>✅ 重新上架</Text>
                        </View>
                        <View className={styles.myBtn} onClick={() => openPriceEdit(m)}>
                          <Text>💰 改价</Text>
                        </View>
                      </>
                    ) : (
                      <Text style={{ fontSize: '24rpx', color: '#86909c' }}>此车源已成交</Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {tab === 'form' && (
        <View className={styles.footer}>
          <View className={styles.publishBtn} onClick={handlePublish}>
            <Text className={styles.publishBtnText}>发布车源</Text>
          </View>
        </View>
      )}

      {/* 改价弹层 */}
      {actionType === 'price' && editingMachine && (
        <View className={styles.mask} onClick={closeActionSheet}>
          <View className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.sheetTitle}>修改「{editingMachine.title}」价格</Text>
            <Text className={styles.sheetSubtitle}>原价 ¥{editingMachine.minPrice}万（改价后找车页和详情同步更新）</Text>
            <Input
              className={styles.sheetInput}
              type="digit"
              placeholder="请输入新价格"
              value={editPrice}
              onInput={(e) => setEditPrice(e.detail.value)}
            />
            <Text className={styles.sheetInputSuffix}>万元</Text>
            <View className={styles.sheetActions}>
              <View className={styles.sheetCancel} onClick={closeActionSheet}>取消</View>
              <View className={styles.sheetConfirm} onClick={confirmPriceEdit}>确认修改</View>
            </View>
          </View>
        </View>
      )}

      {/* 刷新可看时间弹层 */}
      {actionType === 'refresh' && editingMachine && (
        <View className={styles.mask} onClick={closeActionSheet}>
          <View className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.sheetTitle}>刷新「{editingMachine.title}」可看时间</Text>
            <Text className={styles.sheetSubtitle}>告诉买家你什么时候方便看机</Text>
            <View className={styles.switchRow}>
              <Text>当天可看</Text>
              <View
                className={classnames(styles.switch, editCanToday && styles.switchOn)}
                onClick={() => setEditCanToday(!editCanToday)}
              >
                <View className={classnames(styles.switchDot, editCanToday && styles.switchDotOn)} />
              </View>
            </View>
            <View style={{ marginTop: '24rpx' }}>
              <Text className={styles.sheetSubtitle}>下次可看日期</Text>
              <Input
                className={styles.sheetInput}
                placeholder="YYYY-MM-DD"
                value={editNextDate}
                onInput={(e) => setEditNextDate(e.detail.value)}
              />
            </View>
            <View className={styles.timeSlots}>
              {TIME_SLOTS.map((s) => (
                <View key={s} className={styles.timeSlotChip}>
                  <Text>{s}</Text>
                </View>
              ))}
            </View>
            <View className={styles.sheetActions}>
              <View className={styles.sheetCancel} onClick={closeActionSheet}>取消</View>
              <View className={styles.sheetConfirm} onClick={confirmRefreshEdit}>确认刷新</View>
            </View>
          </View>
        </View>
      )}

      {/* 状态切换确认弹层 */}
      {actionType === 'status' && editingMachine && (
        <View className={styles.mask} onClick={closeActionSheet}>
          <View className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.sheetTitle}>下架「{editingMachine.title}」</Text>
            <Text className={styles.sheetSubtitle}>下架后买家将无法在找车页搜索到该车源</Text>
            <View className={styles.sheetActions}>
              <View className={styles.sheetCancel} onClick={closeActionSheet}>取消</View>
              <View className={classnames(styles.sheetConfirm, styles.sheetWarn)} onClick={() => confirmStatus('offline')}>
                确认下架
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default PublishPage;
