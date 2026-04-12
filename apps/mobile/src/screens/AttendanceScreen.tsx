import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Text, Card, SegmentedButtons } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';

interface AttendanceScreenProps {
  navigation: any;
}

interface AttendanceData {
  date: string;
  status: 'present' | 'absent' | 'leave';
  subjects?: string[];
}

const { width } = Dimensions.get('window');

const AttendanceScreen: React.FC<AttendanceScreenProps> = ({ navigation }) => {
  const [attendanceData] = useState<AttendanceData[]>([
    { date: '2026-04-14', status: 'present', subjects: ['Math', 'English'] },
    { date: '2026-04-13', status: 'present', subjects: ['Science', 'History'] },
    { date: '2026-04-12', status: 'absent' },
    { date: '2026-04-11', status: 'present', subjects: ['Math', 'Science'] },
    { date: '2026-04-10', status: 'leave' },
    { date: '2026-04-09', status: 'present', subjects: ['English', 'Social'] },
  ]);

  const [viewType, setViewType] = useState<string>('calendar');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Calculate attendance stats
  const presentDays = attendanceData.filter((d) => d.status === 'present').length;
  const absentDays = attendanceData.filter((d) => d.status === 'absent').length;
  const leaveDays = attendanceData.filter((d) => d.status === 'leave').length;
  const totalDays = attendanceData.length;
  const attendancePercentage = Math.round((presentDays / (totalDays - leaveDays)) * 100);

  const chartData = {
    labels: ['Present', 'Absent', 'Leave'],
    datasets: [
      {
        data: [presentDays, absentDays, leaveDays],
      },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#4caf50';
      case 'absent':
        return '#f44336';
      case 'leave':
        return '#ff9800';
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return 'check-circle';
      case 'absent':
        return 'cancel';
      case 'leave':
        return 'event-busy';
      default:
        return 'help';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Attendance</Text>
          <Text style={styles.attendancePercent}>{attendancePercentage}%</Text>
        </View>

        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{presentDays}</Text>
                <Text style={styles.statLabel}>Present</Text>
                <View style={[styles.statBar, { backgroundColor: '#4caf50' }]} />
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{absentDays}</Text>
                <Text style={styles.statLabel}>Absent</Text>
                <View style={[styles.statBar, { backgroundColor: '#f44336' }]} />
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{leaveDays}</Text>
                <Text style={styles.statLabel}>Leave</Text>
                <View style={[styles.statBar, { backgroundColor: '#ff9800' }]} />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* View Toggle */}
        <View style={styles.toggleContainer}>
          <SegmentedButtons
            value={viewType}
            onValueChange={setViewType}
            buttons={[
              { value: 'calendar', label: 'Calendar' },
              { value: 'chart', label: 'Chart' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Calendar View */}
        {viewType === 'calendar' && (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Last 30 Days</Text>
            {attendanceData.map((item, index) => (
              <Card key={index} style={styles.dateCard}>
                <Card.Content>
                  <View style={styles.dateRow}>
                    <View style={styles.dateInfo}>
                      <MaterialIcons
                        name={getStatusIcon(item.status)}
                        size={24}
                        color={getStatusColor(item.status)}
                      />
                      <View style={styles.dateDetails}>
                        <Text style={styles.dateText}>{item.date}</Text>
                        {item.subjects && (
                          <Text style={styles.subjectsText}>
                            {item.subjects.join(', ')}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.statusBadge,
                        { color: getStatusColor(item.status) },
                      ]}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Chart View */}
        {viewType === 'chart' && (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Attendance Summary</Text>
            <Card style={styles.chartCard}>
              <Card.Content>
                <BarChart
                  data={chartData}
                  width={width - 40}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#fff',
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    barPercentage: 0.5,
                  }}
                  style={styles.chart}
                />
              </Card.Content>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  attendancePercent: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  statsCard: {
    marginHorizontal: 12,
    marginVertical: 12,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statBar: {
    width: '60%',
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  toggleContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  segmentedButtons: {
    marginBottom: 0,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  dateCard: {
    marginBottom: 8,
    elevation: 1,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateDetails: {
    marginLeft: 12,
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  subjectsText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  chartCard: {
    marginBottom: 20,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default AttendanceScreen;
