# 44_REALTIME_WEBSOCKET_ARCHITECTURE.md
# Real-Time Architecture: WebSocket & Message Broadcasting

**Status:** Technical Design | **For:** Week 3 Implementation | **Audience:** Backend + DevOps teams

---

## 📋 OVERVIEW

The real-time layer enables live notifications, instant updates, and multi-user collaboration across the School ERP system. Built with Socket.io, Google Pub/Sub, and Redis caching.

**Real-Time Capabilities:**
- **Notifications:** Instant push to users
- **Attendance Sync:** Live updates across devices
- **Grade Publishing:** Immediate announcements
- **Parent-Staff Chat:** Real-time messaging (Phase 2)
- **System Health:** Live status updates
- **Scalability:** Multi-server with Pub/Sub

---

## 🏗️ ARCHITECTURE DIAGRAM

```
┌──────────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                                │
│  React Web (WebSocket)  │  React Native (WebSocket)              │
│  Parents + Staff        │  Mobile parents                         │
└────────────┬─────────────────────────┬──────────────────────────┘
             │                         │
        ws://api.school-erp.com        │
             │                         │
┌────────────▼─────────────────────────▼──────────────────────────┐
│           SOCKET.IO SERVER (Node.js on Cloud Run)               │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Connection Manager                                      │   │
│  │  ├─ Authenticate clients                                 │   │
│  │  ├─ Manage socket instances                              │   │
│  │  ├─ Handle disconnections                                │   │
│  │  └─ Track active connections: connections[userId]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Room Management                                         │   │
│  │  ├─ user:{userId}         (user-specific messages)      │   │
│  │  ├─ role:{role}           (broadcast to all staff)      │   │
│  │  ├─ class:{classId}       (class-specific updates)      │   │
│  │  ├─ school:{schoolId}     (school-wide broadcasts)      │   │
│  │  └─ notifications:all     (system notifications)        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Event Handlers                                          │   │
│  │  ├─ notification:send                                    │   │
│  │  ├─ attendance:marked                                    │   │
│  │  ├─ grades:published                                     │   │
│  │  ├─ message:send                                         │   │
│  │  └─ health:check                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Message Processing                                      │   │
│  │  ├─ Validation                                           │   │
│  │  ├─ Rate limiting                                        │   │
│  │  └─ Deduplication                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────┬─────────────────────────┬──────────────────────────────┘
         │                         │
         │                  ┌──────▼────────┐
         │                  │  Redis Cache  │
         │                  │  ├─ Sessions │
         │                  │  └─ Messages │
         │                  └───────────────┘
         │
    ┌────▼────────────────────────────────────────┐
    │      Google Pub/Sub (Message Broker)       │
    │                                             │
    │  Topic: school-erp-events                 │
    │  Subscribers:                              │
    │  ├─ WebSocket servers (multi-region)      │
    │  ├─ Analytics pipeline                     │
    │  └─ Logging service                        │
    └─────────────────────────────────────────────┘
         │
    ┌────▼────────────────────────────────────────┐
    │         Firestore (Database)               │
    │  ├─ Persistent message storage              │
    │  ├─ Audit logs                              │
    │  └─ Notification history                    │
    └─────────────────────────────────────────────┘
```

---

## 🚀 SOCKET.IO SERVER SETUP

### Installation & Configuration

```bash
# Install dependencies
npm install socket.io express-session connect-redis redis
npm install --save-dev @types/socket.io

# Environment variables
SOCKET_PORT=3100
SOCKET_NAMESPACE=/api/v1/socket
REDIS_URL=redis://redis.c.school-erp-prod.internal:6379
PUBSUB_PROJECT_ID=school-erp-prod
PUBSUB_TOPIC=school-erp-events
```

### Main Server File

