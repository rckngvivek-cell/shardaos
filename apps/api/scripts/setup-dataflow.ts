/**
 * Dataflow Pipeline Setup for Exam Module
 * 
 * Creates a Dataflow pipeline that:
 * 1. Reads from Pub/Sub topics (exam-submissions-topic, exam-results-topic)
 * 2. Transforms the messages (adds metadata, timestamp)
 * 3. Writes to BigQuery tables
 * 
 * This script prepares the pipeline configuration for deployment
 */

import * as fs from 'fs';
import * as path from 'path';

interface DataflowPipelineConfig {
  projectId: string;
  region: string;
  jobName: string;
  template: string;
  parameters: Record<string, string>;
}

const config: DataflowPipelineConfig = {
  projectId: process.env.GCP_PROJECT_ID || 'school-erp-dev',
  region: 'asia-south1',
  jobName: 'exam-data-pipeline',
  template: 'gs://school-erp-dataflow/templates/exam-to-bigquery',
  parameters: {
    inputTopic: 'projects/school-erp-dev/topics/exam-submissions-topic',
    outputTableExams: 'school-erp:school_erp.exams_log',
    outputTableSubmissions: 'school-erp:school_erp.submissions_log',
    outputTableResults: 'school-erp:school_erp.results_log',
    deadLetterTopic: 'projects/school-erp-dev/topics/exam-pipeline-deadletter',
  },
};

/**
 * Generate gcloud command to deploy Dataflow pipeline
 */
function generateDeployCommand(): string {
  const params = Object.entries(config.parameters)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');

  return `gcloud dataflow jobs run ${config.jobName} \\
  --region=${config.region} \\
  --template-location=${config.template} \\
  --parameters ${params} \\
  --project=${config.projectId}`;
}

/**
 * Generate Beam/Dataflow Java pipeline code
 */
function generatePipelineCode(): string {
  return `package com.schoolerp.dataflow;

import com.google.cloud.dataflow.templates.common.DataflowTemplateConstants;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.PipelineResult;
import org.apache.beam.sdk.extensions.gcp.options.GcpOptions;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO;
import org.apache.beam.sdk.io.gcp.pubsub.PubsubIO;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.options.StreamingOptions;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.SerializableFunction;
import org.apache.beam.sdk.transforms.windowing.FixedWindows;
import org.apache.beam.sdk.transforms.windowing.Window;
import org.apache.beam.sdk.values.PCollection;
import org.joda.time.Duration;
import com.google.api.services.bigquery.model.TableRow;
import com.google.gson.Gson;

import java.util.Map;
import java.util.Objects;

/**
 * Dataflow pipeline for exam module events
 * Reads from Pub/Sub, transforms, and writes to BigQuery
 */
public class ExamDataPipeline {

  private static final Gson gson = new Gson();

  public static class ParsePubSubMessage extends DoFn<String, Map<String, Object>> {
    @ProcessElement
    public void processElement(ProcessContext context) {
      String message = context.element();
      try {
        Map<String, Object> parsedMessage = gson.fromJson(message, Map.class);
        String eventType = (String) parsedMessage.get("eventType");
        
        // Route to appropriate transformation based on event type
        context.output(parsedMessage);
      } catch (Exception e) {
        System.err.println("Error parsing message: " + e.getMessage());
      }
    }
  }

  public static class EventToTableRow extends DoFn<Map<String, Object>, TableRow> {
    @ProcessElement
    public void processElement(ProcessContext context) {
      Map<String, Object> event = context.element();
      String eventType = (String) event.get("eventType");
      Map<String, Object> data = (Map<String, Object>) event.get("data");
      Map<String, Object> metadata = (Map<String, Object>) event.get("metadata");

      TableRow row = new TableRow();
      
      // Common fields
      row.set("_event_timestamp", event.get("timestamp"));
      row.set("_created_at", System.currentTimeMillis() / 1000);
      
      // Route based on event type
      if ("EXAM_CREATED".equals(eventType)) {
        row.set("examId", data.get("examId"));
        row.set("schoolId", data.get("schoolId"));
        row.set("title", data.get("title"));
        row.set("subject", data.get("subject"));
        row.set("totalMarks", data.get("totalMarks"));
        row.set("createdAt", data.get("createdAt"));
        row.set("status", data.get("status"));
      } else if ("EXAM_SUBMITTED".equals(eventType)) {
        row.set("submissionId", data.get("submissionId"));
        row.set("examId", data.get("examId"));
        row.set("schoolId", data.get("schoolId"));
        row.set("studentId", data.get("studentId"));
        row.set("submittedAt", data.get("submittedAt"));
        row.set("answerCount", data.get("answerCount"));
        row.set("status", "submitted");
      } else if ("EXAM_GRADED".equals(eventType)) {
        row.set("resultId", data.get("resultId"));
        row.set("examId", data.get("examId"));
        row.set("schoolId", data.get("schoolId"));
        row.set("studentId", data.get("studentId"));
        row.set("score", data.get("score"));
        row.set("totalMarks", data.get("totalMarks"));
        row.set("percentage", data.get("percentage"));
        row.set("grade", data.get("grade"));
        row.set("gradedAt", data.get("gradedAt"));
        row.set("status", data.get("status"));
      }

      context.output(row);
    }
  }

  public static void main(String[] args) throws Exception {
    PipelineOptions options = PipelineOptionsFactory.fromArgs(args).create();
    options.setTempLocation("gs://school-erp-dataflow/temp");
    options.setStagingLocation("gs://school-erp-dataflow/staging");
    
    Pipeline pipeline = Pipeline.create(options);

    // Read from Pub/Sub
    PCollection<String> messages = pipeline
      .apply("ReadFromPubSub", PubsubIO.readStrings()
        .fromTopic("projects/school-erp-dev/topics/exam-submissions-topic"));

    // Parse JSON
    PCollection<Map<String, Object>> events = messages
      .apply("ParseJSON", ParDo.of(new ParsePubSubMessage()));

    // Apply 60-second window
    PCollection<Map<String, Object>> windowed = events
      .apply("Window", Window.into(FixedWindows.of(Duration.standardSeconds(60))));

    // Transform to BigQuery rows
    PCollection<TableRow> tableRows = windowed
      .apply("ToTableRow", ParDo.of(new EventToTableRow()));

    // Write to BigQuery
    tableRows.apply("WriteToBigQuery", BigQueryIO.writeTableRows()
      .to("school-erp-dev:school_erp.exam_events")
      .withCreateDisposition(BigQueryIO.Write.CreateDisposition.CREATE_IF_NEEDED)
      .withWriteDisposition(BigQueryIO.Write.WriteDisposition.WRITE_APPEND));

    PipelineResult result = pipeline.run();
    result.waitUntilFinish();
  }
}
`;
}

