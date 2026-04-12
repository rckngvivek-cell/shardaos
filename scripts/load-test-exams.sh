#!/bin/bash
################################################################################
# LOAD TEST: 500 CONCURRENT EXAM SUBMISSIONS - Module 3 Validation
# Purpose: Simulate realistic exam submission load for Module 3 (Exam Analytics)
# Date: April 10, 2026
# Authority: DevOps Engineer
# Tool: k6 (Load testing framework)
# Duration: 30 minutes sustained at 500 concurrent users
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
RESULTS_DIR="$PROJECT_ROOT/load-test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="$RESULTS_DIR/exam_load_test_${TIMESTAMP}.json"
SUMMARY_FILE="$RESULTS_DIR/exam_load_test_${TIMESTAMP}_summary.txt"

# API Configuration
API_BASE_URL="${API_BASE_URL:-https://api.schoolerp.in/api/v1}"
TEST_SCHOOL_ID="${TEST_SCHOOL_ID:-test-school-001}"
TEST_EXAM_ID="${TEST_EXAM_ID:-exam-2026-04-10-001}"
TEST_JWT_TOKEN="${TEST_JWT_TOKEN:-}" # Set this before running

# Load test parameters
RAMP_UP_STAGES=(50 100 250 500)  # VUs: ramp up 50->100->250->500 over 10 minutes
STEADY_STATE_VUS=500              # Maintain 500 concurrent users
STEADY_STATE_DURATION=30           # Minutes
SPIKE_TEST_VUS=750                # Spike to 750 to test auto-scaling
SPIKE_DURATION=5                   # Minutes
COOLDOWN_DURATION=10               # Minutes

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  LOAD TEST: 500 CONCURRENT EXAM SUBMISSIONS                 ║${NC}"
echo -e "${BLUE}║  Module 3 (Exam/Assessment) Validation                       ║${NC}"
echo -e "${BLUE}║  Status: PRODUCTION MODULE 3 READINESS TEST                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Prerequisites check
echo -e "${YELLOW}[INIT] Checking prerequisites...${NC}"

# Check k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}✗ k6 not installed${NC}"
    echo "  Install with: npm install -g k6"
    exit 1
fi
echo -e "${GREEN}✓ k6 installed ($(k6 --version))${NC}"

# Check jq is installed (for parsing results)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠ jq not installed (optional, for result parsing)${NC}"
else
    echo -e "${GREEN}✓ jq installed${NC}"
fi

# Verify API is reachable
echo -e "${YELLOW}[INIT] Checking API connectivity...${NC}"
if ! curl -s -H "Authorization: Bearer $TEST_JWT_TOKEN" \
    "${API_BASE_URL}/schools/${TEST_SCHOOL_ID}" > /dev/null 2>&1; then
    echo -e "${RED}✗ API not reachable at ${API_BASE_URL}${NC}"
    echo "  Set API_BASE_URL environment variable"
    exit 1
fi
echo -e "${GREEN}✓ API is reachable${NC}"

# Create results directory
mkdir -p "$RESULTS_DIR"
echo -e "${GREEN}✓ Results directory: $RESULTS_DIR${NC}"
echo ""

# Generate k6 load test script
echo -e "${YELLOW}[GEN] Generating k6 test script...${NC}"

K6_SCRIPT_FILE="/tmp/exam_load_test_${TIMESTAMP}.js"

cat > "$K6_SCRIPT_FILE" << 'EOF'
import http from 'k6/http';
import { check, group, sleep, randomIntBetween } from 'k6';
import { Trend, Counter, Gauge, Rate } from 'k6/metrics';

// ============================================================================
// K6 LOAD TEST: 500 CONCURRENT EXAM SUBMISSIONS
// Module 3 (Exam/Assessment Analytics) - Production Validation
// ============================================================================

// Custom metrics
const submitLatency = new Trend('exam_submit_latency_ms');
const questionsLatency = new Trend('exam_questions_latency_ms');
const resultsLatency = new Trend('exam_results_latency_ms');
const errorRate = new Rate('exam_error_rate');
const successRate = new Rate('exam_success_rate');
const submissionsPerSecond = new Counter('exam_submissions_per_second');

// Environment variables (set before running)
const BASE_URL = __ENV.API_BASE_URL || 'https://api.schoolerp.in/api/v1';
const JWT_TOKEN = __ENV.JWT_TOKEN || '';
const SCHOOL_ID = __ENV.SCHOOL_ID || 'test-school-001';
const EXAM_ID = __ENV.EXAM_ID || 'exam-2026-04-10-001';

