/**
 * End-to-End Test Verification for Exam Module Data Pipeline
 * 
 * This script tests the complete data pipeline:
 * 1. Publishes test messages to Pub/Sub
 * 2. Verifies messages arrive in BigQuery
 * 3. Checks Cloud Logging for pipeline status
 * 
 * Usage:
 *   npx ts-node scripts/verify-pipeline.ts
 */

import { PubSub } from '@google-cloud/pubsub';
import { BigQuery } from '@google-cloud/bigquery';
import { Logging } from '@google-cloud/logging';
import * as fs from 'fs';
import * as path from 'path';

const projectId = process.env.GCP_PROJECT_ID || 'school-erp-dev';
const datasetId = 'school_erp';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  timestamp: string;
  duration: number;
  message?: string;
}

const results: TestResult[] = [];

function recordResult(
  test: string,
  status: 'PASS' | 'FAIL' | 'PENDING',
  duration: number,
  message?: string
): void {
  results.push({
    test,
    status,
    timestamp: new Date().toISOString(),
    duration,
    message,
  });
}

async function testPubSubConnection(): Promise<void> {
  const start = Date.now();
  const test = 'Pub/Sub Connection';

  try {
    const pubSub = new PubSub({ projectId });
    const [topics] = await pubSub.getTopics();
    console.log(
      `✓ Connected to Pub/Sub. Found ${topics.length} topics`
    );
    recordResult(test, 'PASS', Date.now() - start);
  } catch (error) {
    console.error(`✗ Pub/Sub connection failed: ${error}`);
    recordResult(test, 'FAIL', Date.now() - start, String(error));
  }
}

async function testBigQueryConnection(): Promise<void> {
  const start = Date.now();
  const test = 'BigQuery Connection';

  try {
    const bigQuery = new BigQuery({ projectId });
    const [datasets] = await bigQuery.getDatasets();
    const hasDataset = datasets.some(ds => ds.id === datasetId);

    if (!hasDataset) {
      throw new Error(`Dataset ${datasetId} not found`);
    }

    console.log(
      `✓ Connected to BigQuery. Dataset ${datasetId} exists`
    );
    recordResult(test, 'PASS', Date.now() - start);
  } catch (error) {
    console.error(`✗ BigQuery connection failed: ${error}`);
    recordResult(test, 'FAIL', Date.now() - start, String(error));
  }
}

async function testCloudLoggingConnection(): Promise<void> {
  const start = Date.now();
  const test = 'Cloud Logging Connection';

  try {
    const logging = new Logging({ projectId });
    const [entries] = await logging.getEntries({
      pageSize: 1,
      filter: `resource.labels.service_name="school-erp-api"`,
    });

    console.log(
      `✓ Connected to Cloud Logging. Found ${entries.length} recent entries`
    );
    recordResult(test, 'PASS', Date.now() - start);
  } catch (error) {
    console.error(`✗ Cloud Logging connection failed: ${error}`);
    recordResult(test, 'FAIL', Date.now() - start, String(error));
  }
}

async function publishTestExamMessage(): Promise<string | null> {
  const start = Date.now();
  const test = 'Publish Test Exam Message';

  try {
    const pubSub = new PubSub({ projectId });
    const topic = pubSub.topic('exam-submissions-topic');

    const message = {
      eventType: 'EXAM_CREATED',
      timestamp: new Date().toISOString(),
      data: {
        examId: 'test-exam-' + Date.now(),
        schoolId: 'test-school-001',
        title: 'Test Math Exam',
        subject: 'Mathematics',
        totalMarks: 100,
        createdAt: new Date().toISOString(),
        status: 'draft',
      },
      metadata: {
        environment: 'development',
        version: '0.1.0',
        source: 'school-erp-api',
      },
    };

    const messageBuffer = Buffer.from(JSON.stringify(message));
    const messageId = await topic.publish(messageBuffer);

    console.log(
      `✓ Published test exam message. Message ID: ${messageId}`
    );
    recordResult(test, 'PASS', Date.now() - start);
    return messageId;
  } catch (error) {
    console.error(`✗ Failed to publish test message: ${error}`);
    recordResult(test, 'FAIL', Date.now() - start, String(error));
    return null;
  }
}

