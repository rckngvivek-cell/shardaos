# HEALTH CHECK ENDPOINT IMPLEMENTATION - WEEK 6

**Purpose:** Essential for load balancer health checking, monitoring, and SLO tracking  
**Scope:** Backend API  
**Priority:** CRITICAL - All services must implement  

---

## 📋 HEALTH CHECK ENDPOINT SPECIFICATION

### Endpoint Definition
```
Method: GET
Path: /health
Port: 8080 (or default app port)
Protocol: HTTP (or HTTPS via load balancer)
Response Format: JSON
Response Time Target: <50ms
```

### Response Codes
```
200 OK        - Service is fully healthy
503 Service Unavailable - Service degraded
```

### Health Status Response (200 OK)

```json
{
  "status": "healthy",
  "timestamp": "2026-04-14T10:30:45Z",
  "uptime_seconds": 3600,
  "version": "1.0.0",
  "region": "asia-south1",
  "checks": {
    "database": {
      "status": "healthy",
      "latency_ms": 12,
      "last_check": "2026-04-14T10:30:40Z"
    },
    "cache": {
      "status": "healthy",
      "latency_ms": 5,
      "last_check": "2026-04-14T10:30:42Z"
    },
    "external_services": {
      "status": "healthy",
      "services_checked": 3,
      "services_healthy": 3,
      "last_check": "2026-04-14T10:30:35Z"
    }
  },
  "metrics": {
    "memory_usage_mb": 512,
    "memory_limit_mb": 2048,
    "cpu_cores": 2,
    "goroutines": 45,
    "open_connections": 12
  }
}
```

### Unhealthy Status Response (503 Service Unavailable)

```json
{
  "status": "unhealthy",
  "timestamp": "2026-04-14T10:35:45Z",
  "uptime_seconds": 3900,
  "version": "1.0.0",
  "region": "asia-south1",
  "checks": {
    "database": {
      "status": "unhealthy",
      "error": "Connection timeout after 5000ms",
      "last_check": "2026-04-14T10:35:40Z"
    },
    "cache": {
      "status": "healthy",
      "latency_ms": 5,
      "last_check": "2026-04-14T10:35:42Z"
    },
    "external_services": {
      "status": "degraded",
      "services_checked": 3,
      "services_healthy": 2,
      "failed_service": "Payment Gateway",
      "last_check": "2026-04-14T10:35:35Z"
    }
  },
  "metrics": {
    "memory_usage_mb": 1900,
    "memory_limit_mb": 2048,
    "cpu_cores": 2,
    "goroutines": 450,
    "open_connections": 198
  }
}
```

---

## 🔧 IMPLEMENTATION GUIDE

### Node.js/Express Backend

```javascript
// backend/routes/health.js

import express from 'express';
import { db } from '../firebase-config.js';
import { checkExternalServices } from '../services/external-services.js';

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    version: process.env.APP_VERSION || '1.0.0',
    region: process.env.REGION || 'unknown',
    checks: {
      database: {
        status: 'checking',
        latency_ms: 0,
        last_check: new Date().toISOString()
      },
      cache: {
        status: 'checking',
        latency_ms: 0,
        last_check: new Date().toISOString()
      },
      external_services: {
        status: 'checking',
        services_checked: 0,
        services_healthy: 0,
        last_check: new Date().toISOString()
      }
    },
    metrics: {
      memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      memory_limit_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      cpu_cores: require('os').cpus().length,
      goroutines: 0, // JavaScript doesn't have goroutines like Go
      open_connections: 0
    }
  };

  let overallStatus = 'healthy';

  // Check 1: Database connectivity
  try {
    const start = Date.now();
    await db.collection('health-check').doc('test').get();
    const latency = Date.now() - start;
    
    healthCheck.checks.database = {
      status: latency < 100 ? 'healthy' : 'degraded',
      latency_ms: latency,
      last_check: new Date().toISOString()
    };

    if (latency > 100) {
      overallStatus = 'degraded';
    }
  } catch (error) {
    healthCheck.checks.database = {
      status: 'unhealthy',
      error: error.message,
      last_check: new Date().toISOString()
    };
    overallStatus = 'unhealthy';
  }

  // Check 2: Cache (if using Redis)
  try {
    const start = Date.now();
    // await redisClient.ping();
    const latency = Date.now() - start;
    
    healthCheck.checks.cache = {
      status: latency < 50 ? 'healthy' : 'degraded',
      latency_ms: latency,
      last_check: new Date().toISOString()
    };
  } catch (error) {
    healthCheck.checks.cache = {
      status: 'unhealthy',
      error: error.message,
      last_check: new Date().toISOString()
    };
  }

  // Check 3: External services
  try {
    const externalResults = await checkExternalServices();
    
    healthCheck.checks.external_services = {
      status: externalResults.healthy === externalResults.total ? 'healthy' : 'degraded',
      services_checked: externalResults.total,
      services_healthy: externalResults.healthy,
      failed_services: externalResults.failed,
      last_check: new Date().toISOString()
    };

    if (externalResults.healthy < externalResults.total) {
      overallStatus = 'degraded';
    }
  } catch (error) {
    healthCheck.checks.external_services = {
      status: 'error',
      error: error.message,
      last_check: new Date().toISOString()
    };
  }

  healthCheck.status = overallStatus;

  // Return appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// Extended health check endpoint (for detailed metrics)
router.get('/health/detailed', async (req, res) => {
  // Same as above but with additional metrics
  res.json({ /* health check data */ });
});

// Ready check endpoint (k8s style)
router.get('/ready', async (req, res) => {
  try {
    // Check if service is ready to accept traffic
    // Similar to /health but stricter checks
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, error: error.message });
  }
});

// Startup probe endpoint (gradual startup)
router.get('/startup', async (req, res) => {
  try {
    // Check if service has completed initialization
    const isPingable = await db.collection('health-check').doc('test').get();
    res.status(200).json({ started: true });
  } catch (error) {
    res.status(503).json({ started: false, error: error.message });
  }
});

export default router;
```

