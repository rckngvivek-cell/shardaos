# MOBILE APP SPECIFICATION - iOS & Android
## Cross-Platform Native & React Native Implementation

**Version:** 1.0.0  
**Date:** April 9, 2026  
**Status:** Production-Ready  

---

# PART 1: APP OVERVIEW

## Platform Support

```
Primary: iOS 15+ (Apple)
├─ Native: Swift + SwiftUI
└─ Minimum Users: Teachers, Parents, Admins

Platform: Android 11+ (Google)
├─ Native: Kotlin + Jetpack Compose
└─ Minimum Users: Teachers, Parents, Admins

Alternative: React Native (Single codebase)
├─ Framework: React Native + Expo
├─ Estimated time to market: 40% faster
└─ Trade-off: ~10% performance penalty
```

## Core Features

```
For Teachers:
├─ Mark attendance (offline)
├─ View class timetable
├─ Enter marks & grades
├─ Send messages to parents
├─ View student reports
└─ Access announcements

For Parents:
├─ View child attendance
├─ Check marks & grades
├─ Receive notifications
├─ View school announcements
├─ Pay fees online
└─ Communication with teachers

For Admin/Principal:
├─ School dashboard
├─ Real-time analytics
├─ Manage users
├─ Configure settings
├─ Generate reports
└─ Full data access

For Students:
├─ View timetable
├─ Check marks
├─ View assignments
├─ Communicate with teachers
└─ Download study materials
```

---

# PART 2: TECHNICAL ARCHITECTURE

## React Native Setup (Recommended)

```bash
# Initialize project
npx create-expo-app SchoolERPApp
cd SchoolERPApp

# Install essential libraries
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install @react-native-firebase/firestore @react-native-firebase/auth
npm install @react-native-async-storage/async-storage
npm install @react-native-netinfo/netinfo
npm install zustand react-query
npm install react-native-gesture-handler react-native-reanimated
npm install react-native-screens

# Async Storage (local cache)
npm install @react-native-async-storage/async-storage

# Offline sync
npm install @react-native-community/netinfo

# UI Components
npm install react-native-paper react-native-vector-icons
```

## Folder Structure

```
SchoolERPApp/
├── app/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegistrationScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   │
│   │   ├── teacher/
│   │   │   ├── AttendanceScreen.tsx
│   │   │   ├── MarksEntryScreen.tsx
│   │   │   ├── ClassTimetableScreen.tsx
│   │   │   ├── StudentListScreen.tsx
│   │   │   └── MessagesScreen.tsx
│   │   │
│   │   ├── parent/
│   │   │   ├── MyChildScreen.tsx
│   │   │   ├── AttendanceViewScreen.tsx
│   │   │   ├── MarksViewScreen.tsx
│   │   │   ├── NotificationsScreen.tsx
│   │   │   └── FeesScreen.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── DashboardScreen.tsx
│   │   │   └── AnalyticsScreen.tsx
│   │   │
│   │   └── common/
│   │       ├── ProfileScreen.tsx
│   │       └── SettingsScreen.tsx
│   │
│   ├── components/
│   │   ├── AttendanceCard.tsx
│   │   ├── MarksCard.tsx
│   │   ├── StudentListItem.tsx
│   │   └── OfflineIndicator.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useOfflineSync.ts
│   │   ├── useAttendance.ts
│   │   └── useNetworkStatus.ts
│   │
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── attendanceStore.ts
│   │   ├── offlineStore.ts
│   │   └── uiStore.ts
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── storage.ts (AsyncStorage)
│   │   ├── sync.ts (offline sync)
│   │   └── notifications.ts
│   │
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── validators.ts
│   │   └── formatters.ts
│   │
│   ├── App.tsx (main navigation)
│   └── Navigation.tsx
│
├── app.json
├── package.json
└── eas.json (build config)
```

---

# PART 3: OFFLINE-FIRST ARCHITECTURE

## Local Storage Strategy

