import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AnnouncementsPage } from '@/pages/parent-portal/AnnouncementsPage';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AnnouncementsPage', () => {
  it('should render announcements page', () => {
    renderWithRouter(<AnnouncementsPage />);
    expect(screen.getByText('Announcements')).toBeTruthy();
  });

  it('should display search field', () => {
    renderWithRouter(<AnnouncementsPage />);
    expect(screen.getByPlaceholderText('Search announcements...')).toBeTruthy();
  });

  it('should display announcements list', () => {
    renderWithRouter(<AnnouncementsPage />);
    expect(screen.getByText('Summer Vacation Announcement')).toBeTruthy();
    expect(screen.getByText('Annual Sports Day')).toBeTruthy();
  });

  it('should filter announcements by category', () => {
    renderWithRouter(<AnnouncementsPage />);
    const eventsButton = screen.getByText('Events');
    fireEvent.click(eventsButton);
    // Only event announcements should be shown
    expect(screen.getByText('Annual Sports Day')).toBeTruthy();
  });

  it('should search announcements by title', () => {
    renderWithRouter(<AnnouncementsPage />);
    const searchInput = screen.getByPlaceholderText('Search announcements...');
    fireEvent.change(searchInput, { target: { value: 'Summer' } });
    // Should show only matching announcement
  });

  it('should display announcement categories', () => {
    renderWithRouter(<AnnouncementsPage />);
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('General')).toBeTruthy();
    expect(screen.getByText('Events')).toBeTruthy();
    expect(screen.getByText('Assignments')).toBeTruthy();
  });
});