```typescript
// src/socket-server/socketServer.ts

import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import redis from 'redis';
import { PubSub } from '@google-cloud/pubsub';
import { verifyJWT } from '../middleware/auth';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
  maxHttpBufferSize: 1e6, // 1MB
});

// Redis setup for session persistence
const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

// Google Pub/Sub setup
const pubsub = new PubSub({
  projectId: process.env.PUBSUB_PROJECT_ID,
});

const topic = pubsub.topic(process.env.PUBSUB_TOPIC);

// ============ AUTHENTICATION ============

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication failed: No token provided'));
    }

    const decoded = verifyJWT(token);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    socket.schoolId = decoded.schoolId;

    // Store session in Redis
    await redisClient.set(
      `socket:${socket.id}`,
      JSON.stringify({
        userId: socket.userId,
        userRole: socket.userRole,
        schoolId: socket.schoolId,
        connectedAt: new Date(),
      }),
      { EX: 86400 } // 24 hour expiry
    );

    next();
  } catch (error) {
    console.error('Auth error:', error);
    next(new Error('Authentication failed'));
  }
});

// ============ CONNECTION EVENTS ============

io.on('connection', async (socket) => {
  console.log(`User ${socket.userId} connected (socket: ${socket.id})`);

  // Analytics: log connection
  publishEvent('socket.connected', {
    userId: socket.userId,
    role: socket.userRole,
    timestamp: new Date(),
  });

  // Join user-specific room
  socket.join(`user:${socket.userId}`);
  console.log(`Socket ${socket.id} joined room: user:${socket.userId}`);

  // Join role-specific room
  socket.join(`role:${socket.userRole}`);

  // Join school-specific room
  socket.join(`school:${socket.schoolId}`);

  // Mark user as online
  await redisClient.sadd(`online:${socket.schoolId}`, socket.userId);

  // ============ INCOMING EVENTS ============

  // Health check
  socket.on('ping', (callback) => {
    callback({
      pong: true,
      serverTime: new Date().toISOString(),
    });
  });

  // Send notification
  socket.on('notification:send', async (data, callback) => {
    try {
      await handleNotificationSend(socket, data);
      callback?.({ success: true });
    } catch (error) {
      callback?.({ success: false, error: error.message });
    }
  });

  // Mark attendance
  socket.on('attendance:marked', async (data) => {
    await handleAttendanceMarked(socket, data);
  });

  // Publish grades
  socket.on('grades:published', async (data) => {
    await handleGradesPublished(socket, data);
  });

  // Send message (for chat feature - Phase 2)
  socket.on('message:send', async (data, callback) => {
    try {
      await handleMessageSend(socket, data);
      callback?.({ success: true });
    } catch (error) {
      callback?.({ success: false, error: error.message });
    }
  });

  // ============ DISCONNECTION EVENTS ============

  socket.on('disconnect', async () => {
    console.log(`User ${socket.userId} disconnected (socket: ${socket.id})`);

    // Remove from session cache
    await redisClient.del(`socket:${socket.id}`);

    // Remove from online set
    await redisClient.srem(`online:${socket.schoolId}`, socket.userId);

    // Analytics
    publishEvent('socket.disconnected', {
      userId: socket.userId,
      socketId: socket.id,
      timestamp: new Date(),
    });
  });

  socket.on('error', (error) => {
    console.error(`Socket error for user ${socket.userId}:`, error);
  });
});

// ============ HELPER FUNCTIONS ============

async function handleNotificationSend(socket: any, data: any) {
  const { recipientId, type, title, message } = data;

  // Validate sender has permission
  if (!canSendNotification(socket.userRole)) {
    throw new Error('Insufficient permissions');
  }

  // Validate recipient exists
  const recipientExists = await validateUserId(recipientId);
  if (!recipientExists) {
    throw new Error('Recipient not found');
  }

  // Send notification
  io.to(`user:${recipientId}`).emit('notification', {
    id: generateId(),
    type,
    title,
    message,
    timestamp: new Date(),
  });

  // Store in database
  await storeNotification({
    recipientId,
    type,
    title,
    message,
    sentBy: socket.userId,
    timestamp: new Date(),
  });

  // Publish to Pub/Sub for analytics
  publishEvent('notification.sent', {
    recipientId,
    type,
    sentBy: socket.userId,
  });
}

async function handleAttendanceMarked(socket: any, data: any) {
  const { classId, date, records } = data;

  // Validate teacher owns class
  if (!await teacherOwnsClass(socket.userId, classId)) {
    console.error(`Unauthorized: User ${socket.userId} tried to mark attendance`);
    return;
  }

  // Get all parents in class
  const parents = await getParentsInClass(classId);

  // Send real-time update to each parent
  parents.forEach((parent) => {
    io.to(`user:${parent.id}`).emit('attendance:updated', {
      classId,
      date,
      message: `Attendance marked for ${records.length} students`,
      timestamp: new Date(),
    });
  });

  // Broadcast to staff
  io.to(`role:TEACHER`).emit('attendance:marked', {
    classId,
    markedBy: socket.userId,
    count: records.length,
    timestamp: new Date(),
  });

  // Publish to Pub/Sub
  publishEvent('attendance.marked', {
    classId,
    markedBy: socket.userId,
    count: records.length,
  });
}

async function handleGradesPublished(socket: any, data: any) {
  const { classId, examId, subject } = data;

  // Validate teacher owns class
  if (!await teacherOwnsClass(socket.userId, classId)) {
    throw new Error('Unauthorized');
  }

  // Get all students in class
  const students = await getStudentsInClass(classId);
  const parents = await getParentsOfStudents(students);

  // Send notification to each parent
  parents.forEach((parent) => {
    io.to(`user:${parent.id}`).emit('notification', {
      type: 'GRADES_PUBLISHED',
      title: `${subject} grades published`,
      message: `${subject} grades for exam have been published. Check your child's progress.`,
      timestamp: new Date(),
      actionUrl: `/grades/${examId}`,
    });
  });

  // Broadcast to staff
  io.to(`role:TEACHER`).emit('grades:published', {
    classId,
    subject,
    publishedBy: socket.userId,
    timestamp: new Date(),
  });

  // Publish to Pub/Sub
  publishEvent('grades.published', {
    classId,
    examId,
    subject,
    publishedBy: socket.userId,
  });
}