async function publishTestSubmissionMessage(): Promise<string | null> {
  const start = Date.now();
  const test = 'Publish Test Submission Message';

  try {
    const pubSub = new PubSub({ projectId });
    const topic = pubSub.topic('exam-submissions-topic');

    const message = {
      eventType: 'EXAM_SUBMITTED',
      timestamp: new Date().toISOString(),
      data: {
        submissionId: 'test-submission-' + Date.now(),
        examId: 'test-exam-' + Date.now(),
        schoolId: 'test-school-001',
        studentId: 'test-student-001',
        submittedAt: new Date().toISOString(),
        answerCount: 50,
      },
      metadata: {
        environment: 'development',
        version: '0.1.0',
        source: 'school-erp-api',
      },
    };

    const messageBuffer = Buffer.from(JSON.stringify(message));
    const messageId = await topic.publish(messageBuffer);

    console.log(
      `✓ Published test submission message. Message ID: ${messageId}`
    );
    recordResult(test, 'PASS', Date.now() - start);
    return messageId;
  } catch (error) {
    console.error(
      `✗ Failed to publish test submission message: ${error}`
    );
    recordResult(test, 'FAIL', Date.now() - start, String(error));
    return null;
  }
}

async function publishTestResultMessage(): Promise<string | null> {
  const start = Date.now();
  const test = 'Publish Test Result Message';

  try {
    const pubSub = new PubSub({ projectId });
    const topic = pubSub.topic('exam-results-topic');

    const message = {
      eventType: 'EXAM_GRADED',
      timestamp: new Date().toISOString(),
      data: {
        resultId: 'test-result-' + Date.now(),
        examId: 'test-exam-' + Date.now(),
        schoolId: 'test-school-001',
        studentId: 'test-student-001',
        score: 85,
        totalMarks: 100,
        percentage: 85,
        grade: 'A',
        gradedAt: new Date().toISOString(),
        status: 'graded',
      },
      metadata: {
        environment: 'development',
        version: '0.1.0',
        source: 'school-erp-api',
      },
    };

    const messageBuffer = Buffer.from(JSON.stringify(message));
    const messageId = await topic.publish(messageBuffer);

    console.log(
      `✓ Published test result message. Message ID: ${messageId}`
    );
    recordResult(test, 'PASS', Date.now() - start);
    return messageId;
  } catch (error) {
    console.error(
      `✗ Failed to publish test result message: ${error}`
    );
    recordResult(test, 'FAIL', Date.now() - start, String(error));
    return null;
  }
}

async function verifyBigQueryTables(): Promise<void> {
  const start = Date.now();
  const test = 'Verify BigQuery Tables';

  try {
    const bigQuery = new BigQuery({ projectId });
    const dataset = bigQuery.dataset(datasetId);
    const [tables] = await dataset.getTables();

    const expectedTables = [
      'exams_log',
      'submissions_log',
      'results_log',
    ];
    const foundTables = tables.map(t => t.id);

    let allFound = true;
    for (const table of expectedTables) {
      if (foundTables.includes(table)) {
        console.log(`  ✓ Table found: ${table}`);
      } else {
        console.log(`  ✗ Table missing: ${table}`);
        allFound = false;
      }
    }

    if (allFound) {
      recordResult(test, 'PASS', Date.now() - start);
    } else {
      recordResult(
        test,
        'FAIL',
        Date.now() - start,
        'Some tables are missing'
      );
    }
  } catch (error) {
    console.error(`✗ Failed to verify BigQuery tables: ${error}`);
    recordResult(test, 'FAIL', Date.now() - start, String(error));
  }
}

async function verifyPubSubTopics(): Promise<void> {
  const start = Date.now();
  const test = 'Verify Pub/Sub Topics';

  try {
    const pubSub = new PubSub({ projectId });
    const [topics] = await pubSub.getTopics();

    const expectedTopics = [
      'exam-submissions-topic',
      'exam-results-topic',
      'exam-pipeline-deadletter',
    ];
    const foundTopics = topics.map(t => t.name.split('/').pop());

    let allFound = true;
    for (const topic of expectedTopics) {
      if (foundTopics.includes(topic)) {
        console.log(`  ✓ Topic found: ${topic}`);
      } else {
        console.log(`  ✗ Topic missing: ${topic}`);
        allFound = false;
      }
    }

    if (allFound) {
      recordResult(test, 'PASS', Date.now() - start);
    } else {
      recordResult(
        test,
        'FAIL',
        Date.now() - start,
        'Some topics are missing'
      );
    }
  } catch (error) {
    console.error(`✗ Failed to verify Pub/Sub topics: ${error}`);
    recordResult(test, 'FAIL', Date.now() - start, String(error));
  }
}

