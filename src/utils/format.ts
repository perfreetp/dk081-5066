import dayjs from 'dayjs';

// 格式化价格（万元）
export const formatPrice = (wan: number): string => {
  return `${wan.toFixed(wan % 1 === 0 ? 0 : 1)}万`;
};

// 格式化工时
export const formatHours = (hours: number): string => {
  return `${hours.toLocaleString()}小时`;
};

// 相对时间
export const formatRelativeTime = (time: string): string => {
  const now = dayjs();
  const t = dayjs(time);
  const diffMin = now.diff(t, 'minute');
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = now.diff(t, 'hour');
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = now.diff(t, 'day');
  if (diffDay < 30) return `${diffDay}天前`;
  return t.format('MM-DD');
};

// 格式化日期
export const formatDate = (time: string, fmt = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(time).format(fmt);
};

// 工时判断车况
export const hoursToCondition = (hours: number): { level: 'excellent' | 'good' | 'fair'; label: string } => {
  if (hours < 3000) return { level: 'excellent', label: '车况优秀' };
  if (hours < 6000) return { level: 'good', label: '车况良好' };
  return { level: 'fair', label: '车况一般' };
};

// 距离格式化
export const formatDistance = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)}米`;
  return `${km.toFixed(1)}km`;
};