async function handleMessageSend(socket: any, data: any) {
  const { recipientId, message } = data;

  // Validate permissions
  if (!await canSendMessage(socket.userId, recipientId)) {
    throw new Error('Cannot send message to this user');
  }

  // Send real-time message
  io.to(`user:${recipientId}`).emit('message:received', {
    id: generateId(),
    from: socket.userId,
    message,
    timestamp: new Date(),
  });

  // Store message in database
  await storeMessage({
    from: socket.userId,
    to: recipientId,
    message,
    timestamp: new Date(),
    read: false,
  });
}

async function publishEvent(eventType: string, data: any) {
  try {
    const message = Buffer.from(
      JSON.stringify({
        eventType,
        data,
        timestamp: new Date(),
      })
    );

    await topic.publish(message);
  } catch (error) {
    console.error('Failed to publish event:', error);
  }
}

// ============ SERVER START ============

const PORT = process.env.SOCKET_PORT || 3100;
server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
  console.log(`Socket namespace: ${process.env.SOCKET_NAMESPACE}`);
});

export { io, server };
```

---

## 💻 FRONTEND INTEGRATION

### SocketProvider Context

```typescript
// src/context/SocketContext.tsx

import React, { createContext, useMemo, useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [isConnected, setIsConnected] = React.useState(false);

  const socket = useMemo(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    return io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3100', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      console.log('✓ Connected to WebSocket');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('✗ Disconnected from WebSocket');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
```

### useSocket Hook

```typescript
// src/hooks/useSocket.ts

import { useContext, useEffect, useCallback } from 'react';
import { SocketContext } from '../context/SocketContext';

export function useSocket() {
  const { socket } = useContext(SocketContext);

  if (!socket) {
    throw new Error('useSocket must be used inside SocketProvider');
  }

  return socket;
}

// Usage in components
export function useNotifications() {
  const socket = useSocket();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (data: Notification) => {
      setNotifications(prev => [data, ...prev]);

      // Show toast notification
      showToast({
        title: data.title,
        message: data.message,
        type: 'info',
      });
    });

    return () => {
      socket.off('notification');
    };
  }, [socket]);

  return { notifications };
}

// Usage in attendance component
export function useAttendanceUpdates(classId: string) {
  const socket = useSocket();

  const handleAttendanceMarked = useCallback((data: any) => {
    if (data.classId === classId) {
      // Refresh attendance data
      refreshAttendanceData();
      showToast(`Attendance marked: ${data.count} students`);
    }
  }, [classId]);

  useEffect(() => {
    socket.on('attendance:updated', handleAttendanceMarked);
    return () => socket.off('attendance:updated', handleAttendanceMarked);
  }, [socket, handleAttendanceMarked]);
}
```

### Component Integration Example

```typescript
// StaffDashboard.tsx with real-time updates

