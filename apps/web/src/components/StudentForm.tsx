import { FormEvent, useState } from 'react';

type StudentFormValues = {
  firstName: string;
  lastName: string;
  dob: string;
  rollNumber: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
};

const initialValues: StudentFormValues = {
  firstName: '',
  lastName: '',
  dob: '',
  rollNumber: '',
  parentName: '',
  parentPhone: '',
  parentEmail: ''
};

interface StudentFormProps {
  onSubmit: (values: StudentFormValues) => Promise<void>;
  pending: boolean;
}

export function StudentForm({ onSubmit, pending }: StudentFormProps) {
  const [values, setValues] = useState(initialValues);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(values);
    setValues(initialValues);
  }

  return (
    <form className="panel form-panel" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Student Intake</p>
          <h2>Add Student</h2>
        </div>
        <span className="status-pill">{pending ? 'Saving' : 'Ready'}</span>
      </div>
      <div className="form-grid">
        <label>
          First name
          <input
            required
            value={values.firstName}
            onChange={(event) => setValues((current) => ({ ...current, firstName: event.target.value }))}
          />
        </label>
        <label>
          Last name
          <input
            required
            value={values.lastName}
            onChange={(event) => setValues((current) => ({ ...current, lastName: event.target.value }))}
          />
        </label>
        <label>
          Date of birth
          <input
            required
            type="date"
            value={values.dob}
            onChange={(event) => setValues((current) => ({ ...current, dob: event.target.value }))}
          />
        </label>
        <label>
          Roll number
          <input
            required
            value={values.rollNumber}
            onChange={(event) => setValues((current) => ({ ...current, rollNumber: event.target.value }))}
          />
        </label>
        <label>
          Parent name
          <input
            required
            value={values.parentName}
            onChange={(event) => setValues((current) => ({ ...current, parentName: event.target.value }))}
          />
        </label>
        <label>
          Parent phone
          <input
            required
            value={values.parentPhone}
            onChange={(event) => setValues((current) => ({ ...current, parentPhone: event.target.value }))}
          />
        </label>
        <label className="full-width">
          Parent email
          <input
            type="email"
            value={values.parentEmail}
            onChange={(event) => setValues((current) => ({ ...current, parentEmail: event.target.value }))}
          />
        </label>
      </div>
      <button className="primary-button" disabled={pending} type="submit">
        {pending ? 'Saving student...' : 'Create student'}
      </button>
    </form>
  );
}
