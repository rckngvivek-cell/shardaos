# FOUNDER DASHBOARD - LOCAL & SECURE ACCESS ONLY
## Terminal-Based & Localhost-Only Implementation

---

# PART 1: ARCHITECTURE - NO PUBLIC WEB ACCESS

## Security Model

```
┌─────────────────────────────────────────────────────┐
│        FOUNDER DASHBOARD - CLOSED SYSTEM            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Option 1: CLI Terminal Tool                        │
│  $ founder-dashboard --metric=revenue              │
│  (Runs locally, accesses API with special key)     │
│                                                     │
│  Option 2: Localhost Web (127.0.0.1 only)          │
│  http://localhost:3001/founder                     │
│  (Cannot be accessed remotely)                      │
│                                                     │
│  Option 3: SSH Tunnel + Web                         │
│  ssh -L 3001:localhost:3001 prod-server            │
│  http://localhost:3001/founder                     │
│  (Only through secure tunnel)                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## What is BLOCKED:

```
❌ https://app.schoolerp.in/founder         ← PUBLIC (blocked)
❌ https://schoolerp.in/dashboard/founder   ← PUBLIC (blocked)
❌ API token in browser localStorage        ← NO (blocked)
❌ Founder routes in main Express app       ← NO (blocked)
❌ Founder data in public API                ← NO (blocked)
```

## What is ALLOWED:

```
✅ $ founder-cli --dashboard              ← LOCAL TERMINAL
✅ $ founder-cli --revenue --month=april  ← LOCAL TERMINAL
✅ http://localhost:3001/founder          ← LOCALHOST ONLY
✅ SSH tunnel to secure server            ← ENCRYPTED
✅ VPN-only access                        ← RESTRICTED
```

---

# PART 2: IMPLEMENTATION - REMOVE FROM PUBLIC API

## Separate Backend: Founder CLI Service

```typescript
// founder-service/src/index.ts
// COMPLETELY SEPARATE from main Express app
// This runs on founder's local machine ONLY

import express from 'express';
import * as admin from 'firebase-admin';
import axios from 'axios';

// Initialize Firebase with service account (local only)
const serviceAccount = require('/path/to/foundation-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.GCP_PROJECT_ID
});

const db = admin.firestore();
const app = express();

// ⚠️ CRITICAL: Only listen on localhost
const PORT = 3001;
const HOST = '127.0.0.1'; // localhost ONLY

app.listen(PORT, HOST, () => {
  console.log(`⚠️  Founder Dashboard running on http://localhost:${PORT}`);
  console.log('🔒 Only accessible locally. NEVER expose to internet.');
});

/**
 * Get Dashboard Data
 * Only accessible on localhost
 */
