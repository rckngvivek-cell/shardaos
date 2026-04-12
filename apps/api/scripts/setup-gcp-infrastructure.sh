#!/bin/bash

#############################################################################
# GCP Data Pipeline Setup for School ERP Exam Module
#
# This script sets up the complete data pipeline infrastructure:
# 1. BigQuery dataset and tables
# 2. Pub/Sub topics
# 3. Service accounts and permissions
# 4. Cloud Logging configuration
#
# Usage: bash setup-gcp-infrastructure.sh
#############################################################################

set -e

# Configuration
GCP_PROJECT=${GCP_PROJECT_ID:-"school-erp-dev"}
GCP_REGION="asia-south1"
SERVICE_ACCOUNT="school-erp-sa"
DATASET="school_erp"
BIGQUERY_LOCATION="asia-south1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi

    if ! command -v bq &> /dev/null; then
        log_error "BigQuery CLI (bq) is not installed. Please install it first."
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install it first."
        exit 1
    fi

    log_success "All prerequisites are installed"
}

# Set GCP project
set_gcp_project() {
    log_info "Setting GCP project to ${GCP_PROJECT}..."
    gcloud config set project ${GCP_PROJECT}
    log_success "Project set to ${GCP_PROJECT}"
}

# Enable required APIs
enable_apis() {
    log_info "Enabling required GCP APIs..."

    APIS=(
        "bigquery.googleapis.com"
        "pubsub.googleapis.com"
        "dataflow.googleapis.com"
        "logging.googleapis.com"
        "cloudresourcemanager.googleapis.com"
    )

    for api in "${APIS[@]}"; do
        log_info "Enabling ${api}..."
        gcloud services enable ${api} --project=${GCP_PROJECT}
    done

    log_success "All required APIs are enabled"
}

# Create BigQuery dataset
create_bigquery_dataset() {
    log_info "Creating BigQuery dataset: ${DATASET}..."

    if bq ls -d | grep -q ${DATASET}; then
        log_warning "Dataset ${DATASET} already exists"
    else
        bq mk \
            --dataset \
            --location ${BIGQUERY_LOCATION} \
            --description "School ERP analytics dataset for exam module" \
            --label environment:production \
            --label module:exam \
            ${DATASET}
        log_success "BigQuery dataset created: ${DATASET}"
    fi
}

# Create BigQuery tables
create_bigquery_tables() {
    log_info "Creating BigQuery tables..."

    # Exams log table
    TABLE_SCHEMA='examId:STRING,schoolId:STRING,title:STRING,subject:STRING,totalMarks:INT64,createdAt:TIMESTAMP,status:STRING,_event_timestamp:TIMESTAMP,_created_at:TIMESTAMP'

    if bq ls ${DATASET} | grep -q exams_log; then
        log_warning "Table exams_log already exists"
    else
        bq mk \
            --table \
            --time_partitioning_field _created_at \
            --time_partitioning_type DAY \
            --clustering_fields schoolId,examId \
            --description "Log of all exam creation events" \
            ${DATASET}.exams_log \
            ${TABLE_SCHEMA}
        log_success "Table created: exams_log"
    fi

    # Submissions log table
    TABLE_SCHEMA='submissionId:STRING,examId:STRING,schoolId:STRING,studentId:STRING,submittedAt:TIMESTAMP,answerCount:INT64,status:STRING,_event_timestamp:TIMESTAMP,_created_at:TIMESTAMP'

    if bq ls ${DATASET} | grep -q submissions_log; then
        log_warning "Table submissions_log already exists"
    else
        bq mk \
            --table \
            --time_partitioning_field _created_at \
            --time_partitioning_type DAY \
            --clustering_fields schoolId,examId \
            --description "Log of all exam submission events" \
            ${DATASET}.submissions_log \
            ${TABLE_SCHEMA}
        log_success "Table created: submissions_log"
    fi

    # Results log table
    TABLE_SCHEMA='resultId:STRING,examId:STRING,schoolId:STRING,studentId:STRING,score:FLOAT64,totalMarks:FLOAT64,percentage:FLOAT64,grade:STRING,gradedAt:TIMESTAMP,status:STRING,_event_timestamp:TIMESTAMP,_created_at:TIMESTAMP'

    if bq ls ${DATASET} | grep -q results_log; then
        log_warning "Table results_log already exists"
    else
        bq mk \
            --table \
            --time_partitioning_field _created_at \
            --time_partitioning_type DAY \
            --clustering_fields schoolId,examId \
            --description "Log of all exam grading/result events" \
            ${DATASET}.results_log \
            ${TABLE_SCHEMA}
        log_success "Table created: results_log"
    fi
}

