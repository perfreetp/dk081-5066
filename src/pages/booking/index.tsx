import React, { useState, useMemo } from 'react';
import { View, Text, Image, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useAppStore } from '@/store/useAppStore';
import { formatPrice } from '@/utils/format';
import type { Booking } from '@/types';
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
  const machineId = router.params.id || router.params.machineId || '';
  const bookingId = router.params.bookingId || '';
  const machine = useAppStore((s) => (machineId ? s.getMachineById(machineId) : undefined));
  const bookings = useAppStore((s) => s.bookings);
  const addBooking = useAppStore((s) => s.addBooking);
  const updateBookingStatus = useAppStore((s) => s.updateBookingStatus);
  const rescheduleBooking = useAppStore((s) => s.rescheduleBooking);
  const currentUser = useAppStore((s) => s.currentUser);

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
  const [buyerName, setBuyerName] = useState(currentUser.name);
  const [buyerPhone, setBuyerPhone] = useState(currentUser.phone);
  const [submitted, setSubmitted] = useState(false);

  // 详情弹层
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  // 改期弹层
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(dateOptions[0].value);
  const [rescheduleSlot, setRescheduleSlot] = useState(TIME_SLOTS[0]);

  // 如果从我的页带bookingId进来，直接打开详情
  useMemo(() => {
    if (bookingId) {
      const b = bookings.find((x) => x.id === bookingId);
      if (b) {
        setTimeout(() => setDetailBooking(b), 200);
      }
    }
  }, [bookingId, bookings]);

  const handleSubmit = () => {
    if (!buyerName || !buyerPhone) {
      Taro.showToast({ title: '请补全联系人信息', icon: 'none' });
      return;
    }
    if (!machine) {
      Taro.showToast({ title: '车源信息缺失', icon: 'none' });
      return;
    }
    const newBooking: Booking = {
      id: `bk_${Date.now()}`,
      machineId: machine.id,
      machineTitle: machine.title,
      machineCover: machine.cover,
      sellerName: machine.sellerName,
      sellerPhone: '138-8000-1234',
      site: machine.site,
      city: machine.city,
      viewDate: selectedDate,
      viewTimeSlot: selectedSlot,
      buyerName,
      buyerPhone,
      status: 'pending',
    };
    addBooking(newBooking);
    setSubmitted(true);
    Taro.showModal({
      title: '预约成功',
      content: `已预约 ${selectedDate} ${selectedSlot} 看机，卖家将收到通知并确认可看时间。可在"我的-预约看机"中查看。`,
      showCancel: false,
      confirmText: '查看预约',
      success: () => {
        setDetailBooking(newBooking);
      },
    });
  };

  const handleNavigate = () => {
    if (detailBooking) {
      Taro.showToast({ title: `导航至 ${detailBooking.site}`, icon: 'none' });
    } else if (machine) {
      Taro.showToast({ title: `导航至 ${machine.site}`, icon: 'none' });
    }
  };

  const handleBookingClick = (b: Booking) => {
    setDetailBooking(b);
  };

  const handleChangeStatus = (status: Booking['status'], tip: string) => {
    if (!detailBooking) return;
    updateBookingStatus(detailBooking.id, status);
    setDetailBooking({ ...detailBooking, status });
    Taro.showToast({ title: tip, icon: 'success' });
  };

  const handleOpenReschedule = () => {
    if (!detailBooking) return;
    setRescheduleDate(detailBooking.viewDate);
    setRescheduleSlot(detailBooking.viewTimeSlot);
    setShowReschedule(true);
  };

  const handleConfirmReschedule = () => {
    if (!detailBooking) return;
    rescheduleBooking(detailBooking.id, rescheduleDate, rescheduleSlot);
    setDetailBooking({ ...detailBooking, viewDate: rescheduleDate, viewTimeSlot: rescheduleSlot, status: 'pending' });
    setShowReschedule(false);
    Taro.showToast({ title: '改期成功', icon: 'success' });
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

        {machine && !submitted && (
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

        <SectionHeader title="我的预约看机记录" subtitle={`${bookings.length}条`} />
        {bookings.length === 0 ? (
          <EmptyState text="还没有预约记录" />
        ) : (
          bookings.map((b) => {
            const st = statusMap[b.status] || statusMap.pending;
            return (
              <View key={b.id} className={styles.bookingItem} onClick={() => handleBookingClick(b)}>
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

      {machine && !submitted && (
        <View className={styles.footer}>
          <View className={styles.submitBtn} onClick={handleSubmit}>
            <Text className={styles.submitBtnText}>确认预约看机</Text>
          </View>
        </View>
      )}

      {/* 预约详情弹层 */}
      {detailBooking && (
        <View className={styles.mask} onClick={() => setDetailBooking(null)}>
          <View className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <View className={styles.sheetHeader}>
              <Text className={styles.sheetTitle}>预约看机详情</Text>
              <Text className={styles.sheetClose} onClick={() => setDetailBooking(null)}>✕</Text>
            </View>

            <View className={styles.detailMachine}>
              <Image className={styles.detailCover} src={detailBooking.machineCover} mode="aspectFill" />
              <View className={styles.detailBody}>
                <Text className={styles.detailTitle}>{detailBooking.machineTitle}</Text>
                <View
                  className={styles.statusBadge}
                  style={{
                    background: (statusMap[detailBooking.status] || statusMap.pending).bg,
                    color: (statusMap[detailBooking.status] || statusMap.pending).color,
                  }}
                >
                  <Text>{(statusMap[detailBooking.status] || statusMap.pending).text}</Text>
                </View>
              </View>
            </View>

            <View className={styles.detailSection}>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>📅 看机日期</Text>
                <Text className={styles.detailValue}>{detailBooking.viewDate}</Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>⏰ 可看时段</Text>
                <Text className={styles.detailValue}>{detailBooking.viewTimeSlot}</Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>📍 工地位置</Text>
                <Text className={styles.detailValue}>{detailBooking.city} {detailBooking.site}</Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>👷 联系人</Text>
                <Text className={styles.detailValue}>{detailBooking.buyerName} · {detailBooking.buyerPhone}</Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>🚜 卖家</Text>
                <Text className={styles.detailValue}>{detailBooking.sellerName} · {detailBooking.sellerPhone}</Text>
              </View>
            </View>

            <View className={styles.detailActions}>
              <View className={styles.detailGhostBtn} onClick={handleNavigate}>
                <Text>🗺️ 导航</Text>
              </View>
              {detailBooking.status === 'pending' && (
                <>
                  <View className={styles.detailGhostBtn} onClick={handleOpenReschedule}>
                    <Text>🔄 改期</Text>
                  </View>
                  <View className={styles.detailPrimaryBtn} onClick={() => handleChangeStatus('confirmed', '卖家已确认')}>
                    <Text>✅ 卖家确认</Text>
                  </View>
                  <View className={styles.detailDangerBtn} onClick={() => handleChangeStatus('failed', '预约已取消')}>
                    <Text>取消预约</Text>
                  </View>
                </>
              )}
              {detailBooking.status === 'confirmed' && (
                <>
                  <View className={styles.detailGhostBtn} onClick={handleOpenReschedule}>
                    <Text>🔄 改期</Text>
                  </View>
                  <View className={styles.detailPrimaryBtn} onClick={() => handleChangeStatus('done', '已完成看机')}>
                    <Text>🏁 标记已看</Text>
                  </View>
                  <View className={styles.detailDangerBtn} onClick={() => handleChangeStatus('failed', '预约已取消')}>
                    <Text>取消预约</Text>
                  </View>
                </>
              )}
              {(detailBooking.status === 'done' || detailBooking.status === 'failed') && (
                <View className={styles.detailGhostBtn} style={{ flex: 1 }} onClick={() => setDetailBooking(null)}>
                  <Text>关闭</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 改期弹层 */}
      {showReschedule && detailBooking && (
        <View className={styles.mask} onClick={() => setShowReschedule(false)}>
          <View className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <View className={styles.sheetHeader}>
              <Text className={styles.sheetTitle}>改期预约看机</Text>
              <Text className={styles.sheetClose} onClick={() => setShowReschedule(false)}>✕</Text>
            </View>

            <Text className={styles.sectionSubtitle}>选择新的可看日期</Text>
            <View className={styles.dateRow}>
              {dateOptions.map((d) => (
                <View
                  key={d.value}
                  className={classnames(styles.dateItem, rescheduleDate === d.value && styles.dateItemActive)}
                  onClick={() => setRescheduleDate(d.value)}
                >
                  <Text className={styles.dateWeekday}>{d.weekday}</Text>
                  <Text className={styles.dateDay}>{d.day}</Text>
                  <Text className={styles.dateLabel}>{d.label}</Text>
                </View>
              ))}
            </View>

            <Text className={styles.sectionSubtitle}>选择新的可看时段</Text>
            <View className={styles.slotRow}>
              {TIME_SLOTS.map((s) => (
                <View
                  key={s}
                  className={classnames(styles.slotItem, rescheduleSlot === s && styles.slotActive)}
                  onClick={() => setRescheduleSlot(s)}
                >
                  <Text className={styles.slotText}>{s}</Text>
                </View>
              ))}
            </View>

            <View className={styles.sheetActions}>
              <View className={styles.sheetCancel} onClick={() => setShowReschedule(false)}>取消</View>
              <View className={styles.sheetConfirm} onClick={handleConfirmReschedule}>确认改期</View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default BookingPage;
