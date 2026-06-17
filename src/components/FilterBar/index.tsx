import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

export interface FilterState {
  category: string;
  sameCity: boolean;
  canViewToday: boolean;
  includeTransport: boolean;
}

interface FilterBarProps {
  categories: { label: string; value: string }[];
  filter: FilterState;
  onChange: (filter: FilterState) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ categories, filter, onChange }) => {
  const toggle = (key: keyof Omit<FilterState, 'category'>) => {
    onChange({ ...filter, [key]: !filter[key] });
  };

  const toggles: { key: keyof Omit<FilterState, 'category'>; label: string }[] = [
    { key: 'sameCity', label: '同城' },
    { key: 'canViewToday', label: '当天看机' },
    { key: 'includeTransport', label: '包板车' },
  ];

  return (
    <View className={styles.wrap}>
      <ScrollView scrollX className={styles.scrollView} enhanced showScrollbar={false}>
        <View className={styles.scrollInner}>
          {categories.map((c) => {
            const active = filter.category === c.value;
            return (
              <View
                key={c.value}
                className={classnames(styles.catItem, active && styles.catActive)}
                onClick={() => onChange({ ...filter, category: c.value })}
              >
                <Text className={styles.catText}>{c.label}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View className={styles.toggleRow}>
        {toggles.map((t) => {
          const active = filter[t.key];
          return (
            <View
              key={t.key}
              className={classnames(styles.toggle, active && styles.toggleActive)}
              onClick={() => toggle(t.key)}
            >
              <Text className={styles.toggleText}>{active ? '✓ ' : ''}{t.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default FilterBar;
