import React, { useState, useMemo } from 'react';
import { View, Text, Image, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useAppStore } from '@/store/useAppStore';
import { mockBookings } from '@/data/mine';
import { formatPrice } from '@/utils/format';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const TIME_SLOTS = ['09:00-11:00', '11:00-13:00', '14:00-16:00', '16:00-18:00'];

const statusMap: Record<string, { text: string; bg: string; color: string }> = {
  pending: { text: '待确认', bg: '#fff3e8', color: '#ff6b00' },
  confirmed: { text: '已确认', bg: '#e8fff0', color: '#00b42a' },
  done: { text: '已看机', bg: '#e8f3ff', color: '#165dff' },
  failed: { text: '已取消', bg: '#f2f3f5', color: '#86909c' },
};

const BookingPage: React.FC = () => {
  const router = useRouter();
  const machineId = router.params.id || '';
  const machine = useAppStore((s) => (machineId ? s.getMachineById(machineId) : undefined));

  const dateOptions = useMemo(() => {
    const arr: { weekday: string; day: string; label: string; value: string }[] = [];
    for (let i = 0; i < 4; i++) {
      const d = dayjs().add(i, 'day');
      const wd = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.day()];
      arr.push({
        weekday: i === 0 ? '今天' : i === 1 ? '明天' : wd,
        day: d.format('MM/DD'),
        label: i === 0 ? '当天可看' : '',
        value: d.format('YYYY-MM-DD'),
      });
    }
    return arr;
  }, []);

  const [selectedDate, setSelectedDate] = useState(dateOptions[0].value);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);
  const [buyerName, setBuyerName] = useState('我');
  const [buyerPhone, setBuyerPhone] = useState('139-9000-5678');

  const handleSubmit = () => {
    if (!buyerName || !buyerPhone) {
      Taro.showToast({ title: '请补全联系人信息', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '预约成功',
      content: `已预约 ${selectedDate} ${selectedSlot} 看机，卖家将收到通知并确认可看时间。`,
      showCancel: false,
      confirmText: '好的',
      success: () => Taro.navigateBack(),
    });
  };

  const handleNavigate = () => {
    if (machine) {
      Taro.showToast({ title: `导航至 ${machine.site}`, icon: 'none' });
    }
  };

  const handleBookingClick = (id: string) => {
    Taro.showToast({ title: '查看预约详情', icon: 'none' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.content}>
        {machine && (
          <View className={styles.machineCard}>
            <Image className={styles.machineCover} src={machine.cover} mode="aspectFill" />
            <View className={styles.machineBody}>
              <Text className={styles.machineTitle}>{machine.title}</Text>
              <Text className={styles.machinePrice}>¥{formatPrice(machine.minPrice)}</Text>
              <Text className={styles.machineLocation}>📍 {machine.city} {machine.site}</Text>
            </View>
          </View>
        )}

        {machine && (
          <View className={styles.locationCard}>
            <View className={styles.locationIcon}>
              <Text>🗺️</Text>
            </View>
            <View className={styles.locationBody}>
              <Text className={styles.locationTitle}>{machine.site}</Text>
              <Text className={styles.locationAddr}>{machine.city} · 卖家：{machine.sellerName}</Text>
            </View>
            <View className={styles.navBtn} onClick={handleNavigate}>
              <Text className={styles.navText}>导航</Text>
            </View>
          </View>
        )}

        {machine && (
          <>
            <View className={styles.section}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>📅</Text> 选择可看日期
              </Text>
              <View className={styles.dateRow}>
                {dateOptions.map((d) => (
                  <View
                    key={d.value}
                    className={classnames(styles.dateItem, selectedDate === d.value && styles.dateItemActive)}
                    onClick={() => setSelectedDate(d.value)}
                  >
                    <Text className={styles.dateWeekday}>{d.weekday}</Text>
                    <Text className={styles.dateDay}>{d.day}</Text>
                    <Text className={styles.dateLabel}>{d.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.section}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>⏰</Text> 选择可看时段
              </Text>
              <View className={styles.slotRow}>
                {TIME_SLOTS.map((s) => (
                  <View
                    key={s}
                    className={classnames(styles.slotItem, selectedSlot === s && styles.slotActive)}
                    onClick={() => setSelectedSlot(s)}
                  >
                    <Text className={styles.slotText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.section}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>👤</Text> 联系人信息
              </Text>
              <View className={styles.fieldRow}>
                <Text className={styles.fieldLabel}>看机人</Text>
                <Input
                  className={styles.fieldInput}
                  value={buyerName}
                  onInput={(e) => setBuyerName(e.detail.value)}
                  placeholder="请输入姓名"
                />
              </View>
              <View className={styles.fieldRow}>
                <Text className={styles.fieldLabel}>联系电话</Text>
                <Input
                  className={styles.fieldInput}
                  type="number"
                  value={buyerPhone}
                  onInput={(e) => setBuyerPhone(e.detail.value)}
                  placeholder="请输入手机号"
                />
              </View>
            </View>
          </>
        )}

        <SectionHeader title="我的预约看机记录" subtitle={`${mockBookings.length}条`} />
        {mockBookings.length === 0 ? (
          <EmptyState text="还没有预约记录" />
        ) : (
          mockBookings.map((b) => {
            const st = statusMap[b.status] || statusMap.pending;
            return (
              <View key={b.id} className={styles.bookingItem} onClick={() => handleBookingClick(b.id)}>
                <Image className={styles.bookingCover} src={b.machineCover} mode="aspectFill" />
                <View className={styles.bookingBody}>
                  <Text className={styles.bookingTitle}>{b.machineTitle}</Text>
                  <Text className={styles.bookingTime}>📅 {b.viewDate} {b.viewTimeSlot}</Text>
                  <Text className={styles.bookingSeller}>卖家：{b.sellerName} · {b.sellerPhone}</Text>
                </View>
                <View className={styles.bookingStatus} style={{ background: st.bg, color: st.color }}>
                  <Text>{st.text}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {machine && (
        <View className={styles.footer}>
          <View className={styles.submitBtn} onClick={handleSubmit}>
            <Text className={styles.submitBtnText}>确认预约看机</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default BookingPage;