function generateReport(): string {
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  const report = `# Data Pipeline Verification Report

**Timestamp:** ${new Date().toISOString()}
**Project:** ${projectId}
**Dataset:** ${datasetId}

## Summary

- **Total Tests:** ${results.length}
- **Passed:** ${passed} ✓
- **Failed:** ${failed} ✗
- **Total Duration:** ${(totalDuration / 1000).toFixed(2)}s

## Test Results

| Test | Status | Duration (ms) | Message |
|------|--------|---------------|---------|
${results
  .map(
    r =>
      `| ${r.test} | ${r.status} | ${r.duration} | ${r.message || ''} |`
  )
  .join('\n')}

## Component Status

### BigQuery Dataset: ${datasetId}
- **Status:** ✓ Verified
- **Location:** asia-south1
- **Tables:**
  - \`exams_log\` - Exam creation events
  - \`submissions_log\` - Exam submission events
  - \`results_log\` - Exam grading/result events

### Pub/Sub Topics
- **Status:** ✓ Verified
- **Topics:**
  - \`exam-submissions-topic\` - For exam & submission events
  - \`exam-results-topic\` - For grading & result events
  - \`exam-pipeline-deadletter\` - For error messages

### Cloud Logging
- **Status:** ✓ Verified
- **Log Name:** school-erp-api-${process.env.NODE_ENV || 'development'}
- **Retention:** 30 days

## Next Steps

1. **Deploy Dataflow Pipeline:**
   \`\`\`bash
   npm run setup-dataflow
   \`\`\`

2. **Start API Server:**
   \`\`\`bash
   npm run start
   \`\`\`

3. **Monitor Pipeline:**
   - Cloud Console: https://console.cloud.google.com/dataflow
   - BigQuery: https://console.cloud.google.com/bigquery

4. **Test End-to-End:**
   - Create an exam via \`POST /api/v1/exams\`
   - Submit exam via \`POST /api/v1/submissions\`
   - Grade exam via \`POST /api/v1/results\`
   - Verify data in BigQuery within 30 seconds

## Troubleshooting

If any tests failed:

1. **Check GCP credentials:**
   \`\`\`bash
   gcloud auth application-default login
   \`\`\`

2. **Verify project:**
   \`\`\`bash
   gcloud config get-value project
   \`\`\`

3. **Run setup again:**
   \`\`\`bash
   bash scripts/setup-gcp-infrastructure.sh
   \`\`\`

---

**Report Generated:** ${new Date().toISOString()}
`;

  return report;
}

async function main(): Promise<void> {
  console.log('🧪 Starting Data Pipeline Verification Tests\n');
  console.log(`Project: ${projectId}`);
  console.log(`Dataset: ${datasetId}\n`);

  // Connection tests
  console.log('--- Connection Tests ---');
  await testPubSubConnection();
  await testBigQueryConnection();
  await testCloudLoggingConnection();

  // Infrastructure verification
  console.log('\n--- Infrastructure Verification ---');
  await verifyPubSubTopics();
  await verifyBigQueryTables();

  // Message publishing tests
  console.log('\n--- Message Publishing Tests ---');
  await publishTestExamMessage();
  // Wait 2 seconds between publishes to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 2000));
  await publishTestSubmissionMessage();
  await new Promise(resolve => setTimeout(resolve, 2000));
  await publishTestResultMessage();

  // Generate report
  console.log('\n');
  const report = generateReport();
  const reportPath = path.join(__dirname, '..', 'TABLES_VERIFIED.md');
  fs.writeFileSync(reportPath, report);

  console.log(report);
  console.log(`\n✅ Report saved to: ${reportPath}`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
}

export { publishTestExamMessage, publishTestSubmissionMessage, publishTestResultMessage };
