import { useEffect, useMemo, useState } from 'react';

import { useAppSelector } from '@/app/hooks';
import { Panel } from '@/components/Cards';
import { studentsSeed } from '@/data/mockData';
import { useGetAttendanceQuery, useListStudentsQuery, useSubmitAttendanceMutation } from '@/services/schoolErpApi';
import type { AttendanceSession, AttendanceStatus, AttendanceStudent } from '@/types';
import type { StudentRecord } from '@/types/school';

const classOptions = ['8', '9', '10', '11'] as const;
const sectionOptions = ['A', 'B', 'C'] as const;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function countByStatus(records: AttendanceStudent[], status: AttendanceStatus) {
  return records.filter((record) => record.status === status).length;
}

function splitName(fullName: string) {
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  return {
    firstName: firstName || 'Student',
    lastName: rest.length ? rest.join(' ') : 'Learner'
  };
}

function parseClassSection(className: string) {
  const [classValue, section = 'A'] = className.split('-');
  return {
    classNumber: Number(classValue) || 10,
    section: section.toUpperCase()
  };
}

function normalizeSeedStudent(student: StudentRecord): AttendanceStudent {
  const { firstName, lastName } = splitName(student.fullName);
  const { classNumber, section } = parseClassSection(student.className);

  return {
    studentId: student.id,
    firstName,
    lastName,
    rollNumber: student.rollNumber,
    class: classNumber,
    section,
    status: 'present'
  };
}

