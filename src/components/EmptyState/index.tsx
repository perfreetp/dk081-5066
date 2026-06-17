import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  text: string;
  hint?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ text, hint }) => {
  return (
    <View className={styles.wrap}>
      <View className={styles.icon}>
        <Text className={styles.emoji}>🚧</Text>
      </View>
      <Text className={styles.text}>{text}</Text>
      {hint && <Text className={styles.hint}>{hint}</Text>}
    </View>
  );
};

export default EmptyState;
