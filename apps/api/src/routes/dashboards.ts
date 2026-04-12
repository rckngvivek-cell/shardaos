/**
 * Data Agent - Phase 1 Dashboard Endpoints
 * These are the 4 core dashboard metrics endpoints
 * 
 * GET /api/analytics/dashboards/metrics - All metrics
 * GET /api/analytics/dashboards/active-users - Active users
 * GET /api/analytics/dashboards/revenue - Revenue  
 * GET /api/analytics/dashboards/errors - Error rate
 */

import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';

const router = Router();

/**
 * GET /api/analytics/dashboards/metrics
 * Core 4 dashboard metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await analyticsService.getAllDashboardMetrics();
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch metrics',
    });
  }
});

/**
 * GET /api/analytics/dashboards/active-users
 * Active users trend (last 30 days)
 */
router.get('/active-users', async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.executeDashboardQuery('activeUsers');
    res.json({
      success: true,
      metric: 'Active Users',
      data,
      period: '30_days',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch active users',
    });
  }
});

/**
 * GET /api/analytics/dashboards/revenue
 * Revenue trend (last 30 days)
 */
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.executeDashboardQuery('revenueTrend');
    res.json({
      success: true,
      metric: 'Revenue Trend',
      data,
      period: '30_days',
      currency: 'INR',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch revenue',
    });
  }
});

/**
 * GET /api/analytics/dashboards/errors
 * Error rate trend (last 30 days)
 */
router.get('/errors', async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.executeDashboardQuery('errorRate');
    res.json({
      success: true,
      metric: 'Error Rate',
      data,
      period: '30_days',
      unit: 'percent',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch error rate',
    });
  }
});

/**
 * GET /api/analytics/dashboards/reports
 * Reports generated trend
 */
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.executeDashboardQuery('reportsGenerated');
    res.json({
      success: true,
      metric: 'Reports Generated',
      data,
      period: '30_days',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reports',
    });
  }
});

/**
 * GET /api/analytics/dashboards/health
 * Get dashboard system health status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await analyticsService.verify();
    const status = health.healthy ? 'healthy' : 'degraded';
    res.json({
      status,
      eventCount: health.eventCount,
      pipeline: 'bigquery_sync_active',
      lastUpdated: health.timestamp,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Pipeline error',
    });
  }
});

export default router;
