import React, { useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { mockConversations } from '@/data/conversations';
import { mockBroadcasts } from '@/data/broadcasts';
import { formatRelativeTime } from '@/utils/format';
import type { Conversation, Broadcast } from '@/types';
import BroadcastCard from '@/components/BroadcastCard';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const convTypeMap: Record<Conversation['type'], { text: string; cls: string }> = {
  chat: { text: '聊', cls: '' },
  booking: { text: '约', cls: styles.convTypeBooking },
  broadcast: { text: '通', cls: styles.convTypeBroadcast },
};

const MessagePage: React.FC = () => {
  const router = useRouter();
  const initialTab = router.params.tab === 'broadcast' ? 'broadcast' : 'chat';
  const [tab, setTab] = useState<'chat' | 'broadcast'>(initialTab as 'chat' | 'broadcast');

  const totalUnread = mockConversations.reduce((sum, c) => sum + c.unread, 0);

  const handleConvClick = (c: Conversation) => {
    Taro.navigateTo({ url: `/pages/chat/index?id=${c.id}` });
  };

  const handleBroadcastRespond = (b: Broadcast) => {
    Taro.showToast({ title: `已向${b.buyerName}推送车源`, icon: 'success' });
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
            {mockBroadcasts.length > 0 && <Text className={styles.tabBadge}>{mockBroadcasts.length}</Text>}
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
          {mockBroadcasts.length === 0 ? (
            <EmptyState text="暂无急找设备广播" hint="周边买家有需求会推送到这里" />
          ) : (
            mockBroadcasts.map((b) => (
              <View key={b.id} style={{ marginBottom: '24rpx' }}>
                <BroadcastCard broadcast={b} onRespond={() => handleBroadcastRespond(b)} />
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
};

export default MessagePage;
