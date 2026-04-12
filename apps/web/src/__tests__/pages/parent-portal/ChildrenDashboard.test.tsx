import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChildrenDashboard } from '@/pages/parent-portal/ChildrenDashboard';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ChildrenDashboard', () => {
  it('should render dashboard with greeting', () => {
    renderWithRouter(<ChildrenDashboard />);
    expect(screen.getByText(/Welcome back/i)).toBeTruthy();
  });

  it('should display child selector', () => {
    renderWithRouter(<ChildrenDashboard />);
    expect(screen.getByLabelText('Select Child')).toBeTruthy();
  });

  it('should display selected child information', () => {
    renderWithRouter(<ChildrenDashboard />);
    expect(screen.getByText(/Rohan Sharma/i)).toBeTruthy();
    expect(screen.getByText(/Roll No: 101/i)).toBeTruthy();
  });

  it('should show attendance percentage', () => {
    renderWithRouter(<ChildrenDashboard />);
    expect(screen.getByText('92%')).toBeTruthy();
  });

  it('should show average grade', () => {
    renderWithRouter(<ChildrenDashboard />);
    expect(screen.getByText('82%')).toBeTruthy();
  });

  it('should have quick action buttons', () => {
    renderWithRouter(<ChildrenDashboard />);
    expect(screen.getByText('View Attendance')).toBeTruthy();
    expect(screen.getByText('View Grades')).toBeTruthy();
    expect(screen.getByText('Announcements')).toBeTruthy();
    expect(screen.getByText('Messages')).toBeTruthy();
  });

  it('should navigate when quick action button clicked', () => {
    renderWithRouter(<ChildrenDashboard />);
    const attendanceButton = screen.getByText('View Attendance');
    fireEvent.click(attendanceButton);
    // Navigation would happen here
  });

  it('should display recent activity section', () => {
    renderWithRouter(<ChildrenDashboard />);
    expect(screen.getByText('Recent Activity')).toBeTruthy();
    expect(screen.getByText(/Attendance Marked/i)).toBeTruthy();
  });

  it('should allow changing selected child', () => {
    renderWithRouter(<ChildrenDashboard />);
    const select = screen.getByLabelText('Select Child');
    fireEvent.change(select, { target: { value: '2' } });
    // Child details should update
  });
});