/**
 * Save pipeline configuration
 */
function savePipelineConfig(): void {
  const configPath = path.join(__dirname, '..', 'config', 'dataflow-config.json');
  const dir = path.dirname(configPath);

  // Create config directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✓ Pipeline config saved: ${configPath}`);
}

/**
 * Generate deployment guide
 */
function generateDeploymentGuide(): void {
  const guide = `# Dataflow Pipeline Deployment Guide

## About This Pipeline
- **Name:** exam-data-pipeline
- **Type:** Streaming (Pub/Sub to BigQuery)
- **Region:** ${config.region}
- **Project:** ${config.projectId}

## Prerequisites
1. \`gcloud\` CLI installed and authenticated
2. Pub/Sub topics created: exam-submissions-topic, exam-results-topic
3. BigQuery dataset created: school_erp
4. Service account with Dataflow permissions

## Deployment Command

\`\`\`bash
${generateDeployCommand()}
\`\`\`

## Manual Deployment Steps

1. **Clone the Dataflow repository:**
   \`\`\`bash
   git clone https://github.com/GoogleCloudPlatform/java-docs-samples.git
   cd java-docs-samples/dataflow/
   \`\`\`

2. **Build the pipeline:**
   \`\`\`bash
   mvn compile exec:java -Dexec.mainClass=com.schoolerp.dataflow.ExamDataPipeline \\
     -Dexec.args="--project=${config.projectId} \\
     --runner=DataflowRunner \\
     --region=${config.region} \\
     --stagingLocation=gs://school-erp-dataflow/staging"
   \`\`\`

3. **Monitor in Google Cloud Console:**
   - Go to Dataflow > Jobs
   - Find exam-data-pipeline
   - Check metrics, logs, and status

## Testing the Pipeline

1. **Publish test message to Pub/Sub:**
   \`\`\`bash
   gcloud pubsub topics publish exam-submissions-topic \\
     --message '{"eventType":"EXAM_CREATED","data":{"examId":"test-123","schoolId":"school-1","title":"Math Test","totalMarks":100}}'
   \`\`\`

2. **Verify in BigQuery:**
   \`\`\`bash
   bq query --use_legacy_sql=false \\
     'SELECT * FROM \`${config.projectId}.school_erp.exams_log\` WHERE examId="test-123" LIMIT 10'
   \`\`\`

## Monitoring & Alerts

- **CPU Utilization:** Should stay below 60%
- **Memory:** Monitor OOM errors
- **Backlog Age:** Should be near real-time (<30s)
- **Error Rate:** Should be <0.1%

## Rollback

If issues occur:
1. Stop the job: \`gcloud dataflow jobs cancel JOB_ID\`
2. Check logs: \`gcloud dataflow jobs describe JOB_ID --region=${config.region}\`
3. Fix issues and redeploy

## Cost Optimization

- Use Dataflow Prime for autoscaling
- Set min workers > 0 for consistent processing
- Use regional endpoints to reduce network costs
`;

  const guidePath = path.join(__dirname, '..', 'docs', 'DATAFLOW_DEPLOYMENT.md');
  const dir = path.dirname(guidePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(guidePath, guide);
  console.log(`✓ Deployment guide saved: ${guidePath}`);
}

/**
 * Main execution
 */
async function setup(): Promise<void> {
  console.log('🔧 Setting up Dataflow pipeline configuration...\n');

  savePipelineConfig();
  generateDeploymentGuide();

  console.log('\n📋 Dataflow gcloud deploy command:\n');
  console.log(generateDeployCommand());

  console.log('\n✅ Dataflow setup preparation completed!');
  console.log('\nNext steps:');
  console.log('1. Deploy pipeline: See DATAFLOW_DEPLOYMENT.md');
  console.log('2. Monitor in Cloud Console: Dataflow > Jobs');
  console.log('3. Test with sample messages');
}

if (require.main === module) {
  setup();
}

export { config, generateDeployCommand };
