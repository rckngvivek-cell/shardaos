/**
 * NPS (Net Promoter Score) Tracking Service
 * Collects and analyzes parent satisfaction metrics
 * 
 * Module: apps/api/src/modules/analytics/npsTracking.ts
 */

import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../utils/logger";
import { queryBigQuery } from "./bigquerySync";
import { alertService } from "../../services/alertService";

const db = getFirestore();

export interface NPSResponse {
  responseId: string;
  schoolId: string;
  parentId: string;
  studentId: string;
  score: number; // 0-10
  feedback?: string;
  context: "after_class" | "after_test" | "manual";
  responseDate: Date;
  createdAt: Timestamp;
}

export interface NPSTrend {
  week: string;
  avgScore: number;
  responseCount: number;
  promoters: number;
  passives: number;
  detractors: number;
  npsScore: number;
}

/**
 * Submit NPS response from parent
 */
export const submitNPSResponse = async (
  schoolId: string,
  data: Omit<NPSResponse, "responseId" | "createdAt" | "responseDate">
): Promise<NPSResponse> => {
  try {
    // Validate score
    if (data.score < 0 || data.score > 10) {
      throw new Error("NPS score must be between 0 and 10");
    }

    const responseId = uuidv4();
    const response: NPSResponse = {
      ...data,
      responseId,
      responseDate: new Date(),
      createdAt: Timestamp.now(),
    };

    // Save to Firestore
    await db
      .collection("schools")
      .doc(schoolId)
      .collection("nps_responses")
      .doc(responseId)
      .set(response);

    logger.info(
      `NPS response submitted: School ${schoolId}, Score: ${data.score}`
    );

    // Check if score is low and send alert
    if (data.score < 7) {
      await alertService.sendAlert({
        severity: "medium",
        service: "nps-tracking",
        message: `Low NPS score (${data.score}) detected in school ${schoolId}`,
        context: {
          type: "nps_detractor",
          schoolId,
          score: data.score,
          feedback: data.feedback,
        },
      });
    }

    // Update NPS trend cache
    await updateNPSTrendCache(schoolId);

    return response;
  } catch (error) {
    logger.error("Failed to submit NPS response:", error);
    throw error;
  }
};

/**
 * Get NPS trend for the past N weeks
 */
export const getNPSTrend = async (
  schoolId: string,
  weeksBack: number = 12
): Promise<NPSTrend[]> => {
  try {
    const query = `
      SELECT
        DATE_TRUNC(response_date, WEEK) as week,
        ROUND(AVG(score), 2) as avg_score,
        COUNT(*) as response_count,
        COUNTIF(score >= 9) as promoters,
        COUNTIF(score BETWEEN 7 AND 8) as passives,
        COUNTIF(score < 7) as detractors,
        ROUND(100.0 * (COUNTIF(score >= 9) - COUNTIF(score < 7)) / COUNT(*), 2) as nps_score
      FROM \`${process.env.GCP_PROJECT_ID}.school_erp_analytics.nps_responses\`
      WHERE school_id = @schoolId AND response_date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${weeksBack} WEEK)
      GROUP BY week
      ORDER BY week DESC
    `;

    const rows = await queryBigQuery(query, { schoolId });

    return rows.map((row: any) => ({
      week: row.week,
      avgScore: parseFloat(row.avg_score),
      responseCount: parseInt(row.response_count),
      promoters: parseInt(row.promoters),
      passives: parseInt(row.passives),
      detractors: parseInt(row.detractors),
      npsScore: parseFloat(row.nps_score),
    }));
  } catch (error) {
    logger.error("Failed to get NPS trend:", error);
    throw error;
  }
};

/**
 * Get this week's NPS score
 */
export const getWeeklyNPSScore = async (schoolId: string): Promise<number> => {
  try {
    const snapshot = await db
      .collection("schools")
      .doc(schoolId)
      .collection("nps_responses")
      .where("responseDate", ">=", getStartOfWeek())
      .where("responseDate", "<=", getEndOfWeek())
      .get();

    if (snapshot.empty) {
      return 0; // No responses yet
    }

    const scores = snapshot.docs.map((doc) => doc.data().score);
    const promoters = scores.filter((s) => s >= 9).length;
    const detractors = scores.filter((s) => s < 7).length;
    const npsScore = (100 * (promoters - detractors)) / scores.length;

    return Math.round(npsScore * 10) / 10; // Round to 1 decimal
  } catch (error) {
    logger.error("Failed to get weekly NPS score:", error);
    throw error;
  }
};

/**
 * Check NPS health and send alerts if needed
 */
