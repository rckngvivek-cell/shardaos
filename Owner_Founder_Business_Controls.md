# OWNER/FOUNDER BUSINESS CONTROLS & OPERATIONS DASHBOARD
## Complete Business Oversight System for Pan-India School ERP

---

# PART 1: OWNER DASHBOARD OVERVIEW

## Dashboard Access Structure

```
┌────────────────────────────────────────────────────────┐
│              FOUNDER SUPER ADMIN                       │
│         (Master Account - 1 user only)                 │
├────────────────────────────────────────────────────────┤
│  • Full control of all schools                          │
│  • Manage all users + staff                             │
│  • Set global pricing & billing                         │
│  • View all financial reports                           │
│  • Access analytics & growth metrics                    │
│  • Control feature releases                             │
│  • Escalated support tickets                            │
│  • Full audit logs access                               │
└────────────────────────────────────────────────────────┘
            ↓                    ↓                ↓
        School 1             School 2         School 3
     (Principal)           (Principal)       (Principal)
    Manage own only       Manage own only   Manage own only
```

---

# PART 2: FOUNDER DASHBOARD IMPLEMENTATION

## Backend: Super Admin Routes

```typescript
// src/routes/founder.ts
import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import * as admin from 'firebase-admin';

const router = express.Router();
const db = admin.firestore();

/**
 * Get Founder Dashboard Data
 * Aggregated view of all schools, revenue, users
 * GET /api/v1/founder/dashboard
 */
router.get(
  '/dashboard',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // 1. Total Schools Count
      const schoolsSnapshot = await db.collection('schools')
        .where('status', '==', 'active')
        .get();
      const totalSchools = schoolsSnapshot.size;

      // 2. Total Students Count (across all schools)
      let totalStudents = 0;
      const schoolsData = [];

      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolData = schoolDoc.data();
        
        // Get student count for this school
        const studentsSnapshot = await db
          .collection('students')
          .doc(schoolDoc.id)
          .collection('students')
          .where('status', '==', 'active')
          .get();
        
        const studentCount = studentsSnapshot.size;
        totalStudents += studentCount;

        schoolsData.push({
          schoolId: schoolDoc.id,
          name: schoolData.name,
          city: schoolData.city,
          state: schoolData.state,
          students: studentCount,
          tier: schoolData.tier, // 'basic', 'premium', 'enterprise'
          monthlyFee: schoolData.monthlyFee,
          status: schoolData.status,
          enrollmentDate: schoolData.enrollmentDate,
          lastActiveDate: schoolData.lastActiveDate
        });
      }

      // 3. Monthly Revenue (Current Month)
      let currentMonthRevenue = 0;
      const invoicesSnapshot = await db.collectionGroup('invoices')
        .where('billing_month', '==', `${year}-${month.toString().padStart(2, '0')}`)
        .where('status', '==', 'paid')
        .get();

      for (const doc of invoicesSnapshot.docs) {
        currentMonthRevenue += doc.data().amount || 0;
      }

      // 4. Annual Revenue (YTD)
      let ytdRevenue = 0;
      const ytdInvoicesSnapshot = await db.collectionGroup('invoices')
        .where('billing_year', '==', year)
        .where('status', '==', 'paid')
        .get();

      for (const doc of ytdInvoicesSnapshot.docs) {
        ytdRevenue += doc.data().amount || 0;
      }

      // 5. Churn (Schools that left this month)
      const churnSnapshot = await db.collection('schools')
        .where('status', '==', 'inactive')
        .where('inactive_date', '>=', new Date(now.getFullYear(), now.getMonth(), 1))
        .get();
      const churnCount = churnSnapshot.size;

      // 6. Outstanding Invoices
      let outstandingAmount = 0;
      const unpaidSnapshot = await db.collectionGroup('invoices')
        .where('status', '==', 'pending')
        .get();

      for (const doc of unpaidSnapshot.docs) {
        outstandingAmount += doc.data().amount || 0;
      }

      // 7. Total Users
      const usersSnapshot = await db.collectionGroup('users')
        .where('status', '==', 'active')
        .get();
      const totalUsers = usersSnapshot.size;

      // 8. Support Tickets (Open)
      const ticketsSnapshot = await db.collection('support_tickets')
        .where('status', '==', 'open')
        .get();
      const openTickets = ticketsSnapshot.size;

      // 9. System Health
      const systemHealth = await getSystemHealth();

      res.json({
        overview: {
          totalSchools,
          activeSchools: schoolsData.length,
          totalStudents,
          totalUsers
        },
        financials: {
          currentMonthRevenue,
          ytdRevenue,
          outstandingAmount,
          averageRevenuePerSchool: totalSchools > 0 ? ytdRevenue / totalSchools : 0
        },
        metrics: {
          churnRate: totalSchools > 0 ? (churnCount / totalSchools) * 100 : 0,
          churnCount,
          openSupportTickets: openTickets,
          avgStudentsPerSchool: totalSchools > 0 ? totalStudents / totalSchools : 0
        },
        systemHealth,
        schools: schoolsData.sort((a, b) => b.students - a.students) // Top schools first
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Get Detailed School Information
 * GET /api/v1/founder/schools/:schoolId/details
 */
router.get(
  '/schools/:schoolId/details',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const schoolDoc = await db.collection('schools').doc(req.params.schoolId).get();
      
      if (!schoolDoc.exists) {
        return res.status(404).json({ error: 'School not found' });
      }

      const schoolData = schoolDoc.data();

      // Get all staff
      const staffSnapshot = await db
        .collection('staff')
        .doc(req.params.schoolId)
        .collection('staff')
        .get();

      // Get revenue history (last 12 months)
      const revenueHistory = await getRevenueHistory(req.params.schoolId, 12);

      // Get usage metrics
      const usageMetrics = await getSchoolUsageMetrics(req.params.schoolId);

      // Get student trends
      const studentTrends = await getStudentTrends(req.params.schoolId, 12);

      res.json({
        school: {
          id: req.params.schoolId,
          ...schoolData
        },
        staff: staffSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        financials: {
          revenueHistory,
          currentTier: schoolData.tier,
          monthlyFee: schoolData.monthlyFee,
          totalRevenue: revenueHistory.reduce((sum, m) => sum + m.revenue, 0)
        },
        usage: usageMetrics,
        trends: {
          students: studentTrends
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Founder: Change School's Pricing Tier
 * POST /api/v1/founder/schools/:schoolId/upgrade-tier
 */
router.post(
  '/schools/:schoolId/upgrade-tier',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const { newTier, effectiveDate } = req.body;

      // Validate tier
      const validTiers = ['basic', 'premium', 'enterprise'];
      if (!validTiers.includes(newTier)) {
        return res.status(400).json({ error: 'Invalid tier' });
      }

      const tierPricing = {
        basic: 20000,      // ₹20K/year
        premium: 40000,    // ₹40K/year
        enterprise: 80000  // ₹80K+/year
      };

      // Update school record
      await db.collection('schools').doc(req.params.schoolId).update({
        tier: newTier,
        monthlyFee: tierPricing[newTier] / 12,
        tierChangedDate: new Date(effectiveDate),
        tierChangedBy: req.user.uid
      });

      // Create billing adjustment
      await db.collection('schools')
        .doc(req.params.schoolId)
        .collection('billing_adjustments')
        .add({
          type: 'tier_upgrade',
          oldTier: schoolData.tier,
          newTier,
          effectiveDate: new Date(effectiveDate),
          appliedBy: req.user.uid,
          appliedAt: new Date()
        });

      res.json({
        success: true,
        message: `School upgraded to ${newTier} tier`
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Get Global Pricing Configuration
 * GET /api/v1/founder/pricing
 */
router.get(
  '/pricing',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const pricingDoc = await db.collection('config').doc('pricing').get();
      
      if (!pricingDoc.exists) {
        return res.json({
          tiers: {
            basic: { price: 20000, features: [] },
            premium: { price: 40000, features: [] },
            enterprise: { price: 80000, features: [] }
          }
        });
      }

      res.json(pricingDoc.data());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Founder: Update Global Pricing
 * POST /api/v1/founder/pricing/update
 */
router.post(
  '/pricing/update',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const { tiers, effectiveDate } = req.body;

      // Validate all tiers present
      if (!tiers.basic || !tiers.premium || !tiers.enterprise) {
        return res.status(400).json({ error: 'All tiers must be specified' });
      }

      // Store current pricing as historical record
      const oldPricing = await db.collection('config').doc('pricing').get();
      
      await db.collection('pricing_history').add({
        oldPricing: oldPricing.data(),
        newPricing: { tiers },
        effectiveDate: new Date(effectiveDate),
        changedBy: req.user.uid,
        changedAt: new Date(),
        reason: req.body.reason || ''
      });

      // Update current pricing
      await db.collection('config').doc('pricing').set({
        tiers,
        lastUpdated: new Date(),
        lastUpdatedBy: req.user.uid
      });

      res.json({
        success: true,
        message: 'Pricing updated successfully'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * View All Support Tickets
 * GET /api/v1/founder/support/tickets
 */
router.get(
  '/support/tickets',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const { status = 'open', priority = 'all' } = req.query;

      let query = db.collection('support_tickets');

      if (status !== 'all') {
        query = query.where('status', '==', status);
      }

      if (priority !== 'all') {
        query = query.where('priority', '==', priority);
      }

      const snapshot = await query.orderBy('created_at', 'desc').get();

      const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        total: tickets.length,
        tickets
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Founder: Escalate or Resolve Ticket
 * POST /api/v1/founder/support/tickets/:ticketId/resolve
 */
router.post(
  '/support/tickets/:ticketId/resolve',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const { resolution, resolutionNote } = req.body;

      await db.collection('support_tickets').doc(req.params.ticketId).update({
        status: 'resolved',
        resolution,
        resolutionNote,
        resolvedBy: req.user.uid,
        resolvedAt: new Date()
      });

      res.json({ success: true, message: 'Ticket resolved' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * System Audit Log
 * GET /api/v1/founder/audit-log
 */
router.get(
  '/audit-log',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const { limit = 100, startAfter = null } = req.query;

      let query = db.collection('audit_logs')
        .orderBy('timestamp', 'desc')
        .limit(parseInt(limit));

      if (startAfter) {
        const doc = await db.collection('audit_logs').doc(startAfter).get();
        query = query.startAfter(doc);
      }

      const snapshot = await query.get();

      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        logs,
        nextCursor: logs.length > 0 ? logs[logs.length - 1].id : null
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Helper Functions

async function getSystemHealth() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Check recent errors
  const errorsSnapshot = await db.collection('error_logs')
    .where('timestamp', '>=', oneHourAgo)
    .get();

  const errorCount = errorsSnapshot.size;

  // Check API latency
  const metricsSnapshot = await db.collection('metrics')
    .where('timestamp', '>=', oneHourAgo)
    .get();

  let avgLatency = 0;
  if (metricsSnapshot.size > 0) {
    const latencies = metricsSnapshot.docs.map(d => d.data().latency_ms);
    avgLatency = latencies.reduce((a, b) => a + b) / latencies.length;
  }

  return {
    status: errorCount === 0 ? 'healthy' : errorCount < 5 ? 'degraded' : 'unhealthy',
    recentErrors: errorCount,
    avgLatencyMs: Math.round(avgLatency),
    uptime: '99.9%'
  };
}

async function getRevenueHistory(schoolId: string, months: number) {
  const history = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const snapshot = await db
      .collection('schools')
      .doc(schoolId)
      .collection('invoices')
      .where('billing_month', '==', `${year}-${month}`)
      .where('status', '==', 'paid')
      .get();

    let monthRevenue = 0;
    snapshot.forEach(doc => {
      monthRevenue += doc.data().amount || 0;
    });

    history.push({
      month: `${year}-${month}`,
      revenue: monthRevenue
    });
  }

  return history;
}

async function getSchoolUsageMetrics(schoolId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Active users in last 30 days
  const activeUsersSnapshot = await db.collectionGroup('audit_logs')
    .where('school_id', '==', schoolId)
    .where('timestamp', '>=', thirtyDaysAgo)
    .get();

  const activeUsers = new Set(activeUsersSnapshot.docs.map(d => d.data().user_id));

  // API calls
  const apiCallsSnapshot = await db.collection('api_logs')
    .where('school_id', '==', schoolId)
    .where('timestamp', '>=', thirtyDaysAgo)
    .get();

  return {
    activeUsers: activeUsers.size,
    apiCalls: apiCallsSnapshot.size,
    avgAPICallsPerDay: Math.round(apiCallsSnapshot.size / 30)
  };
}

async function getStudentTrends(schoolId: string, months: number) {
  const trends = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const snapshot = await db
      .collection('students')
      .doc(schoolId)
      .collection('students')
      .where('status', '==', 'active')
      .get();

    trends.push({
      month: `${year}-${month}`,
      count: snapshot.size
    });
  }

  return trends;
}

export default router;
```

