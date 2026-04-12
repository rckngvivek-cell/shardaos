import type { SchoolMetric, StudentRecord } from '@/types/school'

export const dashboardMetrics: SchoolMetric[] = [
  { label: 'Students onboarded', value: '2,450', delta: '+12 this week', tone: 'success' },
  { label: 'Attendance today', value: '94.8%', delta: '+1.4% vs yesterday', tone: 'info' },
  { label: 'Fee collection', value: '₹18.6L', delta: '87% of current cycle', tone: 'warning' },
  { label: 'Open tasks', value: '16', delta: '4 urgent follow-ups', tone: 'info' },
]

export const studentsSeed: StudentRecord[] = [
  {
    id: 'stu_001',
    fullName: 'Aarav Sharma',
    className: '10-A',
    rollNumber: '12501',
    parentName: 'Vikram Sharma',
    attendance: 96,
    status: 'active',
    feeStatus: 'paid',
  },
  {
    id: 'stu_002',
    fullName: 'Meera Iyer',
    className: '9-B',
    rollNumber: '11877',
    parentName: 'Anita Iyer',
    attendance: 91,
    status: 'active',
    feeStatus: 'partial',
  },
  {
    id: 'stu_003',
    fullName: 'Kabir Singh',
    className: '8-C',
    rollNumber: '11208',
    parentName: 'Nitin Singh',
    attendance: 87,
    status: 'active',
    feeStatus: 'due',
  },
  {
    id: 'stu_004',
    fullName: 'Diya Patel',
    className: '11-A',
    rollNumber: '13014',
    parentName: 'Rina Patel',
    attendance: 98,
    status: 'active',
    feeStatus: 'paid',
  },
]

export const roles = ['principal', 'teacher', 'admin', 'parent'] as const