export const checkNPSHealth = async (schoolId: string) => {
  try {
    const weeklyScore = await getWeeklyNPSScore(schoolId);
    const targetScore = 9.2;

    logger.info(
      `NPS Health Check - School: ${schoolId}, Score: ${weeklyScore}, Target: ${targetScore}`
    );

    if (weeklyScore < targetScore && weeklyScore > 0) {
      await alertService.sendAlert({
        severity: "high",
        service: "nps-tracking",
        message: `NPS score below target for school ${schoolId}: ${weeklyScore} vs target ${targetScore}`,
        context: {
          type: "nps_below_target",
          schoolId,
          currentScore: weeklyScore,
          targetScore,
          gap: targetScore - weeklyScore,
          actionItems: [
            "Review recent feedback",
            "Contact low-scoring parents",
            "Investigate root causes",
            "Implement corrective actions",
          ],
        },
      });

      logger.warn(`NPS Alert: School ${schoolId} score ${weeklyScore} < ${targetScore}`);
    }
  } catch (error) {
    logger.error("NPS health check failed:", error);
  }
};

/**
 * Get detailed NPS breakdown
 */
export const getNPSBreakdown = async (
  schoolId: string
): Promise<{
  totalResponses: number;
  avgScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  npsScore: number;
  feedback: string[];
}> => {
  try {
    const snapshot = await db
      .collection("schools")
      .doc(schoolId)
      .collection("nps_responses")
      .where("responseDate", ">=", getStartOfWeek())
      .get();

    const docs = snapshot.docs.map((d) => d.data());
    const scores = docs.map((d) => d.score);
    const promoters = scores.filter((s) => s >= 9).length;
    const passives = scores.filter((s) => s >= 7 && s <= 8).length;
    const detractors = scores.filter((s) => s < 7).length;

    const npsScore = (100 * (promoters - detractors)) / scores.length;
    const feedback = docs
      .filter((d) => d.feedback)
      .map((d) => d.feedback)
      .slice(0, 10); // Top 10 feedback items

    return {
      totalResponses: docs.length,
      avgScore: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
      promoters,
      passives,
      detractors,
      npsScore: Math.round(npsScore * 10) / 10,
      feedback,
    };
  } catch (error) {
    logger.error("Failed to get NPS breakdown:", error);
    throw error;
  }
};

/**
 * Trigger NPS survey for a student/parent
 */
export const triggerNPSSurvey = async (
  schoolId: string,
  studentId: string,
  context: "after_class" | "after_test" | "manual"
) => {
  try {
    // Get student and parent info
    const studentDoc = await db
      .collection("schools")
      .doc(schoolId)
      .collection("students")
      .doc(studentId)
      .get();

    if (!studentDoc.exists) {
      throw new Error(`Student ${studentId} not found`);
    }

    const studentData = studentDoc.data();
    const parentEmail = studentData?.parentEmail;

    if (!parentEmail) {
      logger.warn(`No parent email for student ${studentId}`);
      return;
    }

    // Generate unique survey token
    const surveyToken = uuidv4();
    const surveyUrl = `${process.env.APP_URL}/nps/survey?token=${surveyToken}&student=${studentId}&school=${schoolId}`;

    // Store pending survey
    await db
      .collection("schools")
      .doc(schoolId)
      .collection("nps_surveys_pending")
      .add({
        studentId,
        parentEmail,
        context,
        surveyToken,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
        status: "pending",
      });

    // Send survey email (placeholder - integrate with email service)
    logger.info(`NPS survey triggered for ${studentId} via ${context}`);
    // await sendNPSSurveyEmail(parentEmail, surveyUrl, context);
  } catch (error) {
    logger.error("Failed to trigger NPS survey:", error);
  }
};

/**
 * Update NPS trend cache (called after new response)
 */
async function updateNPSTrendCache(schoolId: string) {
  try {
    const trend = await getNPSTrend(schoolId, 4); // Last 4 weeks

    // Cache in Firestore for quick retrieval
    await db
      .collection("schools")
      .doc(schoolId)
      .collection("analytics")
      .doc("nps_trend")
      .set(
        {
          trend,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
  } catch (error) {
    logger.error("Failed to update NPS trend cache:", error);
  }
}

/**
 * Helper: Get start of current week (Monday)
 */
function getStartOfWeek(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Helper: Get end of current week (Sunday)
 */
function getEndOfWeek(): Date {
  const start = getStartOfWeek();
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export default {
  submitNPSResponse,
  getNPSTrend,
  getWeeklyNPSScore,
  checkNPSHealth,
  getNPSBreakdown,
  triggerNPSSurvey,
};
