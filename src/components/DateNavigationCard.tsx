import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Button } from 'react-native-paper';
import { formatDisplayDate, getTodayString } from '../utils/dateHelpers';

interface DateNavigationCardProps {
  selectedDate: string;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
}

export default function DateNavigationCard({
  selectedDate,
  onPreviousDay,
  onNextDay,
  onToday,
}: DateNavigationCardProps) {
  return (
    <Card style={styles.dateCard}>
      <Card.Content>
        <View style={styles.dateNavigation}>
          <Button mode="text" onPress={onPreviousDay} icon="chevron-left">
            Previous
          </Button>
          <View style={styles.dateContainer}>
            <Title style={styles.dateTitle}>{formatDisplayDate(selectedDate)}</Title>
            {selectedDate !== getTodayString() && (
              <Button mode="text" onPress={onToday} compact>
                Go to Today
              </Button>
            )}
          </View>
          <Button mode="text" onPress={onNextDay} icon="chevron-right">
            Next
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  dateCard: {
    marginBottom: 16,
    borderRadius: 0,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateContainer: {
    alignItems: 'center',
  },
  dateTitle: {
    textAlign: 'center',
  },
});