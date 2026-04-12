# Firestore Database with Multi-region Replication
resource "google_firestore_database" "deerflow" {
  provider                = google-beta
  project                 = var.project_id
  name                    = "(default)"
  location_id             = "asia-south1"
  type                    = "FIRESTORE_NATIVE"
  concurrency_mode        = "OPTIMISTIC"
  delete_protection_state = "DELETE_PROTECTION_ENABLED"
  labels                  = local.common_labels

  depends_on = [
    google_project_service.required_apis["firestore.googleapis.com"]
  ]
}

# Enable Firestore multi-region replication
resource "google_firestore_backup_schedule" "daily" {
  provider    = google-beta
  project     = var.project_id
  database    = google_firestore_database.deerflow.name
  location    = "asia-south1"
  retention   = "604800s" # 7 days
  recurrence  = "DAILY"

  depends_on = [
    google_firestore_database.deerflow
  ]
}

# Firestore Indexes for Performance
resource "google_firestore_index" "students_by_school" {
  provider   = google-beta
  project    = var.project_id
  database   = google_firestore_database.deerflow.name
  collection = "students"
  
  fields {
    field_path = "schoolId"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }

  depends_on = [google_firestore_database.deerflow]
}

resource "google_firestore_index" "payments_by_student" {
  provider   = google-beta
  project    = var.project_id
  database   = google_firestore_database.deerflow.name
  collection = "payments"
  
  fields {
    field_path = "studentId"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "date"
    order      = "DESCENDING"
  }

  depends_on = [google_firestore_database.deerflow]
}

resource "google_firestore_index" "notifications_by_recipient" {
  provider   = google-beta
  project    = var.project_id
  database   = google_firestore_database.deerflow.name
  collection = "notifications"
  
  fields {
    field_path = "recipientId"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "timestamp"
    order      = "DESCENDING"
  }

  depends_on = [google_firestore_database.deerflow]
}

resource "google_firestore_index" "grades_by_period" {
  provider   = google-beta
  project    = var.project_id
  database   = google_firestore_database.deerflow.name
  collection = "grades"
  
  fields {
    field_path = "studentId"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "term"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "subject"
    order      = "ASCENDING"
  }

  depends_on = [google_firestore_database.deerflow]
}

# Firestore Security Rules
resource "google_firestore_document" "security_rules" {
  provider   = google-beta
  project    = var.project_id
  database   = google_firestore_database.deerflow.name
  collection = "__security__"
  document   = "rules"

  fields = {
    "rules" = {
      string_value = file("${path.module}/firestore-rules.json")
    }
  }

  depends_on = [google_firestore_database.deerflow]
}

# Collection Group Settings for Queries
resource "google_firestore_field" "attendance_timestamp" {
  provider            = google-beta
  project             = var.project_id
  database            = google_firestore_database.deerflow.name
  collection          = "attendance"
  field               = "timestamp"
  index_config {
    indexes {
      order   = "ASCENDING"
      query_scope = "COLLECTION"
    }
  }

  depends_on = [google_firestore_database.deerflow]
}

output "firestore_database_name" {
  value = google_firestore_database.deerflow.name
}

output "firestore_database_uid" {
  value = google_firestore_database.deerflow.uid
}
