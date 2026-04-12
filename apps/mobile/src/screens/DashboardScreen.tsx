import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Text, Card, Button, ProgressBar as PaperProgressBar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGetStudentQuery } from '@/services/schoolErpApi';

interface DashboardScreenProps {
  navigation: any;
}

interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  attendancePercentage: number;
  recentGrades: Array<{
    subject: string;
    marks: number;
    total: number;
  }>;
}

const { width } = Dimensions.get('window');

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch student ID from storage
  useEffect(() => {
    const getStudentId = async () => {
      try {
        const id = await AsyncStorage.getItem('studentId');
        setStudentId(id);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching student ID:', error);
        setLoading(false);
      }
    };
    getStudentId();
  }, []);

  // Mock data for now (will integrate with API)
  useEffect(() => {
    if (studentId) {
      setStudentData({
        id: studentId,
        firstName: 'Rohan',
        lastName: 'Sharma',
        rollNumber: '101',
        attendancePercentage: 92,
        recentGrades: [
          { subject: 'Mathematics', marks: 85, total: 100 },
          { subject: 'English', marks: 78, total: 100 },
          { subject: 'Science', marks: 88, total: 100 },
          { subject: 'Social Studies', marks: 81, total: 100 },
          { subject: 'Hindi', marks: 80, total: 100 },
        ],
      });
    }
  }, [studentId]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('studentId');
      await AsyncStorage.removeItem('userId');
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!studentData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text>No student data found</Text>
          <Button onPress={handleLogout} mode="contained" style={styles.logoutBtn}>
            Logout
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.profileIcon}>
              <MaterialIcons name="person" size={40} color="white" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Welcome back!</Text>
              <Text style={styles.studentName}>
                {studentData.firstName} {studentData.lastName}
              </Text>
              <Text style={styles.rollNumber}>Roll No: {studentData.rollNumber}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Attendance Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <MaterialIcons name="check-circle" size={24} color="#4caf50" />
                <Text style={styles.cardTitle}>Attendance</Text>
              </View>
              <Text style={styles.attendancePercent}>
                {studentData.attendancePercentage}%
              </Text>
            </View>
            <PaperProgressBar
              progress={studentData.attendancePercentage / 100}
              color="#4caf50"
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {studentData.attendancePercentage >= 75
                ? '✓ Good attendance'
                : '⚠ Below 75% threshold'}
            </Text>
          </Card.Content>
        </Card>

        {/* Recent Grades Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <MaterialIcons name="grade" size={24} color="#2196f3" />
                <Text style={styles.cardTitle}>Recent Grades</Text>
              </View>
            </View>
            <View style={styles.gradesContainer}>
              {studentData.recentGrades.map((grade, index) => (
                <View key={index} style={styles.gradeRow}>
                  <Text style={styles.gradeName}>{grade.subject}</Text>
                  <View style={styles.gradeValue}>
                    <Text style={styles.gradeMarks}>
                      {grade.marks}/{grade.total}
                    </Text>
                    <View
                      style={[
                        styles.gradeBadge,
                        {
                          backgroundColor:
                            grade.marks >= 80
                              ? '#4caf50'
                              : grade.marks >= 70
                              ? '#ff9800'
                              : '#f44336',
                        },
                      ]}
                    >
                      <Text style={styles.gradePercent}>
                        {Math.round((grade.marks / grade.total) * 100)}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Attendance')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#e3f2fd' }]}>
                <MaterialIcons name="calendar-today" size={28} color="#2196f3" />
              </View>
              <Text style={styles.actionLabel}>Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Grades')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#f3e5f5' }]}>
                <MaterialIcons name="assessment" size={28} color="#9c27b0" />
              </View>
              <Text style={styles.actionLabel}>Grades</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#fff3e0' }]}>
                <MaterialIcons name="person" size={28} color="#ff9800" />
              </View>
              <Text style={styles.actionLabel}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  studentName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  rollNumber: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    marginHorizontal: 12,
    marginVertical: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  attendancePercent: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  gradesContainer: {
    gap: 12,
  },
  gradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  gradeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  gradeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradeMarks: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradePercent: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionIcon: {
    width: (width - 60) / 3,
    height: (width - 60) / 3,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    marginTop: 16,
  },
});

export default DashboardScreen;
