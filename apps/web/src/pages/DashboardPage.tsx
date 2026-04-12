import { useAppSelector } from '@/app/hooks';
import { useGetSchoolQuery, useListStudentsQuery } from '../services/schoolErpApi';

export function DashboardPage() {
  const schoolId = useAppSelector((state) => state.session.schoolId);
  const authMode = useAppSelector((state) => state.session.authMode);
  const { data: school } = useGetSchoolQuery(schoolId);
  const { data: students = [] } = useListStudentsQuery({ schoolId });

  const metrics = [
    { label: 'Active students', value: students.length, note: 'Student CRUD slice live' },
    { label: 'Staff count', value: school?.staffCount ?? '--', note: 'Demo data from school endpoint' },
    {
      label: 'Monthly fee',
      value: school ? `Rs ${school.subscription.monthlyFee.toLocaleString('en-IN')}` : '--',
      note: authMode === 'firebase' ? 'Firebase session selected' : 'Current local development session',
    },
  ];

  return (
    <div className="page">
      <section className="hero panel">
        <div>
          <p className="eyebrow">Founder Recommendation</p>
          <h2>Rural India first, with the student module as the initial launch slice.</h2>
        </div>
        <p className="hero-copy">
          The docs converge on a low-friction pilot strategy. This shell keeps the school-facing UI simple,
          mobile-aware, and ready to expand into attendance and exams next.
        </p>
      </section>

      <section className="metrics-grid">
        {metrics.map((metric) => (
          <article className="metric-card panel" key={metric.label}>
            <p className="eyebrow">{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.note}</span>
          </article>
        ))}
      </section>

      <section className="panel split-panel">
        <div>
          <p className="eyebrow">School snapshot</p>
          <h3>{school?.name ?? 'Loading school...'}</h3>
          <p>{school ? `${school.city}, ${school.state}` : 'Reading school profile from API.'}</p>
        </div>
        <div className="timeline">
          <div>
            <span>Week 1</span>
            <strong>API + environment</strong>
          </div>
          <div>
            <span>Week 2</span>
            <strong>Student CRUD + UI</strong>
          </div>
          <div>
            <span>Next</span>
            <strong>Attendance workflows</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
