import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, Input, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { mockChatMessages, INSPECT_TAG_PRESETS, BARGAIN_NOTE_PRESETS } from '@/data/chatMessages';
import { mockConversations } from '@/data/conversations';
import type { ChatMessage } from '@/types';
import { formatPrice, formatRelativeTime } from '@/utils/format';
import styles from './index.module.scss';

const ChatPage: React.FC = () => {
  const router = useRouter();
  const convId = router.params.id || 'c001';
  const conversation = mockConversations.find((c) => c.id === convId) || mockConversations[0];

  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages[convId] || []);
  const [inputText, setInputText] = useState('');

  // 弹层状态
  const [sheetType, setSheetType] = useState<'inspect' | 'bargain' | null>(null);
  const [inspectSelected, setInspectSelected] = useState<string[]>([]);
  const [bargainFrom, setBargainFrom] = useState('');
  const [bargainTo, setBargainTo] = useState('');
  const [bargainNote, setBargainNote] = useState('');

  const scrollRef = useRef<string>('');

  useEffect(() => {
    console.info('[Chat] open conversation', convId);
    scrollRef.current = `msg-${messages.length}`;
  }, [convId, messages.length]);

  const sendMessage = (msg: Omit<ChatMessage, 'id' | 'conversationId' | 'createdAt' | 'fromMe'>) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg${Date.now()}`,
      conversationId: convId,
      fromMe: true,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    sendMessage({ type: 'text', content: inputText.trim() });
    setInputText('');
  };

  const toggleInspectTag = (tag: string) => {
    setInspectSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSendInspect = () => {
    if (inspectSelected.length === 0) {
      Taro.showToast({ title: '请至少选择1项验机重点', icon: 'none' });
      return;
    }
    sendMessage({ type: 'inspect', content: '验机重点', inspectTags: inspectSelected });
    setInspectSelected([]);
    setSheetType(null);
  };

  const handleSendBargain = () => {
    const from = Number(bargainFrom);
    const to = Number(bargainTo);
    if (!from || !to || to >= from) {
      Taro.showToast({ title: '请填写有效的砍价价格', icon: 'none' });
      return;
    }
    sendMessage({
      type: 'bargain',
      content: '砍价记录',
      bargainFrom: from,
      bargainTo: to,
      bargainNote: bargainNote || '未填写理由',
    });
    setBargainFrom('');
    setBargainTo('');
    setBargainNote('');
    setSheetType(null);
  };

  const renderMessage = (msg: ChatMessage) => {
    if (msg.type === 'inspect') {
      return (
        <View className={styles.inspectCard}>
          <View className={styles.inspectHeader}>
            <Text className={styles.inspectEmoji}>🔍</Text>
            <Text className={styles.inspectTitle}>验机重点</Text>
          </View>
          <View className={styles.inspectBody}>
            {msg.inspectTags?.map((t, idx) => (
              <View key={idx} className={styles.inspectTag}>
                <Text className={styles.inspectTagDot}>●</Text>
                <Text className={styles.inspectTagText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }
    if (msg.type === 'bargain') {
      return (
        <View className={styles.bargainCard}>
          <View className={styles.bargainHeader}>
            <Text className={styles.bargainEmoji}>💰</Text>
            <Text className={styles.bargainTitle}>砍价记录</Text>
          </View>
          <View className={styles.bargainBody}>
            <View className={styles.bargainPriceRow}>
              <Text className={styles.bargainFrom}>{formatPrice(msg.bargainFrom || 0)}</Text>
              <Text className={styles.bargainArrow}>→</Text>
              <Text className={styles.bargainTo}>{formatPrice(msg.bargainTo || 0)}</Text>
              <Text className={styles.bargainUnit}>万</Text>
            </View>
            <View className={styles.bargainNote}>
              <Text>理由：{msg.bargainNote}</Text>
            </View>
          </View>
        </View>
      );
    }
    return <Text className={styles.msgText}>{msg.content}</Text>;
  };

  return (
    <View className={styles.page}>
      <View className={styles.machineBar}>
        <Image className={styles.machineBarCover} src={conversation.machineCover} mode="aspectFill" />
        <View className={styles.machineBarText}>
          <Text className={styles.machineBarTitle}>{conversation.peerName} · {conversation.machineTitle}</Text>
          <Text className={styles.machineBarSub}>验机重点 · 砍价记录 · 全程留痕</Text>
        </View>
      </View>

      <ScrollView scrollY className={styles.msgList} scrollIntoView={scrollRef.current}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            id={`msg-${msg.id}`}
            className={classnames(styles.msgItem, msg.fromMe && styles.msgItemMine)}
          >
            <Image
              className={styles.msgAvatar}
              src={msg.fromMe ? 'https://picsum.photos/id/64/200/200' : conversation.peerAvatar}
              mode="aspectFill"
            />
            <View className={styles.msgBubble}>
              {renderMessage(msg)}
              <Text className={styles.msgTime}>{formatRelativeTime(msg.createdAt)}</Text>
            </View>
          </View>
        ))}
        <View id={`msg-${messages.length}`} />
      </ScrollView>

      <View className={styles.inputBar}>
        <View className={styles.quickBtn} onClick={() => setSheetType('inspect')}>
          <Text>🔍</Text>
        </View>
        <View className={styles.quickBtn} onClick={() => setSheetType('bargain')}>
          <Text>💰</Text>
        </View>
        <View className={styles.inputBox}>
          <Input
            className={styles.textInput}
            placeholder="发消息..."
            value={inputText}
            onInput={(e) => setInputText(e.detail.value)}
            confirmType="send"
            onConfirm={handleSendText}
          />
        </View>
        <View className={styles.sendBtn} onClick={handleSendText}>
          <Text className={styles.sendText}>发送</Text>
        </View>
      </View>

      {sheetType && <View className={styles.mask} onClick={() => setSheetType(null)} />}

      {sheetType === 'inspect' && (
        <View className={styles.sheet}>
          <Text className={styles.sheetTitle}>发送验机重点</Text>
          <View className={styles.tagGrid}>
            {INSPECT_TAG_PRESETS.map((t) => {
              const active = inspectSelected.includes(t);
              return (
                <View
                  key={t}
                  className={classnames(styles.tagPill, active && styles.tagPillActive)}
                  onClick={() => toggleInspectTag(t)}
                >
                  <Text className={styles.tagPillText}>{t}</Text>
                </View>
              );
            })}
          </View>
          <View className={styles.sheetActions}>
            <View className={classnames(styles.sheetBtn, styles.cancelBtn)} onClick={() => setSheetType(null)}>
              <Text className={styles.cancelText}>取消</Text>
            </View>
            <View className={classnames(styles.sheetBtn, styles.confirmBtn)} onClick={handleSendInspect}>
              <Text className={styles.confirmText}>发送({inspectSelected.length})</Text>
            </View>
          </View>
        </View>
      )}

      {sheetType === 'bargain' && (
        <View className={styles.sheet}>
          <Text className={styles.sheetTitle}>发送砍价记录</Text>
          <View className={styles.sheetField}>
            <Text className={styles.sheetFieldLabel}>原价(万)</Text>
            <Input
              className={styles.sheetFieldInput}
              type="digit"
              placeholder="如 42"
              value={bargainFrom}
              onInput={(e) => setBargainFrom(e.detail.value)}
            />
          </View>
          <View className={styles.sheetField}>
            <Text className={styles.sheetFieldLabel}>砍至(万)</Text>
            <Input
              className={styles.sheetFieldInput}
              type="digit"
              placeholder="如 39"
              value={bargainTo}
              onInput={(e) => setBargainTo(e.detail.value)}
            />
          </View>
          <View style={{ marginTop: '16rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#86909c' }}>砍价理由（可选）</Text>
          </View>
          <View className={styles.tagGrid} style={{ marginTop: '12rpx' }}>
            {BARGAIN_NOTE_PRESETS.map((n) => (
              <View
                key={n}
                className={classnames(styles.tagPill, bargainNote === n && styles.tagPillActive)}
                onClick={() => setBargainNote(n)}
              >
                <Text className={styles.tagPillText}>{n}</Text>
              </View>
            ))}
          </View>
          <View className={styles.sheetActions}>
            <View className={classnames(styles.sheetBtn, styles.cancelBtn)} onClick={() => setSheetType(null)}>
              <Text className={styles.cancelText}>取消</Text>
            </View>
            <View className={classnames(styles.sheetBtn, styles.confirmBtn)} onClick={handleSendBargain}>
              <Text className={styles.confirmText}>发送</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ChatPage;