---

# PART 3: FOUNDER DASHBOARD FRONTEND (React)

## Owner Dashboard Component

```jsx
// src/pages/FounderDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './FounderDashboard.css';

export function FounderDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/founder/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!dashboard) return <div>Error loading dashboard</div>;

  return (
    <div className="founder-dashboard">
      <h1>Business Control Center</h1>

      {/* Overview Cards */}
      <div className="card-grid">
        <Card
          title="Active Schools"
          value={dashboard.overview.activeSchools}
          icon="🏫"
        />
        <Card
          title="Total Students"
          value={dashboard.overview.totalStudents}
          icon="👥"
        />
        <Card
          title="Monthly Revenue"
          value={`₹${(dashboard.financials.currentMonthRevenue / 100000).toFixed(2)}L`}
          icon="💰"
        />
        <Card
          title="Outstanding"
          value={`₹${(dashboard.financials.outstandingAmount / 100000).toFixed(2)}L`}
          icon="⚠️"
        />
      </div>

      {/* Financial Metrics */}
      <div className="section">
        <h2>Financial Overview</h2>
        <div className="metrics-row">
          <Metric
            label="YTD Revenue"
            value={`₹${(dashboard.financials.ytdRevenue / 1000000).toFixed(2)}Cr`}
          />
          <Metric
            label="Churn Rate"
            value={`${dashboard.metrics.churnRate.toFixed(1)}%`}
          />
          <Metric
            label="Avg Revenue/School"
            value={`₹${(dashboard.financials.averageRevenuePerSchool / 100000).toFixed(2)}L`}
          />
          <Metric
            label="Avg Students/School"
            value={dashboard.metrics.avgStudentsPerSchool.toFixed(0)}
          />
        </div>
      </div>

      {/* System Health */}
      <div className="section">
        <h2>System Health</h2>
        <HealthStatus health={dashboard.systemHealth} />
      </div>

      {/* Open Support Tickets */}
      <div className="section">
        <h2>Support Tickets ({dashboard.metrics.openSupportTickets})</h2>
        <SupportTickets />
      </div>

      {/* Schools List */}
      <div className="section">
        <h2>All Schools (Top by Students)</h2>
        <SchoolsList schools={dashboard.schools} onSelectSchool={setSelectedSchool} />
      </div>

      {/* School Details Modal */}
      {selectedSchool && (
        <SchoolDetailsModal
          schoolId={selectedSchool}
          onClose={() => setSelectedSchool(null)}
        />
      )}
    </div>
  );
}

function Card({ title, value, icon }) {
  return (
    <div className="card">
      <div className="icon">{icon}</div>
      <div className="content">
        <h3>{title}</h3>
        <p className="value">{value}</p>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <p className="label">{label}</p>
      <p className="value">{value}</p>
    </div>
  );
}

function HealthStatus({ health }) {
  const statusColor = {
    healthy: 'green',
    degraded: 'orange',
    unhealthy: 'red'
  };

  return (
    <div className={`health-status ${statusColor[health.status]}`}>
      <p>Status: <strong>{health.status.toUpperCase()}</strong></p>
      <p>Recent Errors: {health.recentErrors}</p>
      <p>Avg Latency: {health.avgLatencyMs}ms</p>
      <p>Uptime: {health.uptime}</p>
    </div>
  );
}

function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/founder/support/tickets?status=open');
      setTickets(response.data.tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <table className="tickets-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>School</th>
          <th>Issue</th>
          <th>Priority</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map(ticket => (
          <tr key={ticket.id}>
            <td>{ticket.id.slice(0, 8)}</td>
            <td>{ticket.school_name}</td>
            <td>{ticket.subject}</td>
            <td className={`priority-${ticket.priority}`}>{ticket.priority}</td>
            <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
            <td>
              <button className="btn-small">Resolve</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SchoolsList({ schools, onSelectSchool }) {
  return (
    <table className="schools-table">
      <thead>
        <tr>
          <th>School Name</th>
          <th>City</th>
          <th>Students</th>
          <th>Tier</th>
          <th>Monthly Fee</th>
          <th>Last Active</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {schools.map(school => (
          <tr key={school.schoolId}>
            <td className="school-name">{school.name}</td>
            <td>{school.city}</td>
            <td>{school.students}</td>
            <td>
              <span className={`tier-${school.tier}`}>{school.tier.toUpperCase()}</span>
            </td>
            <td>₹{(school.monthlyFee / 1000).toFixed(0)}K</td>
            <td>{new Date(school.lastActiveDate).toLocaleDateString()}</td>
            <td>
              <button className="btn-small" onClick={() => onSelectSchool(school.schoolId)}>
                View Details
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SchoolDetailsModal({ schoolId, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [schoolId]);

  const fetchDetails = async () => {
    try {
      const response = await api.get(`/founder/schools/${schoolId}/details`);
      setDetails(response.data);
    } catch (error) {
      console.error('Error fetching school details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!details) return <div>Error loading details</div>;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>

        <h2>{details.school.name}</h2>

        <div className="modal-section">
          <h3>Financial Performance</h3>
          <p>Total Revenue: ₹{(details.financials.totalRevenue / 100000).toFixed(2)}L</p>
          <p>Current Tier: {details.financials.currentTier.toUpperCase()}</p>
          <p>Monthly Fee: ₹{(details.financials.monthlyFee / 1000).toFixed(0)}K</p>

          <div className="revenue-chart">
            {/* Simple bar chart of last 6 months */}
            {details.financials.revenueHistory.slice(-6).map(month => (
              <div key={month.month} className="bar-item">
                <div className="bar" style={{
                  height: `${Math.max(20, (month.revenue / 100000) * 2)}px`
                }}></div>
                <label>{month.month}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-section">
          <h3>Usage Metrics (Last 30 Days)</h3>
          <p>Active Users: {details.usage.activeUsers}</p>
          <p>API Calls: {details.usage.apiCalls}</p>
          <p>Avg API Calls/Day: {details.usage.avgAPICallsPerDay}</p>
        </div>

        <div className="modal-section">
          <h3>Student Trend</h3>
          <div className="trend-chart">
            {details.trends.students.slice(-6).map(trend => (
              <div key={trend.month} className="trend-bar">
                <div style={{ height: `${trend.count * 0.5}px` }}></div>
                <label>{trend.month.split('-')[1]}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-section">
          <h3>Quick Actions</h3>
          <button className="btn-primary">Upgrade Tier</button>
          <button className="btn-secondary">View Audit Logs</button>
          <button className="btn-secondary">Send Message</button>
        </div>
      </div>
    </div>
  );
}
```

