import { createApi } from '@reduxjs/toolkit/query/react'

import { baseQuery } from '@/services/api'
import type { StudentDraft, StudentRecord } from '@/types/school'

type HealthEnvelope = {
  success: boolean
  data: {
    status: string
    authMode: string
    dataProvider: string
  }
  meta: {
    version: string
    requestId: string
  }
}

type StudentApiRecord = {
  studentId: string
  firstName: string
  lastName: string
  class: number
  section: string
  rollNumber: string
  status: 'active' | 'inactive' | 'deleted'
  contact: {
    parentName: string
  }
}

type StudentsEnvelope = {
  success: boolean
  data: StudentApiRecord[]
}

type StudentEnvelope = {
  success: boolean
  data: StudentApiRecord
}

function toStudentRecord(student: StudentApiRecord): StudentRecord {
  return {
    id: student.studentId,
    fullName: `${student.firstName} ${student.lastName}`.trim(),
    className: `${student.class}-${student.section}`,
    rollNumber: student.rollNumber,
    parentName: student.contact.parentName,
    attendance: 100,
    status: student.status === 'deleted' ? 'inactive' : student.status,
    feeStatus: 'paid',
  }
}

function toCreateStudentPayload(student: StudentDraft) {
  const [firstName, ...rest] = student.fullName.trim().split(/\s+/)
  const [classNumber = '1', section = 'A'] = student.className.split('-')

  return {
    firstName: firstName || student.fullName,
    lastName: rest.join(' ') || 'Student',
    dob: '2012-01-01',
    rollNumber: student.rollNumber,
    class: Number(classNumber),
    section,
    status: student.status,
    enrollmentDate: new Date().toISOString().slice(0, 10),
    contact: {
      parentName: student.parentName,
      parentPhone: '+910000000000',
    },
  }
}

export const schoolApi = createApi({
  reducerPath: 'schoolApi',
  baseQuery,
  tagTypes: ['Health', 'Students'],
  endpoints: (builder) => ({
    getHealth: builder.query<HealthEnvelope, void>({
      query: () => 'health',
      providesTags: ['Health'],
    }),
    listStudents: builder.query<StudentRecord[], { schoolId: string }>({
      query: ({ schoolId }) => `schools/${schoolId}/students`,
      transformResponse: (response: StudentsEnvelope) =>
        response.data.map(toStudentRecord),
      providesTags: (_result, _error, { schoolId }) => [
        { type: 'Students', id: schoolId },
      ],
    }),
    createStudent: builder.mutation<
      StudentRecord,
      { schoolId: string; student: StudentDraft }
    >({
      query: ({ schoolId, student }) => ({
        url: `schools/${schoolId}/students`,
        method: 'POST',
        body: toCreateStudentPayload(student),
      }),
      transformResponse: (response: StudentEnvelope) => toStudentRecord(response.data),
      invalidatesTags: (_result, _error, { schoolId }) => [
        { type: 'Students', id: schoolId },
      ],
    }),
  }),
})

export const {
  useCreateStudentMutation,
  useGetHealthQuery,
  useListStudentsQuery,
} = schoolApi