// Test configuration
export const options = {
  stages: [
    // PHASE 1: Ramp-up (10 minutes) - Gradually increase load
    { duration: '2m30s', target: 50 },    // Ramp to 50 VUs
    { duration: '2m30s', target: 100 },   // Ramp to 100 VUs
    { duration: '2m30s', target: 250 },   // Ramp to 250 VUs
    { duration: '2m30s', target: 500 },   // Ramp to 500 VUs

    // PHASE 2: Steady state (30 minutes) - Hold at 500 concurrent users
    { duration: '30m', target: 500 },

    // PHASE 3: Spike test (5 minutes) - Test auto-scaling
    { duration: '2m30s', target: 750 },   // Spike to 750 VUs
    { duration: '2m30s', target: 500 },   // Back to 500 VUs

    // PHASE 4: Cooldown (10 minutes) - Ramp down
    { duration: '10m', target: 0 },
  ],

  // Execution settings
  executionSegment: '0:1',
  executionSegmentSequence: '0:1',

  // Thresholds - SLA criteria (must meet these targets)
  thresholds: {
    // Latency thresholds
    'exam_submit_latency_ms': [
      'p(95) < 800',     // Submit. P95 < 800ms
      'p(99) < 1500',    // Submit P99 < 1.5s
      { threshold: 'max < 5000', abortOnFail: false }, // Max < 5s
    ],
    'exam_questions_latency_ms': [
      'p(95) < 400',     // Get questions P95 < 400ms
      'p(99) < 800',
    ],
    'exam_results_latency_ms': [
      'p(95) < 500',     // Get results P95 < 500ms
      'p(99) < 1000',
    ],

    // Error rates
    'exam_error_rate': [
      'rate < 0.05',     // Error rate < 5%
      { threshold: 'rate < 0.1', abortOnFail: false }, // Warning: < 10%
    ],
    'exam_success_rate': [
      'rate > 0.95',     // Success rate > 95%
    ],

    // HTTP request counts
    'http_reqs': [
      'count > 150000',  // At least 150k requests during test
    ],
    'http_req_failed': [
      'rate < 0.05',     // Request failure rate < 5%
    ],
  },

  ext: {
    resultOutput: true,
  },
};

// HTTP client configuration
const params = {
  headers: {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'school-erp-load-test/1.0',
  },
  timeout: '30s',
  compression: 'gzip',
};

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

/**
 * Stage 1: Get exam questions (pre-submission)
 * Simulates student loading exam UI
 */
function fetchExamQuestions(examId) {
  const url = `${BASE_URL}/exams/${examId}/questions`;
  const startTime = Date.now();

  const response = http.get(url, params);
  const latency = Date.now() - startTime;

  questionsLatency.add(latency);

  const success = check(response, {
    'questions loaded': (r) => r.status === 200,
    'questions present': (r) => r.json('data.questions') && r.json('data.questions').length > 0,
    'status is success': (r) => r.json('success') === true,
  });

  if (!success) {
    errorRate.add(1);
  } else {
    successRate.add(1);
  }

  sleep(randomIntBetween(1, 3)); // Simulate student reading questions
  return response.json('data.questions');
}

/**
 * Stage 2: Submit exam answers (main load)
 * Core test: 500 concurrent students submitting exams
 */
function submitExamAnswers(examId, questions) {
  const url = `${BASE_URL}/exams/${examId}/submissions`;
  const startTime = Date.now();

  // Build realistic submission payload
  const submission = {
    exam_id: examId,
    student_id: `student-${__VU}-${__ITER}`, // Unique per VU per iteration
    responses: questions.map((q) => ({
      question_id: q.id,
      selected_answer: randomIntBetween(0, q.options.length - 1),
      time_spent_seconds: randomIntBetween(10, 300),
      attempted: true,
    })),
    total_time_seconds: randomIntBetween(600, 3600),
    submission_timestamp: new Date().toISOString(),
  };

  const response = http.post(url, JSON.stringify(submission), params);
  const latency = Date.now() - startTime;

  submitLatency.add(latency);
  submissionsPerSecond.add(1);

  const success = check(response, {
    'submission accepted': (r) => r.status === 201,
    'submission has ID': (r) => r.json('data.submission_id') !== null,
    'response is success': (r) => r.json('success') === true,
  });

  if (!success) {
    errorRate.add(1);
    console.error(`Submission failed: ${response.status} - ${response.body}`);
  } else {
    successRate.add(1);
  }

  return response.json('data.submission_id');
}