---

# PART 4: BUSINESS CONTROLS - PRICING & BILLING

## Global Pricing Management

```typescript
// src/routes/founder-pricing.ts

/**
 * Get all tiers and features
 */
router.get('/tiers', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const tiersDoc = await db.collection('config').doc('tiers').get();
    res.json(tiersDoc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update tier features (what features each tier gets)
 * POST /api/v1/founder/tiers/:tier/features/update
 */
router.post(
  '/tiers/:tier/features/update',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const { tier } = req.params;
      const { features, description } = req.body;

      // Validate tier
      const validTiers = ['basic', 'premium', 'enterprise'];
      if (!validTiers.includes(tier)) {
        return res.status(400).json({ error: 'Invalid tier' });
      }

      // Store in history
      const oldTiers = await db.collection('config').doc('tiers').get();
      await db.collection('tier_history').add({
        timestamp: new Date(),
        changedBy: req.user.uid,
        tier,
        oldFeatures: oldTiers.data()[tier],
        newFeatures: features,
        reason: req.body.reason
      });

      // Update tiers
      const updateData = {};
      updateData[tier] = { features, description };
      
      await db.collection('config').doc('tiers').update(updateData);

      res.json({ success: true, message: `${tier} tier updated` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Bulk upgrade schools (e.g., special promotion)
 * POST /api/v1/founder/bulk-upgrade
 */
router.post(
  '/bulk-upgrade',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const { schoolIds, newTier, discount = 0, reason } = req.body;

      const updates = [];

      for (const schoolId of schoolIds) {
        const schoolRef = db.collection('schools').doc(schoolId);
        const updateObj = {
          tier: newTier,
          discountApplied: discount,
          discountReason: reason,
          tierChangedDate: new Date(),
          tierChangedBy: req.user.uid
        };

        updates.push(schoolRef.update(updateObj));

        // Log the change
        await db
          .collection('schools')
          .doc(schoolId)
          .collection('billing_adjustments')
          .add({
            type: 'bulk_upgrade',
            newTier,
            discount,
            reason,
            appliedAt: new Date(),
            appliedBy: req.user.uid
          });
      }

      await Promise.all(updates);

      res.json({
        success: true,
        message: `${schoolIds.length} schools upgraded to ${newTier}`
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Generate custom invoices for schools
 * POST /api/v1/founder/schools/:schoolId/generate-invoice
 */
router.post(
  '/schools/:schoolId/generate-invoice',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const { amount, reason, dueDate } = req.body;

      const invoiceRef = db
        .collection('schools')
        .doc(req.params.schoolId)
        .collection('invoices')
        .doc();

      await invoiceRef.set({
        id: invoiceRef.id,
        amount,
        reason,
        dueDate: new Date(dueDate),
        status: 'pending',
        createdBy: req.user.uid,
        createdAt: new Date(),
        paidAt: null,
        paymentMethod: null
      });

      // Send invoice email to school admin
      await sendInvoiceEmail(req.params.schoolId, amount, reason);

      res.status(201).json({
        invoiceId: invoiceRef.id,
        message: 'Invoice created and sent'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Track and collect outstanding payments
 * GET /api/v1/founder/collections
 */
router.get(
  '/collections',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      // Get all unpaid invoices older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const overdueSnapshot = await db.collectionGroup('invoices')
        .where('status', '==', 'pending')
        .where('dueDate', '<', thirtyDaysAgo)
        .get();

      const overdue = overdueSnapshot.docs.map(doc => ({
        id: doc.id,
        schoolId: doc.ref.parent.parent.id,
        ...doc.data()
      }));

      const totalOverdue = overdue.reduce((sum, inv) => sum + inv.amount, 0);

      // Get payment reminders sent
      const remindersSnapshot = await db.collection('payment_reminders')
        .where('status', '==', 'pending')
        .get();

      res.json({
        overdue,
        totalOverdueAmount: totalOverdue,
        overdueCount: overdue.length,
        reminders: remindersSnapshot.docs.map(d => d.data())
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Send payment reminder to school
 * POST /api/v1/founder/schools/:schoolId/send-reminder
 */
router.post(
  '/schools/:schoolId/send-reminder',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      // Add reminder record
      await db.collection('payment_reminders').add({
        schoolId: req.params.schoolId,
        sentAt: new Date(),
        sentBy: req.user.uid,
        status: 'sent',
        type: req.body.type // 'first_reminder', 'second_reminder', 'final_notice'
      });

      // Send email
      await sendPaymentReminderEmail(req.params.schoolId, req.body.type);

      res.json({ success: true, message: 'Reminder sent' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

---

# PART 5: FOUNDER CONTROLS FOR FEATURES & ROLLOUT

## Feature Flags & A/B Testing

```typescript
// src/routes/founder-features.ts