```typescript
// src/services/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import SQLite from 'react-native-sql.js';

class LocalStorageService {
  // Cache frequently accessed data
  async cacheData(key: string, data: any, ttl: number = 3600): Promise<void> {
    const item = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    await AsyncStorage.setItem(key, JSON.stringify(item));
  }

  async getCachedData(key: string): Promise<any> {
    const item = await AsyncStorage.getItem(key);
    if (!item) return null;

    const parsed = JSON.parse(item);
    const isExpired = Date.now() - parsed.timestamp > parsed.ttl * 1000;

    if (isExpired) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  }

  // Store attendance for offline
  async storeAttendanceRecord(attendanceData: any): Promise<void> {
    const pending = await AsyncStorage.getItem('pending_attendance') || '[]';
    const records = JSON.parse(pending);
    records.push({
      ...attendanceData,
      syncStatus: 'pending',
      timestamp: Date.now(),
    });
    await AsyncStorage.setItem('pending_attendance', JSON.stringify(records));
  }
}

export default new LocalStorageService();
```

## Offline Sync Queue

```typescript
// src/services/sync.ts
import NetInfo from '@react-native-netinfo/netinfo';

class SyncService {
  private syncQueue: SyncTask[] = [];

  async initSync(): Promise<void> {
    // Listen for network changes
    NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        this.processSyncQueue();
      }
    });
  }

  async addToSyncQueue(task: SyncTask): Promise<void> {
    this.syncQueue.push(task);
    await AsyncStorage.setItem(
      'sync_queue',
      JSON.stringify(this.syncQueue)
    );
  }

  async processSyncQueue(): Promise<void> {
    const isConnected = await NetInfo.fetch().then((state) => state.isConnected);
    
    if (!isConnected) return;

    console.log('🔄 Syncing offline changes...');

    for (const task of this.syncQueue) {
      try {
        await this.executeSyncTask(task);
        this.syncQueue = this.syncQueue.filter((t) => t.id !== task.id);
      } catch (error) {
        console.error('Sync failed:', error);
        // Retry later
      }
    }

    await AsyncStorage.setItem(
      'sync_queue',
      JSON.stringify(this.syncQueue)
    );
  }

  private async executeSyncTask(task: SyncTask): Promise<void> {
    switch (task.action) {
      case 'mark_attendance':
        await api.post('/attendance', task.data);
        break;
      case 'submit_marks':
        await api.post('/grades', task.data);
        break;
      default:
        throw new Error(`Unknown sync action: ${task.action}`);
    }
  }
}

export default new SyncService();
```

---

# PART 4: ATTENDANCE MARKING (Offline)

## Teacher Attendance Screen

```typescript
// screens/teacher/AttendanceScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator 
} from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import NetInfo from '@react-native-netinfo/netinfo';
import { useAttendanceStore } from '@/store/attendanceStore';
import attendanceService from '@/services/attendance.service';
import storageService from '@/services/storage';
import syncService from '@/services/sync';

export const AttendanceScreen: React.FC = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStudents();
    
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected || false);
    });

    return () => unsubscribe();
  }, []);

  const loadStudents = async (): Promise<void> => {
    setLoading(true);
    try {
      const classStudents = await attendanceService.getClassStudents();
      setStudents(classStudents);
      
      // Try to get today's attendance from Firebase
      try {
        const todayAttendance = await attendanceService.getTodayAttendance();
        setAttendance(todayAttendance);
      } catch (error) {
        // If offline, use cached data
        console.log('Using cached attendance');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId: string): void => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }));
  };

  const submitAttendance = async (): Promise<void> => {
    try {
      setLoading(true);

      const attendanceData = students.map((student) => ({
        studentId: student.id,
        status: attendance[student.id] || 'absent',
        date: new Date(),
        classId: student.classId,
      }));

      if (isOnline) {
        // Submit directly
        await attendanceService.submitAttendance(attendanceData);
        alert('✅ Attendance submitted successfully!');
      } else {
        // Queue for later
        await syncService.addToSyncQueue({
          id: Math.random().toString(),
          action: 'mark_attendance',
          data: attendanceData,
        });
        alert('📱 Offline: Will sync when connected');
      }

      // Log offline
      await storageService.storeAttendanceRecord(attendanceData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📡 Offline Mode</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <FlatList
            data={students}
            renderItem={({ item }) => (
              <Card style={styles.studentCard}>
                <TouchableOpacity
                  onPress={() => toggleAttendance(item.id)}
                  style={styles.studentRow}
                >
                  <Text style={styles.studentName}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          attendance[item.id] === 'present' ? '#4CAF50' : '#F44336',
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {attendance[item.id] === 'present' ? '✓ P' : '✗ A'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Card>
            )}
            keyExtractor={(item) => item.id}
          />

          <Button
            mode="contained"
            onPress={submitAttendance}
            disabled={loading}
            style={styles.submitButton}
          >
            {isOnline ? 'Submit Attendance' : 'Save for Sync'}
          </Button>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  offlineBanner: {
    backgroundColor: '#FF9800',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  offlineText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  studentCard: {
    marginBottom: 12,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

export default AttendanceScreen;
```