export function StaffDashboard() {
  const { socket, isConnected } = useContext(SocketContext);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const { data: initialData } = useGetStaffDashboardQuery();

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Attendance marked
    socket.on('attendance:marked', (data) => {
      setDashboard(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          attendanceMarkedToday: true,
        }
      }));
      showToast(`Attendance marked: ${data.count} students`);
    });

    // Grades published
    socket.on('grades:published', (data) => {
      setDashboard(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          gradesPendingPublication: prev.stats.gradesPendingPublication - 1,
        }
      }));
      showToast(`${data.subject} grades published`);
    });

    return () => {
      socket.off('attendance:marked');
      socket.off('grades:published');
    };
  }, [socket]);

  return (
    <Box>
      {!isConnected && (
        <Alert severity="warning">
          📡 Connecting to real-time updates...
        </Alert>
      )}
      {/* Dashboard content */}
    </Box>
  );
}
```

---

## 📊 REDIS CACHING STRATEGY

### Configuration

```typescript
// src/services/redisService.ts

import redis from 'redis';

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
  },
});

// ============ SESSION CACHING ============

export async function cacheSession(sessionId: string, sessionData: any) {
  await redisClient.set(
    `session:${sessionId}`,
    JSON.stringify(sessionData),
    { EX: 86400 * 7 } // 7 days
  );
}

export async function getSession(sessionId: string) {
  const data = await redisClient.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

// ============ USER PRESENCE ============

export async function markUserOnline(userId: string, schoolId: string) {
  await redisClient.sadd(`online:${schoolId}`, userId);
  await redisClient.set(
    `user:${userId}:last-seen`,
    new Date().toISOString(),
    { EX: 3600 }
  );
}

export async function markUserOffline(userId: string, schoolId: string) {
  await redisClient.srem(`online:${schoolId}`, userId);
}

export async function getOnlineUsers(schoolId: string) {
  return await redisClient.smembers(`online:${schoolId}`);
}

// ============ MESSAGE CACHING ============

export async function cacheMessage(messageId: string, messageData: any) {
  await redisClient.set(
    `message:${messageId}`,
    JSON.stringify(messageData),
    { EX: 3600 } // 1 hour
  );
}

export async function getMessage(messageId: string) {
  const data = await redisClient.get(`message:${messageId}`);
  return data ? JSON.parse(data) : null;
}

// ============ RATE LIMITING ============

export async function checkRateLimit(userId: string, action: string, limit: number = 10, window: number = 60) {
  const key = `rate:${userId}:${action}`;
  const count = await redisClient.incr(key);

  if (count === 1) {
    await redisClient.expire(key, window);
  }

  return count <= limit;
}

// ============ DEDUPLICATION ============

export async function checkMessageDedup(messageId: string): Promise<boolean> {
  const exists = await redisClient.exists(`dedup:${messageId}`);
  if (!exists) {
    await redisClient.set(`dedup:${messageId}`, '1', { EX: 60 });
    return true; // Message is new
  }
  return false; // Duplicate
}
```

---

## 📈 PERFORMANCE OPTIMIZATION

### Connection Pooling

```typescript
// Limit concurrent connections per server
const maxConnectionsPerServer = 500;
let activeConnections = 0;

io.on('connection', (socket) => {
  activeConnections++;

  if (activeConnections > maxConnectionsPerServer) {
    socket.emit('error', 'Server at capacity');
    socket.disconnect();
    return;
  }

  socket.on('disconnect', () => {
    activeConnections--;
  });
});
```

### Message Batching

```typescript
// Batch multiple messages to reduce overhead
const messageBatch: any[] = [];
const batchSize = 10;
const batchInterval = 1000; // 1 second

function addToBatch(message: any) {
  messageBatch.push(message);

  if (messageBatch.length >= batchSize) {
    flushBatch();
  }
}

function flushBatch() {
  if (messageBatch.length > 0) {
    publishEvent('batch', { messages: messageBatch });
    messageBatch.length = 0;
  }
}

setInterval(() => {
  if (messageBatch.length > 0) {
    flushBatch();
  }
}, batchInterval);
```

---

## ✅ SUMMARY

**Real-Time Architecture:**
- Socket.io with authentication
- Redis for session/message caching
- Google Pub/Sub for multi-server messaging
- Real-time notifications to specific users
- Live attendance + grade updates
- Scalable to 500+ concurrent users
- Rate limiting + deduplication
- Performance optimized

**Ready for:** Week 3 implementation starting Day 5