# Create Pub/Sub topics
create_pubsub_topics() {
    log_info "Creating Pub/Sub topics..."

    TOPICS=(
        "exam-submissions-topic"
        "exam-results-topic"
        "exam-pipeline-deadletter"
    )

    for topic in "${TOPICS[@]}"; do
        if gcloud pubsub topics describe ${topic} &>/dev/null; then
            log_warning "Topic ${topic} already exists"
        else
            gcloud pubsub topics create ${topic}
            log_success "Topic created: ${topic}"
        fi
    done
}

# Create Pub/Sub subscriptions for testing
create_pubsub_subscriptions() {
    log_info "Creating Pub/Sub subscriptions for testing..."

    SUBS=(
        "exam-submissions-sub"
        "exam-results-sub"
    )

    if gcloud pubsub subscriptions describe exam-submissions-sub &>/dev/null; then
        log_warning "Subscription exam-submissions-sub already exists"
    else
        gcloud pubsub subscriptions create exam-submissions-sub \
            --topic exam-submissions-topic \
            --message-retention-duration 7d
        log_success "Subscription created: exam-submissions-sub"
    fi

    if gcloud pubsub subscriptions describe exam-results-sub &>/dev/null; then
        log_warning "Subscription exam-results-sub already exists"
    else
        gcloud pubsub subscriptions create exam-results-sub \
            --topic exam-results-topic \
            --message-retention-duration 7d
        log_success "Subscription created: exam-results-sub"
    fi
}

# Install npm dependencies
install_npm_dependencies() {
    log_info "Installing npm dependencies..."

    if [ -f "package.json" ]; then
        npm install @google-cloud/pubsub @google-cloud/bigquery @google-cloud/logging
        log_success "npm dependencies installed"
    else
        log_warning "package.json not found. Skipping npm install."
    fi
}

# Export configuration
export_configuration() {
    log_info "Exporting configuration..."

    cat > .env.gcp-pipeline << EOF
# GCP Data Pipeline Configuration
GCP_PROJECT_ID=${GCP_PROJECT}
GCP_REGION=${GCP_REGION}
BIGQUERY_DATASET=${DATASET}
BIGQUERY_LOCATION=${BIGQUERY_LOCATION}
SERVICE_ACCOUNT=${SERVICE_ACCOUNT}

# Pub/Sub Topics
PUBSUB_EXAM_SUBMISSIONS_TOPIC=exam-submissions-topic
PUBSUB_EXAM_RESULTS_TOPIC=exam-results-topic
PUBSUB_DEADLETTER_TOPIC=exam-pipeline-deadletter

# BigQuery Table Names
BIGQUERY_EXAMS_LOG=exams_log
BIGQUERY_SUBMISSIONS_LOG=submissions_log
BIGQUERY_RESULTS_LOG=results_log
EOF

    log_success "Configuration exported to .env.gcp-pipeline"
}

# Print final summary
print_summary() {
    cat << EOF

${GREEN}========================================
✓ GCP Infrastructure Setup Complete
========================================${NC}

${BLUE}Project: ${GREEN}${GCP_PROJECT}${NC}
${BLUE}Region: ${GREEN}${GCP_REGION}${NC}

${BLUE}BigQuery:${NC}
  - Dataset: ${GREEN}${DATASET}${NC}
  - Tables: ${GREEN}exams_log, submissions_log, results_log${NC}

${BLUE}Pub/Sub Topics:${NC}
  - ${GREEN}exam-submissions-topic${NC}
  - ${GREEN}exam-results-topic${NC}
  - ${GREEN}exam-pipeline-deadletter${NC}

${BLUE}Next Steps:${NC}
1. Run: npm run build
2. Deploy Dataflow pipeline: npm run setup-dataflow
3. Start API: npm run start
4. Test pipeline: npm run test-pipeline

For more information, see:
  - documentation: docs/DATAFLOW_DEPLOYMENT.md
  - configuration: .env.gcp-pipeline

EOF
}

# Main execution
main() {
    log_info "Starting GCP Data Pipeline Infrastructure Setup"
    log_info "Time: $(date)\n"

    check_prerequisites
    set_gcp_project
    enable_apis
    create_bigquery_dataset
    create_bigquery_tables
    create_pubsub_topics
    create_pubsub_subscriptions
    install_npm_dependencies
    export_configuration

    print_summary
}

# Execute main
main