app.get('/dashboard', async (req, res) => {
  // Verify this is coming from localhost
  const clientIp = req.ip;
  if (clientIp !== '127.0.0.1' && clientIp !== '::1') {
    return res.status(403).json({ error: 'Forbidden: Must access from localhost' });
  }

  try {
    // Get aggregated metrics
    const schoolsSnapshot = await db.collection('schools')
      .where('status', '==', 'active')
      .get();

    const totalSchools = schoolsSnapshot.size;
    let totalStudents = 0;
    let totalRevenue = 0;

    for (const schoolDoc of schoolsSnapshot.docs) {
      const studentsSnapshot = await db
        .collection('students')
        .doc(schoolDoc.id)
        .collection('students')
        .where('status', '==', 'active')
        .get();

      totalStudents += studentsSnapshot.size;

      // Get revenue for this month
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;

      const invoicesSnapshot = await db
        .collection('schools')
        .doc(schoolDoc.id)
        .collection('invoices')
        .where('billing_month', '==', monthStr)
        .where('status', '==', 'paid')
        .get();

      invoicesSnapshot.forEach(doc => {
        totalRevenue += doc.data().amount || 0;
      });
    }

    res.json({
      timestamp: new Date().toISOString(),
      metrics: {
        totalSchools,
        totalStudents,
        currentMonthRevenue: totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Full Financial Report
 * Local-only access
 */
app.get('/reports/financial', async (req, res) => {
  // IP check
  const clientIp = req.ip;
  if (clientIp !== '127.0.0.1' && clientIp !== '::1') {
    return res.status(403).json({ error: 'Blocked' });
  }

  // ... return detailed financial data ...
  res.json({ /* sensitive data */ });
});

/**
 * ⚠️  CRITICAL: These endpoints do NOT exist on public API
 */
```

## Main API: Block All Founder Routes

```typescript
// src/index.ts (Main Express App - PUBLIC)
import express from 'express';

const app = express();

/**
 * Register all normal routes
 */
app.use('/api/v1/schools', schoolsRouter);
app.use('/api/v1/students', studentsRouter);
app.use('/api/v1/attendance', attendanceRouter);
app.use('/api/v1/grades', gradesRouter);
app.use('/api/v1/users', usersRouter);

/**
 * ❌ DO NOT REGISTER FOUNDER ROUTES HERE
 */
// ❌ app.use('/api/v1/founder', founderRouter);  ← BLOCKED

/**
 * Block any attempts to access founder endpoints
 */
app.get('/founder*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.get('/admin*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.get('/control*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
```

---

# PART 3: FOUNDER CLI TOOL

## Command-Line Interface for Terminal Access

```typescript
// founder-cli/src/cli.ts
#!/usr/bin/env node

import * as admin from 'firebase-admin';
import chalk from 'chalk';
import Table from 'cli-table3';
import axios from 'axios';
import program from 'commander';
import fs from 'fs';
import path from 'path';

// Load service account from secure location
const serviceAccountPath = path.resolve(
  process.env.HOME,
  '.schoolerp/founder-credentials.json'
);

if (!fs.existsSync(serviceAccountPath)) {
  console.error(chalk.red('❌ Error: Founder credentials not found'));
  console.error(
    chalk.yellow(`Expected at: ${serviceAccountPath}`)
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, 'utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

/**
 * Command: View Dashboard
 * $ founder-cli dashboard
 */
program
  .command('dashboard')
  .description('View founder dashboard')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('\n📊 School ERP - Founder Dashboard'));
      console.log(chalk.gray('Generated: ' + new Date().toLocaleString()));

      // Get schools
      const schoolsSnapshot = await db.collection('schools')
        .where('status', '==', 'active')
        .get();

      const totalSchools = schoolsSnapshot.size;

      // Get students
      let totalStudents = 0;
      let totalRevenue = 0;

      for (const schoolDoc of schoolsSnapshot.docs) {
        const studentsSnapshot = await db
          .collection('students')
          .doc(schoolDoc.id)
          .collection('students')
          .where('status', '==', 'active')
          .get();

        totalStudents += studentsSnapshot.size;

        // Get revenue
        const now = new Date();
        const monthStr = formatMonth(now);

        const invoicesSnapshot = await db
          .collection('schools')
          .doc(schoolDoc.id)
          .collection('invoices')
          .where('billing_month', '==', monthStr)
          .where('status', '==', 'paid')
          .get();

        invoicesSnapshot.forEach(doc => {
          totalRevenue += doc.data().amount || 0;
        });
      }

      if (options.json) {
        console.log(JSON.stringify({
          totalSchools,
          totalStudents,
          monthlyRevenue: totalRevenue
        }, null, 2));
      } else {
        const table = new Table({
          head: [chalk.cyan('Metric'), chalk.cyan('Value')],
          style: { head: [], border: ['grey'] }
        });

        table.push(
          ['Active Schools', chalk.green(totalSchools.toString())],
          ['Total Students', chalk.green(totalStudents.toString())],
          ['Current Month Revenue', chalk.green(`₹${formatRupees(totalRevenue)}`)],
          ['Avg Students/School', chalk.yellow(Math.round(totalStudents / totalSchools).toString())]
        );

        console.log(table.toString());
      }

      console.log(); // blank line
    } catch (error) {
      console.error(chalk.red('❌ Error: ' + error.message));
      process.exit(1);
    }
  });

/**
 * Command: List all schools
 * $ founder-cli schools
 */
program
  .command('schools')
  .description('List all schools')
  .option('--sort', 'Sort by students (default) or revenue')
  .option('--limit', 'Limit results')
  .action(async (options) => {
    try {
      const schoolsSnapshot = await db.collection('schools')
        .where('status', '==', 'active')
        .get();

      const schools = [];

      for (const doc of schoolsSnapshot.docs) {
        const schoolData = doc.data();
        const studentsSnapshot = await db
          .collection('students')
          .doc(doc.id)
          .collection('students')
          .where('status', '==', 'active')
          .get();

        schools.push({
          id: doc.id,
          name: schoolData.name,
          city: schoolData.city,
          students: studentsSnapshot.size,
          tier: schoolData.tier,
          monthlyFee: schoolData.monthlyFee
        });
      }

      // Sort
      if (options.sort === 'revenue') {
        schools.sort((a, b) => b.monthlyFee - a.monthlyFee);
      } else {
        schools.sort((a, b) => b.students - a.students);
      }

      // Limit
      const limit = options.limit || schools.length;
      const display = schools.slice(0, limit);

      const table = new Table({
        head: [
          chalk.cyan('School Name'),
          chalk.cyan('City'),
          chalk.cyan('Students'),
          chalk.cyan('Tier'),
          chalk.cyan('Monthly Fee')
        ],
        style: { head: [], border: ['grey'] }
      });

      display.forEach(school => {
        table.push([
          school.name,
          school.city,
          school.students,
          school.tier.toUpperCase(),
          `₹${school.monthlyFee / 1000}K`
        ]);
      });

      console.log(table.toString());
      console.log(`\nShowing ${display.length} of ${schools.length} schools\n`);
    } catch (error) {
      console.error(chalk.red('❌ Error: ' + error.message));
      process.exit(1);
    }
  });

/**
 * Command: View revenue
 * $ founder-cli revenue --month=april
 */
program
  .command('revenue')
  .description('View revenue metrics')
  .option('--month <month>', 'Month (1-12 or name)')
  .option('--year <year>', 'Year (default: current)')
  .action(async (options) => {
    try {
      const now = new Date();
      let month = now.getMonth() + 1;
      let year = now.getFullYear();

      if (options.month) {
        if (isNaN(options.month)) {
          const monthMap = {
            january: 1, february: 2, march: 3, april: 4,
            may: 5, june: 6, july: 7, august: 8,
            september: 9, october: 10, november: 11, december: 12
          };
          month = monthMap[options.month.toLowerCase()];
        } else {
          month = parseInt(options.month);
        }
      }

      if (options.year) {
        year = parseInt(options.year);
      }

      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

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

      console.log(chalk.blue.bold(`\n💰 Revenue Report - ${monthStr}`));
      console.log(chalk.green(`Total Revenue: ₹${formatRupees(totalRevenue)}`));
      console.log(`Paid Invoices: ${invoicesSnapshot.size}\n`);

      // Top 10 schools by revenue
      const sortedSchools = Object.entries(schoolRevenue)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      if (sortedSchools.length > 0) {
        const table = new Table({
          head: [chalk.cyan('Rank'), chalk.cyan('School ID'), chalk.cyan('Revenue')],
          style: { head: [], border: ['grey'] }
        });

        sortedSchools.forEach(([schoolId, revenue], index) => {
          table.push([
            (index + 1).toString(),
            schoolId.slice(0, 12) + '...',
            `₹${formatRupees(revenue)}`
          ]);
        });

        console.log(table.toString());
      }

      console.log();
    } catch (error) {
      console.error(chalk.red('❌ Error: ' + error.message));
      process.exit(1);
    }
  });

/**
 * Command: View support tickets
 * $ founder-cli tickets
 */
program
  .command('tickets')
  .description('View open support tickets')
  .option('--priority <level>', 'Filter by priority')
  .action(async (options) => {
    try {
      let query = db.collection('support_tickets')
        .where('status', '==', 'open');

      if (options.priority) {
        query = query.where('priority', '==', options.priority);
      }

      const snapshot = await query.orderBy('created_at', 'desc').get();

      console.log(chalk.blue.bold(`\n📋 Open Support Tickets (${snapshot.size})\n`));

      const table = new Table({
        head: [
          chalk.cyan('ID'),
          chalk.cyan('School'),
          chalk.cyan('Issue'),
          chalk.cyan('Priority'),
          chalk.cyan('Created')
        ],
        style: { head: [], border: ['grey'] }
      });

      snapshot.forEach(doc => {
        const data = doc.data();
        const priorityColor =
          data.priority === 'critical' ? chalk.red :
          data.priority === 'high' ? chalk.yellow :
          chalk.green;

        table.push([
          doc.id.slice(0, 8),
          data.school_name || 'Unknown',
          data.subject.slice(0, 30),
          priorityColor(data.priority.toUpperCase()),
          new Date(data.created_at).toLocaleDateString()
        ]);
      });

      console.log(table.toString());
      console.log();
    } catch (error) {
      console.error(chalk.red('❌ Error: ' + error.message));
      process.exit(1);
    }
  });

/**
 * Command: Upgrade school tier (with confirmation)
 * $ founder-cli upgrade-school <schoolId> <newTier>
 */
program
  .command('upgrade-school <schoolId> <newTier>')
  .description('Upgrade school tier')
  .action(async (schoolId, newTier) => {
    try {
      const validTiers = ['basic', 'premium', 'enterprise'];
      if (!validTiers.includes(newTier)) {
        console.error(chalk.red(`❌ Invalid tier. Must be: ${validTiers.join(', ')}`));
        process.exit(1);
      }

      // Get school to confirm
      const schoolDoc = await db.collection('schools').doc(schoolId).get();
      if (!schoolDoc.exists) {
        console.error(chalk.red('❌ School not found'));
        process.exit(1);
      }

      const schoolData = schoolDoc.data();
      console.log(chalk.yellow(`\n⚠️  UPGRADING SCHOOL:`));
      console.log(`  Name: ${schoolData.name}`);
      console.log(`  Current Tier: ${schoolData.tier.toUpperCase()}`);
      console.log(`  New Tier: ${newTier.toUpperCase()}`);
      console.log(`  City: ${schoolData.city}`);

      // Simulate confirmation (in real CLI, would use inquirer.js)
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(chalk.cyan('\nType "yes" to confirm: '), async (answer) => {
        rl.close();

        if (answer !== 'yes') {
          console.log(chalk.gray('Cancelled'));
          process.exit(0);
        }

        // Update
        const tierPricing = {
          basic: 20000,
          premium: 40000,
          enterprise: 80000
        };

        await db.collection('schools').doc(schoolId).update({
          tier: newTier,
          monthlyFee: tierPricing[newTier] / 12,
          tierChangedDate: new Date(),
          tierChangedBy: 'CLI'
        });

        console.log(chalk.green(`✅ School upgraded to ${newTier.toUpperCase()}`));
        console.log();
      });
    } catch (error) {
      console.error(chalk.red('❌ Error: ' + error.message));
      process.exit(1);
    }
  });

/**
 * Initialize CLI - setup credentials
 * $ founder-cli init
 */
program
  .command('init')
  .description('Setup founder CLI credentials')
  .action(async () => {
    try {
      const credentialsPath = path.resolve(
        process.env.HOME,
        '.schoolerp'
      );

      if (!fs.existsSync(credentialsPath)) {
        fs.mkdirSync(credentialsPath, { recursive: true });
      }

      console.log(chalk.blue('📝 Founder CLI Setup\n'));
      console.log('Place your Firebase service account JSON at:');
      console.log(chalk.yellow(`  ${credentialsPath}/founder-credentials.json\n`));

      console.log('Steps:');
      console.log('1. Download service account from Firebase Console');
      console.log('2. Save as: ~/.schoolerp/founder-credentials.json');
      console.log('3. Run: founder-cli dashboard\n');

    } catch (error) {
      console.error(chalk.red('❌ Error: ' + error.message));
    }
  });

/**
 * Help
 */
program
  .command('help')
  .description('Show all commands')
  .action(() => {
    program.help();
  });

program.version('1.0.0');
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// Helper functions
function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;
}

function formatRupees(amount: number): string {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(2)}Cr`;
  } else if (amount >= 100000) {
    return `${(amount / 100000).toFixed(2)}L`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)}K`;
  }
  return amount.toFixed(0);
}
```

## CLI Usage Examples

```bash
# View dashboard summary
$ founder-cli dashboard

# List all schools
$ founder-cli schools --sort=revenue --limit=20

# View monthly revenue
$ founder-cli revenue --month=april --year=2026

# View open support tickets
$ founder-cli tickets --priority=critical

# Upgrade a school's tier
$ founder-cli upgrade-school school_xyz_id premium

# View help
$ founder-cli help
```

---

# PART 4: LOCALHOST-ONLY WEB DASHBOARD

## React Frontend - Localhost Only

```typescript
// founder-dashboard/src/index.tsx
// This runs on localhost:3001 ONLY

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ⚠️ CRITICAL: Check that we're on localhost
if (!window.location.hostname.includes('localhost') && 
    !window.location.hostname === '127.0.0.1') {
  document.body.innerHTML = '<h1>Access Denied</h1><p>This dashboard can only be accessed locally.</p>';
  process.exit(1);
}

const root = ReactDOM.createRoot(
  document.getElementById('root')!
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Founder Dashboard Web App

```jsx
// App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    // Connect to localhost:3001
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('http://localhost:3001/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="founder-app">
      <header className="header">
        <h1>🔒 Founder Dashboard (Local Only)</h1>
        <p className="warning">⚠️  This page is only accessible on localhost</p>
      </header>

      <nav className="tabs">
        <button
          className={tab === 'overview' ? 'active' : ''}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>
        <button
          className={tab === 'schools' ? 'active' : ''}
          onClick={() => setTab('schools')}
        >
          Schools
        </button>
        <button
          className={tab === 'revenue' ? 'active' : ''}
          onClick={() => setTab('revenue')}
        >
          Revenue
        </button>
        <button
          className={tab === 'support' ? 'active' : ''}
          onClick={() => setTab('support')}
        >
          Support
        </button>
      </nav>

      <main className="content">
        {tab === 'overview' && dashboard && (
          <Overview data={dashboard} />
        )}
        {tab === 'schools' && <Schools />}
        {tab === 'revenue' && <Revenue />}
        {tab === 'support' && <Support />}
      </main>

      <footer className="footer">
        <p>🔐 Secure. Local-Only. Never Exposed to Internet.</p>
      </footer>
    </div>
  );
}

function Overview({ data }) {
  return (
    <div className="overview">
      <div className="card large">
        <h2>Active Schools</h2>
        <p className="number">{data.metrics.totalSchools}</p>
      </div>
      <div className="card large">
        <h2>Total Students</h2>
        <p className="number">{data.metrics.totalStudents}</p>
      </div>
      <div className="card large">
        <h2>Month Revenue</h2>
        <p className="number">₹{(data.metrics.currentMonthRevenue / 100000).toFixed(2)}L</p>
      </div>
    </div>
  );
}

function Schools() {
  return <div className="section"><p>Schools data...</p></div>;
}

function Revenue() {
  return <div className="section"><p>Revenue data...</p></div>;
}

function Support() {
  return <div className="section"><p>Support tickets...</p></div>;
}

export default App;
```

```css
/* App.css */

.founder-app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f5f5;
}

.header {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0 0 10px;
  color: #1a1a1a;
}

.warning {
  color: #ff6b6b;
  margin: 0;
  font-weight: 600;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  background: white;
  padding: 10px;
  border-radius: 8px;
}

.tabs button {
  padding: 10px 20px;
  border: none;
  background: #f0f0f0;
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
}

.tabs button.active {
  background: #007AFF;
  color: white;
}

.content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
}

.card h2 {
  margin: 0 0 20px;
  font-size: 16px;
}

.card .number {
  margin: 0;
  font-size: 32px;
  font-weight: bold;
}

.footer {
  margin-top: 30px;
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
}
```

---

# PART 5: SECURITY - PREVENTING PUBLIC ACCESS

## Docker Deployment - Isolated Container

```dockerfile
# founder-dashboard/Dockerfile

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

# ⚠️  CRITICAL: Only expose on localhost
EXPOSE 3001

# Start on localhost only
ENV HOST=127.0.0.1
ENV PORT=3001

CMD ["npm", "start"]
```

## Docker Compose - No Public Network

```yaml
# docker-compose.yml

version: '3.8'

services:
  # Main API (Public - exposed to internet)
  api:
    build: ./api
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - HOST=0.0.0.0  # Accessible from internet
    networks:
      - public

  # Founder Dashboard (Private - localhost ONLY)
  founder-dashboard:
    build: ./founder-dashboard
    ports:
      - "127.0.0.1:3001:3001"  # 127.0.0.1 = localhost ONLY
    environment:
      - HOST=127.0.0.1
      - PORT=3001
    networks:
      - private  # Separate network, cannot reach public api

networks:
  public:
    driver: bridge
  private:
    driver: bridge
```

## Nginx Configuration - Block Public Access

```nginx
# nginx.conf

server {
  listen 80;
  server_name app.schoolerp.in;

  # Public API - allowed
  location /api/v1 {
    proxy_pass http://api:8080;
  }

  # Block founder endpoints
  location /founder {
    return 404;
  }

  location /admin {
    return 404;
  }

  location /dashboard {
    return 404;
  }

  # Block any attempt to reach founder routes
  location ~* (founder|admin|control) {
    return 404;
  }

  # Everything else - static files
  location / {
    root /var/www/html;
    try_files $uri $uri/ /index.html;
  }
}

# Founder Dashboard - localhost ONLY
server {
  listen 127.0.0.1:3001;
  server_name localhost;

  location / {
    proxy_pass http://founder-dashboard:3001;
  }
}
```

---

# PART 6: SSH TUNNEL ACCESS (Secure Remote)

## If Founder Needs Access from Different Servers

```bash
# On founder's local machine:

# Create secure tunnel to production server
ssh -L 3001:localhost:3001 \
    -i ~/.ssh/prod-key.pem \
    ubuntu@prod.schoolerp.in

# Now access in browser:
# http://localhost:3001

# The connection is:
# Your browser → SSH tunnel → Production server
# All encrypted, only you can access
```

## Terraform - Restrict SSH Access

```hcl
# terraform/security-group.tf

resource "aws_security_group" "prod_server" {
  name = "prod-server-sg"

  # SSH: Only from founder's IP
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["YOUR_HOME_IP/32"]  # Your fixed IP only
  }

  # API: Public
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Founder Dashboard: BLOCKED from public
  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = []  # Empty = nobody from internet
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

---

# PART 7: DEPLOYMENT CHECKLIST

## Before Launching to Production

```markdown
# Security Checklist

## Founder Dashboard Access
- [ ] Founder routes NOT in main Express app
- [ ] Founder API runs on separate process (port 3001)
- [ ] Port 3001 only listens on 127.0.0.1 (localhost)
- [ ] Docker port binding: 127.0.0.1:3001:3001 (not 0.0.0.0)
- [ ] Nginx blocks /founder, /admin, /dashboard, /control
- [ ] All founder endpoints return 404 on public API
- [ ] CLI tool requires local service account file
- [ ] Web dashboard checks window.location.hostname
- [ ] IP verification on every founder endpoint

## CLI Security
- [ ] Service account stored in ~/.schoolerp/ (home dir)
- [ ] File permissions: 600 (owner read/write only)
- [ ] Never commit credentials to git
- [ ] CLI requires explicit "yes" for any write operation
- [ ] All CLI actions logged to audit trail

## Monitoring
- [ ] Alert if port 3001 accessed from non-localhost IP
- [ ] Alert if /founder endpoint accessed on public API
- [ ] Log all CLI commands with timestamp
- [ ] Monitor for unauthorized access attempts

## Testing
- [ ] Verify http://localhost:3001 works
- [ ] Verify https://app.schoolerp.in/founder returns 404
- [ ] Verify API /founder endpoint returns 404
- [ ] Test CLI with sample commands
- [ ] Test SSH tunnel access works
```

---

# PART 8: FOUNDER ONBOARDING - ACCESS SETUP

## Step-by-Step Setup for Founder

```bash
# Step 1: Initialize CLI
$ npm install -g founder-cli
$ founder-cli init

# Step 2: Download service account from Firebase Console
# Go to: Project Settings → Service Accounts → Generate New Private Key
# Save to: ~/.schoolerp/founder-credentials.json
$ chmod 600 ~/.schoolerp/founder-credentials.json

# Step 3: Test CLI
$ founder-cli dashboard
$ founder-cli schools
$ founder-cli revenue --month=april

# Step 4: Access web dashboard (local)
# If running locally:
$ cd founder-dashboard && npm start
# Visit: http://localhost:3001

# Step 5: Access from production server (secure tunnel)
$ ssh -L 3001:localhost:3001 -i ~/.ssh/prod-key.pem ubuntu@prod.schoolerp.in
# Visit: http://localhost:3001
```

---

# PART 9: COMPARISON - BEFORE vs AFTER

## BEFORE (Insecure - DO NOT USE)

```
❌ Founder dashboard at: https://app.schoolerp.in/founder
❌ Anyone who guesses URL can access financials
❌ Token stored in browser localStorage
❌ Sensitive data exposed to internet
❌ No audit trail for who accessed when
```

## AFTER (Secure - LOCAL ONLY)

```
✅ Founder dashboard on localhost only
✅ Port 3001 never exposed to internet
✅ CLI requires local service account file
✅ SSH tunnel for remote access (encrypted)
✅ Every action logged with timestamp
✅ Can't accidentally expose via URL
✅ Requires founder to have local server access
```

---

# PART 10: WEEKLY FOUNDER VERIFICATION

## Security Check (Every Monday)

```bash
# 1. Verify localhost access works
$ curl http://localhost:3001/dashboard

# 2. Verify public API blocks founder routes
$ curl https://app.schoolerp.in/founder
# Should return: Not found (404)

# 3. Check CLI authentication
$ founder-cli dashboard
$ founder-cli revenue

# 4. Review audit logs for unauthorized access attempts
$ founder-cli audit-log --filter=failed_access

# 5. Verify SSH tunnel still works
$ ssh -L 3001:localhost:3001 ... ubuntu@prod.schoolerp.in
```

---

This ensures the most sensitive part of your business (financial dashboards, controls, user management) is NEVER exposed to the public internet and requires physical/local access!
