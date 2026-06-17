import React, { useState } from 'react';
import { View, Text, Image, Input, Switch } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { mockConversations } from '@/data/conversations';
import { formatRelativeTime } from '@/utils/format';
import type { Conversation, Broadcast } from '@/types';
import BroadcastCard from '@/components/BroadcastCard';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const CATEGORIES = ['挖掘机', '装载机', '推土机', '压路机', '起重机', '泵车', '自卸车', '叉车'];

const convTypeMap: Record<Conversation['type'], { text: string; cls: string }> = {
  chat: { text: '聊', cls: '' },
  booking: { text: '约', cls: styles.convTypeBooking },
  broadcast: { text: '通', cls: styles.convTypeBroadcast },
};

const MessagePage: React.FC = () => {
  const router = useRouter();
  const initialTab = router.params.tab === 'broadcast' ? 'broadcast' : 'chat';
  const [tab, setTab] = useState<'chat' | 'broadcast'>(initialTab as 'chat' | 'broadcast');

  const broadcasts = useAppStore((s) => s.broadcasts);
  const addBroadcast = useAppStore((s) => s.addBroadcast);
  const currentUser = useAppStore((s) => s.currentUser);

  const totalUnread = mockConversations.reduce((sum, c) => sum + c.unread, 0);

  // 发布广播表单
  const [showPublish, setShowPublish] = useState(false);
  const [form, setForm] = useState({
    category: '挖掘机',
    modelKeyword: '',
    maxPrice: '',
    city: '深圳',
    canTransport: false,
    desc: '',
  });

  const handleConvClick = (c: Conversation) => {
    Taro.navigateTo({ url: `/pages/chat/index?id=${c.id}` });
  };

  const handleBroadcastRespond = (b: Broadcast) => {
    Taro.showToast({ title: `已向${b.buyerName}推送车源`, icon: 'success' });
  };

  const updateForm = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePublish = () => {
    if (!form.modelKeyword.trim()) {
      Taro.showToast({ title: '请输入想找的机型', icon: 'none' });
      return;
    }
    if (!form.maxPrice || Number(form.maxPrice) <= 0) {
      Taro.showToast({ title: '请输入预算', icon: 'none' });
      return;
    }
    if (!form.city.trim()) {
      Taro.showToast({ title: '请输入所在城市', icon: 'none' });
      return;
    }

    const newBroadcast: Broadcast = {
      id: `bd_${Date.now()}`,
      buyerName: currentUser.name,
      buyerAvatar: currentUser.avatar,
      categoryLabel: form.category,
      modelKeyword: form.modelKeyword,
      maxPrice: Number(form.maxPrice),
      city: form.city,
      canTransport: form.canTransport,
      desc: form.desc,
      createdAt: new Date().toISOString(),
      distanceKm: 0,
    };
    addBroadcast(newBroadcast);
    setShowPublish(false);
    setForm({
      category: '挖掘机',
      modelKeyword: '',
      maxPrice: '',
      city: '深圳',
      canTransport: false,
      desc: '',
    });
    Taro.showToast({ title: '发布成功，周边卖家将接单', icon: 'success' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tabItem, tab === 'chat' && styles.tabActive)}
          onClick={() => setTab('chat')}
        >
          <Text className={styles.tabText}>
            会话
            {totalUnread > 0 && <Text className={styles.tabBadge}>{totalUnread}</Text>}
          </Text>
        </View>
        <View
          className={classnames(styles.tabItem, tab === 'broadcast' && styles.tabActive)}
          onClick={() => setTab('broadcast')}
        >
          <Text className={styles.tabText}>
            急找广播
            {broadcasts.length > 0 && <Text className={styles.tabBadge}>{broadcasts.length}</Text>}
          </Text>
        </View>
      </View>

      {tab === 'chat' ? (
        <View className={styles.list}>
          {mockConversations.length === 0 ? (
            <EmptyState text="还没有会话消息" hint="去逛逛车源开始沟通吧" />
          ) : (
            mockConversations.map((c) => {
              const tm = convTypeMap[c.type];
              return (
                <View key={c.id} className={styles.convItem} onClick={() => handleConvClick(c)}>
                  <View className={styles.avatarWrap}>
                    <Image className={styles.avatar} src={c.peerAvatar} mode="aspectFill" />
                    <View className={classnames(styles.convType, tm.cls)}>
                      <Text>{tm.text}</Text>
                    </View>
                  </View>
                  <View className={styles.convBody}>
                    <View className={styles.convTop}>
                      <Text className={styles.convName}>{c.peerName}</Text>
                      <Text className={styles.convTime}>{formatRelativeTime(c.lastTime)}</Text>
                    </View>
                    <View className={styles.convMachine}>
                      <Text className={styles.machineIcon}>🚜</Text>
                      <Text className={styles.machineText}>{c.machineTitle}</Text>
                    </View>
                    <Text className={styles.convMsg}>{c.lastMessage}</Text>
                  </View>
                  {c.unread > 0 && <Text className={styles.unread}>{c.unread}</Text>}
                </View>
              );
            })
          )}
        </View>
      ) : (
        <View className={styles.broadcastList}>
          {broadcasts.length === 0 ? (
            <EmptyState text="暂无急找设备广播" hint="点击右下角按钮发布你的需求" />
          ) : (
            broadcasts.map((b) => (
              <View key={b.id} style={{ marginBottom: '24rpx' }}>
                <BroadcastCard broadcast={b} onRespond={() => handleBroadcastRespond(b)} />
              </View>
            ))
          )}
        </View>
      )}

      {tab === 'broadcast' && (
        <View className={styles.fab} onClick={() => setShowPublish(true)}>
          <Text className={styles.fabText}>+ 发布急找</Text>
        </View>
      )}

      {showPublish && (
        <View className={styles.mask} onClick={() => setShowPublish(false)}>
          <View className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <View className={styles.sheetHeader}>
              <Text className={styles.sheetTitle}>发布急找设备</Text>
              <Text className={styles.sheetClose} onClick={() => setShowPublish(false)}>✕</Text>
            </View>

            <View className={styles.sheetBody}>
              <View className={styles.formSection}>
                <Text className={styles.formLabel}>机型分类</Text>
                <View className={styles.tagRow}>
                  {CATEGORIES.map((c) => (
                    <View
                      key={c}
                      className={classnames(styles.tagItem, form.category === c && styles.tagActive)}
                      onClick={() => updateForm('category', c)}
                    >
                      <Text className={styles.tagText}>{c}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.formRow}>
                <Text className={styles.formLabel}>想找机型</Text>
                <Input
                  className={styles.formInput}
                  value={form.modelKeyword}
                  onInput={(e) => updateForm('modelKeyword', e.detail.value)}
                  placeholder="如：20吨级、220型、带破碎锤"
                />
              </View>

              <View className={styles.formRow}>
                <Text className={styles.formLabel}>预算（万元）</Text>
                <Input
                  className={styles.formInput}
                  type="digit"
                  value={form.maxPrice}
                  onInput={(e) => updateForm('maxPrice', e.detail.value)}
                  placeholder="最高接受价"
                />
              </View>

              <View className={styles.formRow}>
                <Text className={styles.formLabel}>所在城市</Text>
                <Input
                  className={styles.formInput}
                  value={form.city}
                  onInput={(e) => updateForm('city', e.detail.value)}
                  placeholder="如：深圳南山"
                />
              </View>

              <View className={styles.formRow}>
                <Text className={styles.formLabel}>是否需要包板车</Text>
                <Switch
                  checked={form.canTransport}
                  onChange={(e) => updateForm('canTransport', e.detail.value)}
                  color="#ff6b00"
                />
              </View>

              <View className={styles.formSection}>
                <Text className={styles.formLabel}>补充说明</Text>
                <Input
                  className={styles.formTextarea}
                  value={form.desc}
                  onInput={(e) => updateForm('desc', e.detail.value)}
                  placeholder="补充设备要求、使用场景、工期等"
                />
              </View>
            </View>

            <View className={styles.sheetFooter}>
              <View className={styles.submitBtn} onClick={handlePublish}>
                <Text className={styles.submitBtnText}>立即发布</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default MessagePage;