### Python/Flask Backend

```python
# backend/routes/health.py

from flask import Blueprint, jsonify, current_app
from datetime import datetime
import os
import time
from flask_sqlalchemy import SQLAlchemy

def create_health_blueprint(db):
    health_bp = Blueprint('health', __name__)
    
    @health_bp.route('/health', methods=['GET'])
    def health_check():
        health_check = {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'uptime_seconds': int(time.time() - current_app.config.get('START_TIME', time.time())),
            'version': os.getenv('APP_VERSION', '1.0.0'),
            'region': os.getenv('REGION', 'unknown'),
            'checks': {
                'database': {
                    'status': 'checking',
                    'latency_ms': 0,
                    'last_check': datetime.utcnow().isoformat() + 'Z'
                },
                'cache': {
                    'status': 'checking',
                    'latency_ms': 0,
                    'last_check': datetime.utcnow().isoformat() + 'Z'
                },
                'external_services': {
                    'status': 'checking',
                    'services_checked': 0,
                    'services_healthy': 0,
                    'last_check': datetime.utcnow().isoformat() + 'Z'
                }
            },
            'metrics': {
                'memory_usage_mb': 0,
                'memory_limit_mb': 2048,
                'cpu_cores': 2,
                'open_connections': 0
            }
        }
        
        overall_status = 'healthy'
        
        # Check database
        try:
            start = time.time()
            db.session.execute('SELECT 1')
            db.session.commit()
            latency = int((time.time() - start) * 1000)
            
            health_check['checks']['database'] = {
                'status': 'healthy' if latency < 100 else 'degraded',
                'latency_ms': latency,
                'last_check': datetime.utcnow().isoformat() + 'Z'
            }
            
            if latency > 100:
                overall_status = 'degraded'
                
        except Exception as e:
            health_check['checks']['database'] = {
                'status': 'unhealthy',
                'error': str(e),
                'last_check': datetime.utcnow().isoformat() + 'Z'
            }
            overall_status = 'unhealthy'
        
        health_check['status'] = overall_status
        status_code = 200 if overall_status == 'healthy' else 503
        
        return jsonify(health_check), status_code
    
    return health_bp
```

### Go Backend

