import React, { useMemo } from 'react';
import { useGetResultsQuery } from '../services/examApi';
import type { ExamResult } from '../services/examApi';
import './ResultsViewer.css';

interface ResultsViewerProps {
  schoolId: string;
  examId?: string;
  studentId?: string;
  viewMode?: 'student' | 'admin' | 'class';
}

export const ResultsViewer: React.FC<ResultsViewerProps> = ({
  schoolId,
  examId,
  studentId,
  viewMode = 'student'
}) => {
  const { data, isLoading, error } = useGetResultsQuery({
    schoolId,
    examId,
    studentId
  });

  const results = data?.data || [];

  // Calculate statistics
  const stats = useMemo(() => {
    if (results.length === 0) return null;

    const scores = results.map((r) => r.percentage);
    const avgPercentage = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxPercentage = Math.max(...scores);
    const minPercentage = Math.min(...scores);
    const passCount = results.filter((r) => r.percentage >= 40).length;
    const failCount = results.length - passCount;

    return {
      totalResults: results.length,
      averagePercentage: avgPercentage.toFixed(2),
      maxPercentage,
      minPercentage,
      passCount,
      failCount,
      passRate: ((passCount / results.length) * 100).toFixed(2)
    };
  }, [results]);

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A': 'grade-a',
      'B': 'grade-b',
      'C': 'grade-c',
      'D': 'grade-d',
      'F': 'grade-f'
    };
    return colors[grade] || 'grade-default';
  };

  const getPerformanceStatus = (percentage: number) => {
    if (percentage >= 80) return { status: 'Excellent', icon: '⭐' };
    if (percentage >= 60) return { status: 'Good', icon: '👍' };
    if (percentage >= 40) return { status: 'Adequate', icon: '➖' };
    return { status: 'Needs Improvement', icon: '⚠️' };
  };

  if (isLoading) return <div className="results-loading">Loading results...</div>;

  if (error) return <div className="results-error">Failed to load results. Please try again.</div>;

  if (results.length === 0) {
    return <div className="results-empty">No results found.</div>;
  }

  return (
    <div className="results-viewer-container">
      <div className="results-header">
        <h2>Exam Results</h2>
      </div>

      {stats && (viewMode === 'admin' || viewMode === 'class') && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Results</div>
            <div className="stat-value">{stats.totalResults}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Average Score</div>
            <div className="stat-value">{stats.averagePercentage}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pass Rate</div>
            <div className="stat-value">{stats.passRate}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Highest Score</div>
            <div className="stat-value">{stats.maxPercentage}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Lowest Score</div>
            <div className="stat-value">{stats.minPercentage}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Passed / Failed</div>
            <div className="stat-value">{stats.passCount} / {stats.failCount}</div>
          </div>
        </div>
      )}

      <div className="results-table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>Student ID</th>
              {viewMode === 'admin' || viewMode === 'class' ? (
                <>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>Graded Date</th>
                </>
              ) : (
                <>
                  <th>Score</th>
                  <th>Out of</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Performance</th>
                  <th>Date</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {results.map((result) => {
              const performance = getPerformanceStatus(result.percentage);
              const isPassed = result.percentage >= 40;

              return (
                <tr key={result.id} className={isPassed ? 'row-pass' : 'row-fail'}>
                  <td className="student-id">{result.studentId}</td>
                  <td className="score">{result.score}</td>
                  {viewMode === 'admin' || viewMode === 'class' ? (
                    <>
                      <td className="percentage">{result.percentage.toFixed(2)}%</td>
                      <td className={`grade ${getGradeColor(result.grade)}`}>{result.grade}</td>
                      <td className="status">
                        <span className={`status-badge ${isPassed ? 'status-pass' : 'status-fail'}`}>
                          {isPassed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td className="date">{new Date(result.gradedAt).toLocaleDateString()}</td>
                    </>
                  ) : (
                    <>
                      <td className="total-marks">{result.totalMarks}</td>
                      <td className="percentage">{result.percentage.toFixed(2)}%</td>
                      <td className={`grade ${getGradeColor(result.grade)}`}>{result.grade}</td>
                      <td className="performance">
                        <span className={`performance-badge ${isPassed ? 'perf-good' : 'perf-poor'}`}>
                          {performance.icon} {performance.status}
                        </span>
                      </td>
                      <td className="date">{new Date(result.gradedAt).toLocaleDateString()}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viewMode === 'student' && results.length > 0 && (
        <div className="result-details">
          <div className="result-card">
            <h3>Your Performance Summary</h3>
            <div className="performance-details">
              {results.map((result) => {
                const performance = getPerformanceStatus(result.percentage);
                return (
                  <div key={result.id} className="detail-item">
                    <p>
                      <strong>Score:</strong> {result.score}/{result.totalMarks} ({result.percentage.toFixed(2)}%)
                    </p>
                    <p>
                      <strong>Grade:</strong> <span className={`grade ${getGradeColor(result.grade)}`}>{result.grade}</span>
                    </p>
                    <p>
                      <strong>Performance:</strong> {performance.icon} {performance.status}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsViewer;