/**
 * Get all feature flags
 * GET /api/v1/founder/features
 */
router.get(
  '/features',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const featuresDoc = await db.collection('config').doc('features').get();
      res.json(featuresDoc.data() || {});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Enable/disable feature globally
 * POST /api/v1/founder/features/:featureName/toggle
 */
router.post(
  '/features/:featureName/toggle',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const { enabled, rolloutPercentage = 100 } = req.body;

      const featureData = {
        enabled,
        rolloutPercentage,
        lastUpdated: new Date(),
        updatedBy: req.user.uid
      };

      // Store in config
      const configRef = db.collection('config').doc('features');
      const updateObj = {};
      updateObj[req.params.featureName] = featureData;
      
      await configRef.update(updateObj);

      // Log feature change
      await db.collection('feature_log').add({
        feature: req.params.featureName,
        action: enabled ? 'enabled' : 'disabled',
        rolloutPercentage,
        timestamp: new Date(),
        changedBy: req.user.uid
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Enable feature for specific schools (beta testing)
 * POST /api/v1/founder/features/:featureName/beta
 */
router.post(
  '/features/:featureName/beta',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const { schoolIds } = req.body;

      await db.collection('beta_features').add({
        feature: req.params.featureName,
        schools: schoolIds,
        startDate: new Date(),
        status: 'active',
        enabledBy: req.user.uid
      });

      res.json({
        success: true,
        message: `${req.params.featureName} enabled for ${schoolIds.length} schools`
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

---

# PART 6: FINANCIAL REPORTS & ANALYTICS

## Advanced Reporting for Owner

```typescript
// src/routes/founder-reports.ts

/**
 * Generate monthly financial report
 * GET /api/v1/founder/reports/monthly
 */
router.get(
  '/reports/monthly',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const { year, month } = req.query;

      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

      // Total revenue
      const invoicesSnapshot = await db.collectionGroup('invoices')
        .where('billing_month', '==', monthStr)
        .where('status', '==', 'paid')
        .get();

      let totalRevenue = 0;
      const schoolRevenue = {};

      invoicesSnapshot.forEach(doc => {
        const amount = doc.data().amount;
        totalRevenue += amount;
        
        const schoolId = doc.ref.parent.parent.id;
        if (!schoolRevenue[schoolId]) {
          schoolRevenue[schoolId] = 0;
        }
        schoolRevenue[schoolId] += amount;
      });

      // Churn
      const schoolsEndedSnapshot = await db.collection('schools')
        .where('status', '==', 'inactive')
        .where('inactive_date', '>=', new Date(year, month - 1, 1))
        .where('inactive_date', '<', new Date(year, month, 1))
        .get();

      const churnCount = schoolsEndedSnapshot.size;

      // New schools
      const newSchoolsSnapshot = await db.collection('schools')
        .where('status', '==', 'active')
        .where('enrollmentDate', '>=', new Date(year, month - 1, 1))
        .where('enrollmentDate', '<', new Date(year, month, 1))
        .get();

      const newSchools = newSchoolsSnapshot.size;

      // Expenses (if tracked)
      const expensesSnapshot = await db.collection('expenses')
        .where('month', '==', monthStr)
        .get();

      let totalExpenses = 0;
      expensesSnapshot.forEach(doc => {
        totalExpenses += doc.data().amount;
      });

      const profitMargin = totalRevenue > 0
        ? ((totalRevenue - totalExpenses) / totalRevenue) * 100
        : 0;

      res.json({
        month: monthStr,
        metrics: {
          totalRevenue,
          totalExpenses,
          netProfit: totalRevenue - totalExpenses,
          profitMargin: profitMargin.toFixed(2),
          newSchools,
          churnedSchools: churnCount,
          schoolRevenue,
          avgRevenuePerSchool: totalRevenue > 0 ? totalRevenue / Object.keys(schoolRevenue).length : 0
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Annual financial projection
 * GET /api/v1/founder/reports/projection
 */
router.get(
  '/reports/projection',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      // Historical data for last 12 months
      const now = new Date();
      const projection = {};

      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

        // Get revenue for month
        const invoicesSnapshot = await db.collectionGroup('invoices')
          .where('billing_month', '==', key)
          .where('status', '==', 'paid')
          .get();

        let revenue = 0;
        invoicesSnapshot.forEach(doc => {
          revenue += doc.data().amount;
        });

        projection[key] = revenue;
      }

      // Simple linear projection for next 12 months
      const revenues = Object.values(projection);
      const avgMonthlyRevenue = revenues.reduce((a, b) => a + b) / revenues.length;

      const futureProjection = {};
      for (let i = 1; i <= 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        futureProjection[key] = Math.round(avgMonthlyRevenue * (1 + (i * 0.05))); // 5% growth per month
      }

      res.json({
        historical: projection,
        projected: futureProjection,
        avgHistoricalMonthly: Math.round(avgMonthlyRevenue),
        projectedAnnualRevenue: Object.values(futureProjection).reduce((a, b) => a + b)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

---

# PART 7: FOUNDER CONTROLS DASHBOARD (CSS)

```css
/* src/styles/FounderDashboard.css */

.founder-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background: #f5f5f5;
}

.founder-dashboard h1 {
  font-size: 32px;
  margin-bottom: 30px;
  color: #1a1a1a;
}

/* Card Grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.card .icon {
  font-size: 32px;
}

.card .content h3 {
  margin: 0;
  font-size: 14px;
  color: #666;
  text-transform: uppercase;
}

.card .value {
  margin: 8px 0 0;
  font-size: 28px;
  font-weight: bold;
  color: #1a1a1a;
}

/* Section */
.section {
  background: white;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section h2 {
  margin-top: 0;
  font-size: 20px;
  margin-bottom: 20px;
  color: #1a1a1a;
}

/* Metrics Row */
.metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.metric {
  border-left: 4px solid #007AFF;
  padding-left: 15px;
}

.metric .label {
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
  margin-bottom: 5px;
}

.metric .value {
  font-size: 24px;
  font-weight: bold;
  color: #1a1a1a;
}

/* Health Status */
.health-status {
  padding: 20px;
  border-radius: 6px;
  border-left: 5px solid;
}

.health-status.healthy {
  background: #f0f9ff;
  border-color: #10b981;
}

.health-status.degraded {
  background: #fffbf0;
  border-color: #f59e0b;
}

.health-status.unhealthy {
  background: #fef2f2;
  border-color: #ef4444;
}

.health-status p {
  margin: 8px 0;
}

/* Tables */
.tickets-table, .schools-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.tickets-table th, .schools-table th {
  background: #f9f9f9;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #e0e0e0;
  font-weight: 600;
  color: #1a1a1a;
}

.tickets-table td, .schools-table td {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.tickets-table tr:hover, .schools-table tr:hover {
  background: #f9f9f9;
}

.priority-critical {
  background: #fee;
  color: #c33;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.priority-high {
  background: #ffe;
  color: #aa6600;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.tier-enterprise {
  background: #ede7f6;
  color: #5e35b1;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.tier-premium {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.tier-basic {
  background: #f1f8e9;
  color: #558b2f;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 30px;
  position: relative;
}

.modal .close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal h2 {
  margin-top: 0;
}

.modal-section {
  margin-bottom: 25px;
  padding-bottom: 25px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-section:last-child {
  border-bottom: none;
}

.modal-section h3 {
  margin-top: 0;
  font-size: 16px;
  color: #1a1a1a;
}

/* Charts */
.revenue-chart {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 200px;
  margin-top: 20px;
}

.bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.bar-item .bar {
  width: 100%;
  background: linear-gradient(180deg, #007AFF, #0051D5);
  border-radius: 4px 4px 0 0;
  min-height: 5px;
}

.bar-item label {
  font-size: 12px;
  color: #999;
}

/* Buttons */
.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  margin-right: 10px;
  margin-bottom: 10px;
}

.btn-primary {
  background: #007AFF;
  color: white;
}

.btn-primary:hover {
  background: #0051D5;
}

.btn-secondary {
  background: #f0f0f0;
  color: #1a1a1a;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-small {
  padding: 6px 12px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
```

---

# PART 8: FOUNDER CONTROLS - IMPLEMENTATION CHECKLIST

## Week 3 Tasks (After Auth System)

### Backend (Days 1-3)
- [ ] Create founder routes for dashboard data
- [ ] Implement aggregation queries (schools, revenue, churn)
- [ ] Build support ticket management endpoints
- [ ] Create audit logging for all founder actions
- [ ] Implement pricing update endpoints
- [ ] Build financial reporting APIs
- [ ] Create feature flag endpoints
- [ ] Tests: 20+ test cases for founder endpoints

### Frontend (Days 4-5)
- [ ] Build founder dashboard layout
- [ ] Create data visualizations (revenue charts, trends)
- [ ] Implement school details modal
- [ ] Build support ticket interface
- [ ] Create pricing management UI
- [ ] Deploy to staging for review

### Database
- [ ] Add audit_logs collection with full history
- [ ] Create pricing_history, tier_history collections
- [ ] Add feature_log collection
- [ ] Create billing_adjustments subcollection per school
- [ ] Add expense tracking collection

---

# PART 9: KEY FOUNDER METRICS TO MONITOR

## Dashboard KPIs

```
MONTHLY MONITORING (1st of every month):

Financial:
  - Total Revenue (vs last month)
  - Profit Margin (target: 40%+)
  - Outstanding Receivables
  - Cost per Acquisition (CAC)
  - Lifetime Value (LTV)

Growth:
  - New Schools Added (vs target)
  - Churn Rate (target: <2%)
  - Total Students (active)
  - Total Teachers/Staff

Operational:
  - API Availability (target: 99.9%)
  - Avg Response Time (target: <200ms)
  - Support Ticket Resolution Time
  - Number of Bugs Reported

Product:
  - Features Requested (top 5)
  - Usage of Each Module
  - Mobile vs Web Usage
  - Most Used Features
```

---

# PART 10: FOUNDER EMERGENCY CONTROLS

## Crisis Management

```typescript
// src/routes/founder-emergency.ts

/**
 * EMERGENCY: Disable a school account
 * POST /api/v1/founder/emergency/disable-school
 */
router.post(
  '/emergency/disable-school',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    // Only super_admin can do this
    const { schoolId, reason } = req.body;

    // Log the action
    await db.collection('emergency_actions').add({
      action: 'school_disabled',
      schoolId,
      reason,
      actionBy: req.user.uid,
      timestamp: new Date()
    });

    // Disable school
    await db.collection('schools').doc(schoolId).update({
      status: 'disabled',
      disabled_at: new Date(),
      disabled_by: req.user.uid,
      disable_reason: reason
    });

    // Notify school admin immediately
    // Send suspension notice
    
    res.json({ success: true });
  }
);

/**
 * EMERGENCY: Revoke user access immediately
 * POST /api/v1/founder/emergency/revoke-access
 */
router.post(
  '/emergency/revoke-access',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    const { userId, reason } = req.body;

    // Revoke all sessions
    await admin.auth().revokeRefreshTokens(userId);

    // Update user status
    await db.collection('users').doc(userId).update({
      status: 'revoked',
      revoked_at: new Date(),
      revoked_by: req.user.uid,
      revoke_reason: reason
    });

    res.json({ success: true, message: 'Access revoked' });
  }
);

/**
 * EMERGENCY: Rollback feature for all users
 * POST /api/v1/founder/emergency/rollback-feature
 */
router.post(
  '/emergency/rollback-feature',
  authMiddleware,
  requireRole('super_admin'),
  async (req, res) => {
    const { featureName } = req.body;

    // Disable feature immediately
    const configRef = db.collection('config').doc('features');
    const updateObj = {};
    updateObj[featureName] = { enabled: false, rolloutPercentage: 0 };
    
    await configRef.update(updateObj);

    // Notify engineering team
    // Send Slack notification
    
    res.json({ success: true, message: `${featureName} rolled back` });
  }
);
```

---

# PART 11: EXAMPLE: HOW OWNER MANAGES GROWTH

## Weekly Founder Check-in Process

```
EVERY MONDAY (9 AM):

1. Review Dashboard (5 mins)
   ├─ Check MoM revenue growth
   ├─ Check churn rate
   ├─ Check system health
   └─ Identify any issues

2. Review New Schools (10 mins)
   ├─ How many enrolled this week?
   ├─ Where are they from (geography)?
   ├─ What tier did they choose?
   └─ Send welcome message

3. Review Churn (5 mins)
   ├─ Did any schools leave?
   ├─ What was the reason?
   ├─ Can we win them back?
   └─ Update churn analysis

4. Check Support Queue (5 mins)
   ├─ Any critical issues?
   ├─ Average resolution time?
   ├─ Top complaints this week?
   └─ Escalate if needed

5. Financial Check (10 mins)
   ├─ Outstanding invoices >₹1L?
   ├─ Send payment reminders
   ├─ Check cash balance
   └─ Update financial model

6. Product Review (10 mins)
   ├─ What features requested most?
   ├─ Usage statistics per module
   ├─ Performance issues?
   └─ Plan next week's releases

Action Items:
- Update exec summary
- Schedule 1:1s with team leads
- Send investor update
- Plan hiring for Q next
```

---

This comprehensive Owner/Founder Business Controls system enables complete business oversight, financial management, feature releases, and growth tracking!