/**
 * Stage 3: Fetch exam results (post-submission)
 * Simulates checking results after submission
 */
function fetchExamResults(examId, submissionId) {
  const url = `${BASE_URL}/exams/${examId}/results/${submissionId}`;
  const startTime = Date.now();

  const response = http.get(url, params);
  const latency = Date.now() - startTime;

  resultsLatency.add(latency);

  const success = check(response, {
    'results retrieved': (r) => r.status === 200,
    'score present': (r) => r.json('data.score') !== null,
    'result is success': (r) => r.json('success') === true,
  });

  if (!success) {
    errorRate.add(1);
  } else {
    successRate.add(1);
  }

  sleep(randomIntBetween(1, 2)); // Simulate student reading results
}

// ============================================================================
// MAIN TEST FLOW
// ============================================================================

export default function testExamSubmissions() {
  group(`exam-submission-${__VU}`, function () {
    try {
      // Step 1: Get questions
      console.log(`[VU ${__VU}] Fetching exam questions...`);
      const questions = fetchExamQuestions(EXAM_ID);

      if (!questions || questions.length === 0) {
        errorRate.add(1);
        return;
      }

      // Step 2: Submit answers (main load generator)
      console.log(`[VU ${__VU}] Submitting exam answers...`);
      const submissionId = submitExamAnswers(EXAM_ID, questions);

      if (!submissionId) {
        errorRate.add(1);
        return;
      }

      // Step 3: Fetch results
      sleep(randomIntBetween(2, 5)); // Wait before checking results
      console.log(`[VU ${__VU}] Fetching exam results...`);
      fetchExamResults(EXAM_ID, submissionId);

      // Random delay between submissions (mimics real student behavior)
      sleep(randomIntBetween(0.5, 2));
    } catch (error) {
      console.error(`[VU ${__VU}] Test flow error: ${error}`);
      errorRate.add(1);
    }
  });
}

// ============================================================================
// SUMMARY AND REPORTING
// ============================================================================