```go
// backend/handlers/health.go

package handlers

import (
	"encoding/json"
	"net/http"
	"runtime"
	"time"
)

type HealthCheck struct {
	Status    string         `json:"status"`
	Timestamp string         `json:"timestamp"`
	Uptime    int64          `json:"uptime_seconds"`
	Version   string         `json:"version"`
	Region    string         `json:"region"`
	Checks    HealthChecks   `json:"checks"`
	Metrics   HealthMetrics  `json:"metrics"`
}

type HealthChecks struct {
	Database          HealthDetail `json:"database"`
	Cache             HealthDetail `json:"cache"`
	ExternalServices  HealthDetail `json:"external_services"`
}

type HealthDetail struct {
	Status    string `json:"status"`
	LatencyMs int64  `json:"latency_ms,omitempty"`
	Error     string `json:"error,omitempty"`
	LastCheck string `json:"last_check"`
}

type HealthMetrics struct {
	MemoryUsageMB  int64 `json:"memory_usage_mb"`
	MemoryLimitMB  int64 `json:"memory_limit_mb"`
	CPUCores       int   `json:"cpu_cores"`
	Goroutines     int   `json:"goroutines"`
	OpenConnections int  `json:"open_connections"`
}

var startTime = time.Now()

func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	healthCheck := HealthCheck{
		Status:    "healthy",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Uptime:    int64(time.Since(startTime).Seconds()),
		Version:   os.Getenv("APP_VERSION"),
		Region:    os.Getenv("REGION"),
		Checks: HealthChecks{
			Database:         {Status: "checking", LastCheck: time.Now().UTC().Format(time.RFC3339)},
			Cache:            {Status: "checking", LastCheck: time.Now().UTC().Format(time.RFC3339)},
			ExternalServices: {Status: "checking", LastCheck: time.Now().UTC().Format(time.RFC3339)},
		},
		Metrics: HealthMetrics{
			MemoryUsageMB:  int64(m.Alloc / 1024 / 1024),
			MemoryLimitMB:  2048,
			CPUCores:       runtime.NumCPU(),
			Goroutines:     runtime.NumGoroutine(),
		},
	}

	// Check database
	dbStart := time.Now()
	err := db.Ping(r.Context())
	dbLatency := time.Since(dbStart).Milliseconds()

	if err != nil {
		healthCheck.Checks.Database = HealthDetail{
			Status:    "unhealthy",
			Error:     err.Error(),
			LastCheck: time.Now().UTC().Format(time.RFC3339),
		}
		healthCheck.Status = "unhealthy"
	} else {
		healthCheck.Checks.Database = HealthDetail{
			Status:    "healthy",
			LatencyMs: dbLatency,
			LastCheck: time.Now().UTC().Format(time.RFC3339),
		}
	}

	statusCode := http.StatusOK
	if healthCheck.Status != "healthy" {
		statusCode = http.StatusServiceUnavailable
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(healthCheck)
}
```

---

## 📊 LOAD BALANCER HEALTH CHECK CONFIGURATION

```hcl
# Terraform: terraform/autoscaling_healthcheck.tf

resource "google_compute_health_check" "https_health_check" {
  name                = "school-erp-https-health-check"
  timeout_sec         = 5
  check_interval_sec  = 10
  unhealthy_threshold = 3
  healthy_threshold   = 2

  https_health_check {
    port               = "443"
    request_path       = "/api/v1/health"
    proxy_header       = "NONE"
    response           = "{\"status\":\"healthy\"}"
  }

  log_config {
    enable = false  # Disable logging to reduce noise
  }
}
```

---

## 🧪 TESTING HEALTH CHECK ENDPOINT

### Manual Testing
```bash
# Simple curl test
curl -X GET https://api.schoolerp.com/health

# With response headers
curl -v https://api.schoolerp.com/health

# With specific region
curl -X GET https://api.schoolerp.com/health \
  -H "X-Region: asia-south1"

# Test from Cloud Shell
gcloud run services describe deerflow-backend --region asia-south1 | grep containerPort
# Then curl internal service endpoint
```

### k6 Load Test with Health Checks
```javascript
export default function() {
  const res = http.get(`${BASE_URL}/health`, {
    timeout: '5s',
  });

  check(res, {
    'Health check status 200': (r) => r.status === 200,
    'Health response time < 100ms': (r) => r.timings.duration < 100,
    'Database check healthy': (r) => {
      const body = JSON.parse(r.body);
      return body.checks.database.status === 'healthy';
    },
  });
}
```

### Cloud Monitoring Query
```kuery
resource.type="cloud_run_revision"
AND metric.type="run.googleapis.com/request_count"
AND metric.response_code="200"
AND url_path="/api/v1/health"
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] `/health` endpoint implemented in all services
- [ ] Response time <50ms under normal load
- [ ] All health checks (database, cache, external) implemented
- [ ] Returns 200 OK when healthy
- [ ] Returns 503 when unhealthy
- [ ] Tested with load test (verified returns correctly)
- [ ] Terraform health check configured
- [ ] Load balancer configured to use `/health` endpoint
- [ ] Monitoring dashboard displays health metrics
- [ ] Alert triggers when health check fails
- [ ] Documented in API documentation
- [ ] Available in all 3 regions (asia-south1, us-central1, europe-west1)

---

**Created:** April 9, 2026  
**Effective:** April 14, 2026 (Monday deployment)  
**Version:** 1.0 - Week 6 Launch

