export type UserRole = 'principal' | 'teacher' | 'admin' | 'parent'

export type SchoolMetric = {
  label: string
  value: string
  delta: string
  tone: 'success' | 'warning' | 'info'
}

export type StudentRecord = {
  id: string
  fullName: string
  className: string
  rollNumber: string
  parentName: string
  attendance: number
  status: 'active' | 'inactive'
  feeStatus: 'paid' | 'due' | 'partial'
}

export type StudentDraft = {
  fullName: string
  className: string
  rollNumber: string
  parentName: string
  attendance: number
  status: 'active' | 'inactive'
  feeStatus: 'paid' | 'due' | 'partial'
}