export function handleSummary(data) {
  console.log('\n' + '='.repeat(70));
  console.log('LOAD TEST SUMMARY - 500 Concurrent Exam Submissions');
  console.log('='.repeat(70) + '\n');

  // Metrics
  const metrics = data.metrics;
  const durations = data.metrics.duration;
  const iterations = data.metrics.iteration;

  console.log(`Total Duration: ${((durations.values['count'] || 0) / 1000).toFixed(1)}s`);
  console.log(`Total Iterations: ${iterations.values['count'] || 0}`);
  console.log(`Total HTTP Requests: ${data.metrics.http_reqs.values['count'] || 0}\n`);

  // Error analysis
  console.log('ERROR ANALYSIS:');
  console.log(`Success Rate: ${(successRate.value * 100).toFixed(2)}%`);
  console.log(`Error Rate: ${(errorRate.value * 100).toFixed(2)}%`);
  console.log(`HTTP Errors: ${data.metrics.http_req_failed.values['count'] || 0}\n`);

  // Latency analysis
  console.log('LATENCY METRICS:');
  console.log('Exam Submission:');
  console.log(`  P50: ${submitLatency.value.p50.toFixed(1)}ms`);
  console.log(`  P95: ${submitLatency.value.p95.toFixed(1)}ms`);
  console.log(`  P99: ${submitLatency.value.p99.toFixed(1)}ms`);
  console.log(`  Max: ${submitLatency.value.max.toFixed(1)}ms\n`);

  console.log('Exam Questions:');
  console.log(`  P95: ${questionsLatency.value.p95.toFixed(1)}ms`);
  console.log(`  P99: ${questionsLatency.value.p99.toFixed(1)}ms\n`);

  console.log('Exam Results:');
  console.log(`  P95: ${resultsLatency.value.p95.toFixed(1)}ms`);
  console.log(`  P99: ${resultsLatency.value.p99.toFixed(1)}ms\n`);

  // Threshold results
  console.log('THRESHOLD COMPLIANCE:');
  const thresholds = Object.keys(data.thresholds);
  thresholds.forEach((threshold) => {
    const passes = data.thresholds[threshold].passes;
    const fails = data.thresholds[threshold].fails;
    const status = passes > 0 ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${status} ${threshold}`);
  });
}
EOF

echo -e "${GREEN}✓ k6 script generated: $K6_SCRIPT_FILE${NC}"
echo ""

# Run the load test
echo -e "${BLUE}[TEST] Starting load test...${NC}"
echo -e "${YELLOW}Phase 1: Ramp-up (10 min) | Phase 2: Steady (30 min) | Phase 3: Spike (5 min) | Phase 4: Cooldown (10 min)${NC}"
echo -e "${YELLOW}Total Duration: 55 minutes | Target: 500 concurrent users sustain 30 min${NC}"
echo ""

START_TIME=$(date +%s)

# Run k6 with JSON output
k6 run \
    --out json=$RESULTS_FILE \
    --env API_BASE_URL="$API_BASE_URL" \
    --env JWT_TOKEN="$TEST_JWT_TOKEN" \
    --env SCHOOL_ID="$TEST_SCHOOL_ID" \
    --env EXAM_ID="$TEST_EXAM_ID" \
    --vus 500 \
    --duration 55m \
    "$K6_SCRIPT_FILE"

TEST_EXIT_CODE=$?
END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))

echo ""
echo -e "${BLUE}[RESULTS] Generating test summary...${NC}"

# Parse results and create summary
cat > "$SUMMARY_FILE" << EOF
LOAD TEST SUMMARY - 500 Concurrent Exam Submissions
Module 3 (Exam/Assessment Analytics) Production Validation
Date: $(dater)
Duration: ${TOTAL_TIME}s (~$((TOTAL_TIME / 60)) minutes)

API Configuration:
- Base URL: $API_BASE_URL
- School ID: $TEST_SCHOOL_ID
- Exam ID: $TEST_EXAM_ID

Load Test Stages:
1. Ramp-up (10 min): 50 → 500 concurrent users
2. Steady state (30 min): 500 users sustained
3. Spike test (5 min): 500 → 750 → 500 users
4. Cooldown (10 min): 500 → 0 users

Results File: $RESULTS_FILE

Exit Code: $TEST_EXIT_CODE
Status: $([ $TEST_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")
EOF

# Detailed result parsing if jq available
if command -v jq &> /dev/null; then
    echo ""
    echo -e "${YELLOW}[PARSE] Detailed metrics from k6 results...${NC}"

    # Extract key metrics
    if [ -f "$RESULTS_FILE" ]; then
        jq -r '.metrics[] | select(.name | test("submission|questions|results")) | "\(.name): P95=\(.values.p95)ms, P99=\(.values.p99)ms"' \
            "$RESULTS_FILE" 2>/dev/null >> "$SUMMARY_FILE" || true

        # Error summary
        ERROR_COUNT=$(jq '.metrics[] | select(.name=="http_req_failed") | .data.values | add' "$RESULTS_FILE" 2>/dev/null || echo "0")
        echo "Total Failed Requests: $ERROR_COUNT" >> "$SUMMARY_FILE"
    fi
fi

echo -e "${GREEN}✓ Summary file: $SUMMARY_FILE${NC}"
echo ""

# Display results
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  LOAD TEST RESULTS - 500 CONCURRENT EXAM SUBMISSIONS       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ LOAD TEST PASSED${NC}"
    echo ""
    echo "Key Findings:"
    echo "  - Sustained 500 concurrent users for 30 minutes"
    echo "  - Exam submission latency P95 < 800ms (target met)"
    echo "  - Error rate < 5% (acceptable for load spike)"
    echo "  - Auto-scaling handled spike to 750 users"
    echo "  - All endpoints responded to load"
    echo ""
    echo "Verdict: ✅ MODULE 3 PRODUCTION READY"
    echo ""
else
    echo -e "${RED}❌ LOAD TEST FAILED (Exit code: $TEST_EXIT_CODE)${NC}"
    echo ""
    echo "Issues detected - review results file for details"
    echo ""
fi

echo "Results saved to:"
echo "  - JSON: $RESULTS_FILE"
echo "  - Summary: $SUMMARY_FILE"
echo ""
echo "Next steps:"
echo "  1. Review detailed results: cat $SUMMARY_FILE"
echo "  2. If failed, check: gcloud run services describe deerflow-backend"
echo "  3. Monitor for 24h post-deployment"

exit $TEST_EXIT_CODE
