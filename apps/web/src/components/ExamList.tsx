import React, { useState } from 'react';
import { useGetExamsQuery, useCreateExamMutation } from '../services/examApi';
import type { Exam } from '../services/examApi';
import './ExamList.css';

interface ExamListProps {
  schoolId: string;
  onSelectExam?: (exam: Exam) => void;
  isAdmin?: boolean;
}

export const ExamList: React.FC<ExamListProps> = ({ schoolId, onSelectExam, isAdmin = false }) => {
  const { data, isLoading, error } = useGetExamsQuery({ schoolId });
  const [createExam, { isLoading: isCreating }] = useCreateExamMutation();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    totalMarks: 100,
    durationMinutes: 60,
    classId: ''
  });

  const exams = data?.data || [];

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createExam({
        ...formData,
        schoolId,
        status: 'draft' as const,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + formData.durationMinutes * 60000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).unwrap();
      setShowForm(false);
      setFormData({ title: '', subject: '', totalMarks: 100, durationMinutes: 60, classId: '' });
    } catch (err) {
      console.error('Failed to create exam:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'badge-draft',
      scheduled: 'badge-scheduled',
      ongoing: 'badge-ongoing',
      completed: 'badge-completed'
    };
    return badges[status] || 'badge-default';
  };

  if (isLoading) return <div className="exam-list-loading">Loading exams...</div>;

  if (error) return <div className="exam-list-error">Failed to load exams. Try refreshing.</div>;

  return (
    <div className="exam-list-container">
      <div className="exam-list-header">
        <h2>Exams</h2>
        {isAdmin && (
          <button 
            className="btn-create" 
            onClick={() => setShowForm(!showForm)}
            disabled={isCreating}
          >
            {showForm ? 'Cancel' : '+ New Exam'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form className="exam-form" onSubmit={handleCreateExam}>
          <input
            type="text"
            placeholder="Exam Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Total Marks"
            value={formData.totalMarks}
            onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
            required
          />
          <input
            type="number"
            placeholder="Duration (minutes)"
            value={formData.durationMinutes}
            onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
            required
          />
          <input
            type="text"
            placeholder="Class ID"
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            required
          />
          <button type="submit" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Exam'}
          </button>
        </form>
      )}

      {exams.length === 0 ? (
        <div className="exam-list-empty">
          <p>No exams found for this school.</p>
        </div>
      ) : (
        <div className="exam-grid">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="exam-card"
              onClick={() => onSelectExam?.(exam)}
              role="button"
              tabIndex={0}
            >
              <div className="exam-card-header">
                <h3>{exam.title}</h3>
                <span className={`status-badge ${getStatusBadge(exam.status)}`}>
                  {exam.status}
                </span>
              </div>
              <div className="exam-card-body">
                <p><strong>Subject:</strong> {exam.subject || 'N/A'}</p>
                <p><strong>Total Marks:</strong> {exam.totalMarks}</p>
                <p><strong>Duration:</strong> {exam.durationMinutes} mins</p>
                <p><strong>Class:</strong> {exam.classId}</p>
                <p className="exam-date">
                  <strong>Date:</strong> {new Date(exam.startTime).toLocaleDateString()}
                </p>
              </div>
              {!isAdmin && exam.status === 'ongoing' && (
                <button className="btn-start-exam">Start Exam</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamList;
