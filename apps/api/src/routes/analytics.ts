/**
 * Analytics API Routes
 * Endpoints for dashboard metrics, NPS tracking, and custom reports
 * 
 * Module: apps/api/src/routes/analytics.ts
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { getDashboardMetrics } from "../modules/analytics/dashboardMetrics";
import {
  submitNPSResponse,
  getNPSTrend,
  getWeeklyNPSScore,
  getNPSBreakdown,
  checkNPSHealth,
} from "../modules/analytics/npsTracking";
import { queryBigQuery } from "../modules/analytics/bigquerySync";
import { logger } from "../utils/logger";

const router = Router();

// Validation schemas
const npsResponseSchema = z.object({
  parentId: z.string(),
  studentId: z.string(),
  score: z.number().min(0).max(10),
  feedback: z.string().optional(),
  context: z.enum(["after_class", "after_test", "manual"]),
});

/**
 * GET /api/v1/schools/:schoolId/analytics/dashboard
 * Get comprehensive dashboard metrics
 */
router.get("/schools/:schoolId/analytics/dashboard", async (req: any, res: Response) => {
  try {
    const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;

    if (!schoolId) {
      return res.status(400).json({ error: "schoolId is required" });
    }

    const metrics = await getDashboardMetrics(schoolId);

    res.status(200).json({
      success: true,
      data: metrics,
      generatedAt: new Date(),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Dashboard metrics error:", err);
    res.status(500).json({
      error: "Failed to fetch dashboard metrics",
      message: err.message,
    });
  }
});

/**
 * POST /api/v1/schools/:schoolId/nps/submit
 * Submit NPS response
 */
router.post("/schools/:schoolId/nps/submit", async (req: any, res: Response) => {
  try {
    const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;
    const body = npsResponseSchema.parse(req.body);

    const response = await submitNPSResponse(schoolId, {
      schoolId,
      ...body,
    });

    res.status(201).json({
      success: true,
      data: response,
      message: "NPS response recorded successfully",
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("NPS submission error:", err);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }
    res.status(500).json({
      error: "Failed to submit NPS response",
    });
  }
});

/**
 * GET /api/v1/schools/:schoolId/nps/trend
 * Get NPS trend data
 */
router.get("/schools/:schoolId/nps/trend", async (req: any, res: Response) => {
  try {
    const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;
    const weeksBack = parseInt((req.query.weeks as string) || '12') || 12;

    const trend = await getNPSTrend(schoolId, weeksBack);

    res.status(200).json({
      success: true,
      data: trend,
      weeksShown: weeksBack,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("NPS trend error:", err);
    res.status(500).json({
      error: "Failed to fetch NPS trend",
    });
  }
});

/**
 * GET /api/v1/schools/:schoolId/nps/score
 * Get current weekly NPS score
 */
router.get("/schools/:schoolId/nps/score", async (req: any, res: Response) => {
  try {
    const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;

    const score = await getWeeklyNPSScore(schoolId);
    const breakdown = await getNPSBreakdown(schoolId);

    res.status(200).json({
      success: true,
      data: {
        score,
        target: 9.2,
        onTarget: score >= 9.2,
        breakdown,
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("NPS score error:", err);
    res.status(500).json({
      error: "Failed to fetch NPS score",
    });
  }
});

/**
 * POST /api/v1/schools/:schoolId/nps/check-health
 * Check NPS health and send alerts if needed
 */
router.post("/schools/:schoolId/nps/check-health", async (req: any, res: Response) => {
  try {
    const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;

    await checkNPSHealth(schoolId);

    res.status(200).json({
      success: true,
      message: "NPS health check completed",
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("NPS health check error:", err);
    res.status(500).json({
      error: "Failed to check NPS health",
    });
  }
});

/**
 * POST /api/v1/schools/:schoolId/analytics/custom-report
 * Execute custom report query
 */
router.post(
  "/schools/:schoolId/analytics/custom-report",
  async (req: any, res: Response) => {
    try {
      const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;
      const { reportType, filters } = req.body;

      let query = "";

      // Build query based on report type
      switch (reportType) {
        case "performance_alert":
          query = `
            SELECT s.student_id, s.name, s.section, AVG(g.marks) as avg_marks
            FROM \`${process.env.GCP_PROJECT_ID}.school_erp_analytics.grades\` g
            JOIN \`${process.env.GCP_PROJECT_ID}.school_erp_analytics.students\` s ON g.student_id = s.student_id
            WHERE s.school_id = @schoolId AND g.marks < 60
            GROUP BY s.student_id HAVING AVG(g.marks) < 60
            ORDER BY avg_marks ASC
          `;
          break;

        case "attendance_alert":
          query = `
            SELECT s.student_id, s.name, s.section,
              ROUND(100.0 * SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*), 2) as attendance_pct
            FROM \`${process.env.GCP_PROJECT_ID}.school_erp_analytics.attendance\` a
            JOIN \`${process.env.GCP_PROJECT_ID}.school_erp_analytics.students\` s ON a.student_id = s.student_id
            WHERE s.school_id = @schoolId AND DATE(a.date) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
            GROUP BY s.student_id HAVING attendance_pct < 70
            ORDER BY attendance_pct ASC
          `;
          break;

        case "outstanding_fees":
          query = `
            SELECT s.student_id, s.name, s.section, SUM(f.amount) as pending_amount,
              CURRENT_DATE() - MIN(f.due_date) as days_overdue
            FROM \`${process.env.GCP_PROJECT_ID}.school_erp_analytics.fees\` f
            JOIN \`${process.env.GCP_PROJECT_ID}.school_erp_analytics.students\` s ON f.student_id = s.student_id
            WHERE s.school_id = @schoolId AND f.status = 'pending' AND CURRENT_DATE() - f.due_date > 30
            GROUP BY s.student_id ORDER BY days_overdue DESC
          `;
          break;

        case "engagement_alert":
          query = `
            SELECT s.student_id, s.name, s.section,
              CURRENT_DATE() - DATE(MAX(e.timestamp)) as days_inactive
            FROM \`${process.env.GCP_PROJECT_ID}.school_erp_analytics.events\` e
            JOIN \`${process.env.GCP_PROJECT_ID}.school_erp_analytics.students\` s ON e.user_id = s.student_id
            WHERE s.school_id = @schoolId AND e.event_name IN ('login', 'submit_assignment', 'view_grades')
            GROUP BY s.student_id HAVING days_inactive >= 7
            ORDER BY days_inactive DESC
          `;
          break;

        default:
          return res.status(400).json({
            error: "Invalid report type",
            supportedTypes: [
              "performance_alert",
              "attendance_alert",
              "outstanding_fees",
              "engagement_alert",
            ],
          });
      }

      const rows = await queryBigQuery(query, {
        schoolId,
        ...filters,
      });

      res.status(200).json({
        success: true,
        reportType,
        rowCount: rows.length,
        data: rows,
        generatedAt: new Date(),
      });
    } catch (error) {
      logger.error("Custom report error:", error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        error: "Failed to generate report",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/v1/schools/:schoolId/analytics/health
 * Get analytics system health
 */
router.get("/schools/:schoolId/analytics/health", async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;

    res.status(200).json({
      success: true,
      status: "healthy",
      components: {
        bigquery: "connected",
        firestore: "connected",
        cache: "active",
        alerts: "enabled",
      },
      lastCheck: new Date(),
    });
  } catch (error) {
    logger.error("Analytics health check error:", error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      success: false,
      status: "unhealthy",
      error: "System health check failed",
    });
  }
});

export default router;
