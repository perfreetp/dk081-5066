import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

type TagColor = 'orange' | 'blue' | 'green' | 'gray' | 'red';

interface TagProps {
  text: string;
  color?: TagColor;
  size?: 'sm' | 'md';
}

const colorMap: Record<TagColor, string> = {
  orange: styles.orange,
  blue: styles.blue,
  green: styles.green,
  gray: styles.gray,
  red: styles.red,
};

const Tag: React.FC<TagProps> = ({ text, color = 'gray', size = 'sm' }) => {
  return (
    <View className={classnames(styles.tag, colorMap[color], size === 'md' && styles.md)}>
      <Text className={styles.text}>{text}</Text>
    </View>
  );
};

export default Tag;
