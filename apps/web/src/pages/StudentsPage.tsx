import { useAppSelector } from '@/app/hooks';
import { useDeferredValue, useState } from 'react';

import { StudentForm } from '../components/StudentForm';
import { useCreateStudentMutation, useListStudentsQuery } from '../services/schoolErpApi';

export function StudentsPage() {
  const schoolId = useAppSelector((state) => state.session.schoolId);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [createStudent, { isLoading: isSaving }] = useCreateStudentMutation();
  const { data: students = [], isFetching } = useListStudentsQuery({
    schoolId,
    q: deferredQuery || undefined
  });

  return (
    <div className="page two-column">
      <StudentForm
        pending={isSaving}
        onSubmit={async (values) => {
          await createStudent({
            schoolId,
            payload: {
              firstName: values.firstName,
              lastName: values.lastName,
              dob: values.dob,
              rollNumber: values.rollNumber,
              class: 5,
              section: 'A',
              contact: {
                parentName: values.parentName,
                parentEmail: values.parentEmail || undefined,
                parentPhone: values.parentPhone
              }
            }
          }).unwrap();
        }}
      />

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Student Registry</p>
            <h2>Class 5-A</h2>
          </div>
          <span className="status-pill">{isFetching ? 'Refreshing' : `${students.length} records`}</span>
        </div>
        <label className="search-field">
          Search by name, roll number, or Aadhaar
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="student-list">
          {students.map((student) => (
            <article className="student-card" key={student.studentId}>
              <div>
                <strong>
                  {student.firstName} {student.lastName}
                </strong>
                <p>
                  Roll {student.rollNumber} • Class {student.class}-{student.section}
                </p>
              </div>
              <div className="student-meta">
                <span>{student.contact.parentName}</span>
                <span>{student.contact.parentPhone}</span>
              </div>
            </article>
          ))}
          {!students.length && <p className="empty-state">No students match the current filter.</p>}
        </div>
      </section>
    </div>
  );
}