---

# PART 5: PARENT APP - ATTENDANCE & MARKS VIEW

```typescript
// screens/parent/AttendanceViewScreen.tsx
export const AttendanceViewScreen: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceData>();
  const [period, setPeriod] = useState('term1');

  useEffect(() => {
    fetchAttendance();
  }, [period]);

  const fetchAttendance = async (): Promise<void> => {
    const data = await api.get(`/students/my-child/attendance?period=${period}`);
    setAttendance(data);
  };

  return (
    <View style={styles.container}>
      <Card>
        <Card.Content>
          <Text variant="headlineSmall">Attendance Summary</Text>
          <View style={styles.statsRow}>
            <Text>📅 Present: {attendance?.present}</Text>
            <Text>❌ Absent: {attendance?.absent}</Text>
            <Text>🎫 Leave: {attendance?.leave}</Text>
          </View>
          <ProgressBar 
            progress={attendance?.percentage! / 100} 
            color="#4CAF50" 
          />
          <Text variant="bodySmall">
            {attendance?.percentage?.toFixed(1)}% Attendance
          </Text>
        </Card.Content>
      </Card>

      <FlatList
        data={attendance?.records}
        renderItem={({ item }) => (
          <Card style={styles.recordCard}>
            <Text>{new Date(item.date).toLocaleDateString()}</Text>
            <Text 
              style={{ 
                color: item.status === 'present' ? '#4CAF50' : '#F44336' 
              }}
            >
              {item.status.toUpperCase()}
            </Text>
          </Card>
        )}
        keyExtractor={(item, i) => i.toString()}
      />
    </View>
  );
};
```

---

# PART 6: NOTIFICATION & PUSH MESSAGING

```typescript
// Firebase Cloud Messaging setup
import messaging from '@react-native-firebase/messaging';

async function requestUserPermission(): Promise<string | null> {
  const granted = await messaging().requestPermission();
  if (granted) {
    const token = await messaging().getToken();
    return token;
  }
  return null;
}

// Listen for messages
messaging().onMessage(async (remoteMessage) => {
  console.log('Notification received', remoteMessage);
  
  // Show local notification
  notify({
    title: remoteMessage.notification?.title || 'School ERP',
    body: remoteMessage.notification?.body || 'New notification',
  });
});

// Handle background messages
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Message received in background', remoteMessage);
});
```

---

# PART 7: SECURITY & AUTHENTICATION

```typescript
// Biometric auth (fingerprint/face)
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

async function loginWithBiometric(): Promise<void> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) {
    throw new Error('Device does not support biometric authentication');
  }

  const result = await LocalAuthentication.authenticateAsync({
    disableDeviceFallback: false,
    reason: 'Authenticate to access School ERP',
  });

  if (result.success) {
    // Retrieve stored credentials
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      setAuthToken(token);
    }
  }
}

// PIN backup
async function setupPINLogin(pin: string): Promise<void> {
  const hashedPin = hashPin(pin);
  await SecureStore.setItemAsync('pin_hash', hashedPin);
}
```

---

# PART 8: BUILD & DEPLOYMENT

## iOS Build (Xcode)

```bash
# Build for iOS
eas build --platform ios

# Upload to TestFlight
eas submit --platform ios --latest

# Release to App Store
eas submit --platform ios --latest
```

## Android Build (Google Play)

```bash

# Build for Android
eas build --platform android

# Upload to Play Store Internal Testing
eas submit --platform android --latest

# Release to Play Store
eas submit --platform android --latest
```

## Firebase Crashlytics

```
Monitor app crashes and errors in Firebase Console
├─ Real-time alerts for crashes
├─ Stack traces and device info
├─ Custom events tracking
└─ Performance monitoring
```

---

**Mobile apps ensure teachers can mark attendance offline and parents stay updated in real-time.**