export function AttendancePage() {
  const session = useAppSelector((state) => state.session);
  const [date, setDate] = useState(todayIso());
  const [classNumber, setClassNumber] = useState(10);
  const [section, setSection] = useState('A');
  const [draftRoster, setDraftRoster] = useState<Record<string, AttendanceStudent>>({});
  const [submitAttendance, { isLoading: isSaving }] = useSubmitAttendanceMutation();

  const { data: schoolStudents = [] } = useListStudentsQuery({ schoolId: session.schoolId });
  const { data: attendanceSession, isError, isFetching } = useGetAttendanceQuery({
    schoolId: session.schoolId,
    date,
    class: classNumber,
    section
  });

  const apiRoster = useMemo<AttendanceStudent[]>(() => {
    return schoolStudents
      .filter((student) => Number(student.class) === classNumber && student.section === section)
      .map((student) => ({
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        rollNumber: student.rollNumber,
        class: student.class,
        section: student.section,
        status: 'present'
      }));
  }, [classNumber, section, schoolStudents]);

  const fallbackRoster = useMemo<AttendanceStudent[]>(() => {
    return studentsSeed
      .map(normalizeSeedStudent)
      .filter((student) => student.class === classNumber && student.section === section);
  }, [classNumber, section]);

  const roster = useMemo(() => {
    const source = attendanceSession?.records.length ? attendanceSession.records : apiRoster.length ? apiRoster : fallbackRoster;

    return source.map((record) => draftRoster[record.studentId] ?? record);
  }, [attendanceSession?.records, apiRoster, draftRoster, fallbackRoster]);

  const summary = useMemo(() => {
    return {
      totalStudents: roster.length,
      present: countByStatus(roster, 'present'),
      absent: countByStatus(roster, 'absent'),
      leave: countByStatus(roster, 'leave'),
      late: countByStatus(roster, 'late')
    };
  }, [roster]);

  useEffect(() => {
    setDraftRoster({});
  }, [date, classNumber, section]);

  const syncState = isFetching
    ? 'Loading attendance from API...'
    : isError
      ? 'Using local draft roster until the API exists.'
      : attendanceSession?.submittedAt
        ? `Last submitted ${new Date(attendanceSession.submittedAt).toLocaleString()}`
        : 'Draft ready for submit.';

  function setStudentStatus(studentId: string, status: AttendanceStatus) {
    setDraftRoster((current) => {
      const existing = roster.find((record) => record.studentId === studentId);
      if (!existing) {
        return current;
      }

      return {
        ...current,
        [studentId]: {
          ...existing,
          status
        }
      };
    });
  }

  function markAllPresent() {
    setDraftRoster((current) => {
      const next: Record<string, AttendanceStudent> = {};
      roster.forEach((student) => {
        next[student.studentId] = {
          ...student,
          status: 'present'
        };
      });
      return { ...current, ...next };
    });
  }

  function clearMarks() {
    setDraftRoster((current) => {
      const next: Record<string, AttendanceStudent> = {};
      roster.forEach((student) => {
        next[student.studentId] = {
          ...student,
          status: 'present'
        };
      });
      return next;
    });
  }

  async function handleSubmit() {
    const payload = {
      schoolId: session.schoolId,
      date,
      class: classNumber,
      section,
      submittedBy: session.userId,
      records: roster.map((record) => ({
        studentId: record.studentId,
        status: record.status,
        note: record.note
      }))
    };

    try {
      await submitAttendance({ schoolId: session.schoolId, payload }).unwrap();
      setDraftRoster({});
    } catch {
      // Keep the local draft when the backend endpoint is not available yet.
    }
  }

  return (
    <div className="page-stack">
      <Panel
        title="Attendance"
        subtitle="Daily class attendance for teachers, principals, and admin staff."
      >
        <div className="attendance-toolbar">
          <label className="field">
            <span>Date</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="field">
            <span>Class</span>
            <select
              value={classNumber}
              onChange={(event) => setClassNumber(Number(event.target.value))}
            >
              {classOptions.map((value) => (
                <option key={value} value={value}>
                  Class {value}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Section</span>
            <select value={section} onChange={(event) => setSection(event.target.value)}>
              {sectionOptions.map((value) => (
                <option key={value} value={value}>
                  Section {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="table-status">{syncState}</p>

        <section className="attendance-summary">
          <article className="attendance-summary__card">
            <span>Total</span>
            <strong>{summary.totalStudents}</strong>
          </article>
          <article className="attendance-summary__card attendance-summary__card--success">
            <span>Present</span>
            <strong>{summary.present}</strong>
          </article>
          <article className="attendance-summary__card attendance-summary__card--warning">
            <span>Late</span>
            <strong>{summary.late}</strong>
          </article>
          <article className="attendance-summary__card attendance-summary__card--danger">
            <span>Absent</span>
            <strong>{summary.absent}</strong>
          </article>
        </section>

        <div className="attendance-layout">
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll</th>
                  <th>Status</th>
                  <th>Mark</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((student) => (
                  <tr key={student.studentId}>
                    <td>
                      <strong>
                        {student.firstName} {student.lastName}
                      </strong>
                      <span>
                        {student.class}-{student.section}
                      </span>
                    </td>
                    <td>{student.rollNumber}</td>
                    <td>
                      <span className={`status-tag status-tag--${student.status}`}>
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <div className="attendance-actions">
                        {(['present', 'absent', 'leave', 'late'] as AttendanceStatus[]).map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={
                              student.status === value
                                ? 'button button--primary'
                                : 'button button--ghost'
                            }
                            onClick={() => setStudentStatus(student.studentId, value)}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="form-card">
            <h3>Submit attendance</h3>
            <p>Mark the class, review the counts, and submit once the roster is ready.</p>
            <div className="attendance-review">
              <div>
                <span>Teacher</span>
                <strong>{session.displayName}</strong>
              </div>
              <div>
                <span>School</span>
                <strong>{session.schoolId}</strong>
              </div>
              <div>
                <span>Auth mode</span>
                <strong>{session.authMode === 'firebase' ? 'Firebase token' : 'Dev session'}</strong>
              </div>
              <div>
                <span>Draft status</span>
                <strong>{isSaving ? 'Saving...' : 'Ready'}</strong>
              </div>
            </div>
            <div className="attendance-actions attendance-actions--stacked">
              <button className="button button--ghost" type="button" onClick={markAllPresent}>
                Mark all present
              </button>
              <button className="button button--ghost" type="button" onClick={clearMarks}>
                Reset roster
              </button>
            </div>
            <button className="button button--primary attendance-submit" type="button" onClick={handleSubmit}>
              Submit daily attendance
            </button>
          </aside>
        </div>
      </Panel>
    </div>
  );
}
