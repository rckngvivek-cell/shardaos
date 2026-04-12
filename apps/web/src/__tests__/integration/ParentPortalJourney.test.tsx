import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import parentReducer from '../../src/store/parentSlice';
import ParentPortal from '../../src/pages/parent-portal';

describe('Parent Portal - Complete User Journey', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        parent: parentReducer,
      },
    });
    localStorage.clear();
  });

  describe('Authentication Journey', () => {
    it('should complete parent email + OTP login', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      // Find email input
      const emailInput = screen.getByTestId('parent-email-input');
      fireEvent.change(emailInput, { target: { value: 'parent@school.com' } });

      // Click send OTP
      const sendOtpButton = screen.getByTestId('parent-send-otp-button');
      fireEvent.click(sendOtpButton);

      // Wait for OTP input
      await waitFor(() => {
        expect(screen.getByTestId('parent-otp-input')).toBeInTheDocument();
      });

      // Enter OTP
      const otpInput = screen.getByTestId('parent-otp-input');
      fireEvent.change(otpInput, { target: { value: '123456' } });

      // Verify OTP
      const verifyButton = screen.getByTestId('parent-verify-otp-button');
      fireEvent.click(verifyButton);

      // Should navigate to children dashboard
      await waitFor(() => {
        expect(screen.getByTestId('children-dashboard')).toBeInTheDocument();
      });
    });

    it('should persist login token in localStorage', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      const emailInput = screen.getByTestId('parent-email-input');
      fireEvent.change(emailInput, { target: { value: 'parent@school.com' } });

      const sendOtpButton = screen.getByTestId('parent-send-otp-button');
      fireEvent.click(sendOtpButton);

      const otpInput = await screen.findByTestId('parent-otp-input');
      fireEvent.change(otpInput, { target: { value: '123456' } });

      const verifyButton = screen.getByTestId('parent-verify-otp-button');
      fireEvent.click(verifyButton);

      // Verify token in localStorage
      await waitFor(() => {
        expect(localStorage.getItem('parentAuthToken')).toBeDefined();
        expect(localStorage.getItem('parentEmail')).toBe('parent@school.com');
      });
    });
  });

  describe('Dashboard Navigation', () => {
    beforeEach(() => {
      // Mock authenticated state
      localStorage.setItem('parentAuthToken', 'test-token-123');
      localStorage.setItem('parentEmail', 'parent@school.com');
    });

    it('should display children dashboard with multi-child selector', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      // Should see children dashboard
      expect(screen.getByTestId('children-dashboard')).toBeInTheDocument();

      // Should have child selector
      const childSelector = screen.getByTestId('child-selector');
      expect(childSelector).toBeInTheDocument();
    });

    it('should navigate to attendance details', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      // Click attendance button
      const attendanceButton = screen.getByTestId('view-attendance-button');
      fireEvent.click(attendanceButton);

      // Should navigate to attendance detail
      await waitFor(() => {
        expect(screen.getByTestId('attendance-detail')).toBeInTheDocument();
      });
    });

    it('should navigate to grades details', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      // Click grades button
      const gradesButton = screen.getByTestId('view-grades-button');
      fireEvent.click(gradesButton);

      // Should navigate to grades detail
      await waitFor(() => {
        expect(screen.getByTestId('grades-detail')).toBeInTheDocument();
      });
    });

    it('should navigate to announcements', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      // Click announcements button
      const announcementsButton = screen.getByTestId('view-announcements-button');
      fireEvent.click(announcementsButton);

      // Should navigate to announcements
      await waitFor(() => {
        expect(screen.getByTestId('announcements-page')).toBeInTheDocument();
      });
    });
  });

  describe('Attendance Workflow', () => {
    beforeEach(() => {
      localStorage.setItem('parentAuthToken', 'test-token-123');
      localStorage.setItem('parentEmail', 'parent@school.com');
    });

    it('should show attendance stats and visualization', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      const attendanceButton = screen.getByTestId('view-attendance-button');
      fireEvent.click(attendanceButton);

      await waitFor(() => {
        // Check for stats display
        expect(screen.getByTestId('attendance-percentage')).toBeInTheDocument();
        expect(screen.getByTestId('present-count')).toBeInTheDocument();
        expect(screen.getByTestId('absent-count')).toBeInTheDocument();
        expect(screen.getByTestId('leave-count')).toBeInTheDocument();
      });
    });

    it('should toggle between table and chart views', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      const attendanceButton = screen.getByTestId('view-attendance-button');
      fireEvent.click(attendanceButton);

      await waitFor(() => {
        // Check default is table view
        expect(screen.getByTestId('attendance-table')).toBeInTheDocument();
      });

      // Toggle to chart view
      const chartViewButton = screen.getByTestId('chart-view-button');
      fireEvent.click(chartViewButton);

      // Check chart is now visible
      await waitFor(() => {
        expect(screen.getByTestId('attendance-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Grades Workflow', () => {
    beforeEach(() => {
      localStorage.setItem('parentAuthToken', 'test-token-123');
      localStorage.setItem('parentEmail', 'parent@school.com');
    });

    it('should filter grades by term', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      const gradesButton = screen.getByTestId('view-grades-button');
      fireEvent.click(gradesButton);

      await waitFor(() => {
        expect(screen.getByTestId('grades-detail')).toBeInTheDocument();
      });

      // Check default is term 1
      const term1Button = screen.getByTestId('term-1-button');
      expect(term1Button).toHaveClass('active');

      // Switch to term 2
      const term2Button = screen.getByTestId('term-2-button');
      fireEvent.click(term2Button);

      await waitFor(() => {
        expect(term2Button).toHaveClass('active');
      });
    });

    it('should display grade average calculation', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      const gradesButton = screen.getByTestId('view-grades-button');
      fireEvent.click(gradesButton);

      await waitFor(() => {
        const averageScore = screen.getByTestId('average-score');
        expect(averageScore).toBeInTheDocument();
        expect(averageScore.textContent).toMatch(/\d+(\.\d+)?/);
      });
    });
  });

  describe('Communication Workflow', () => {
    beforeEach(() => {
      localStorage.setItem('parentAuthToken', 'test-token-123');
      localStorage.setItem('parentEmail', 'parent@school.com');
    });

    it('should display announcements with search and filter', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      const announcementsButton = screen.getByTestId('view-announcements-button');
      fireEvent.click(announcementsButton);

      await waitFor(() => {
        expect(screen.getByTestId('announcements-page')).toBeInTheDocument();
      });

      // Check search functionality
      const searchInput = screen.getByTestId('announcement-search');
      fireEvent.change(searchInput, { target: { value: 'exam' } });

      await waitFor(() => {
        const announcements = screen.getAllByTestId('announcement-card');
        announcements.forEach((card) => {
          expect(
            card.textContent.toLowerCase().includes('exam')
          ).toBeTruthy();
        });
      });
    });

    it('should filter announcements by category', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      const announcementsButton = screen.getByTestId('view-announcements-button');
      fireEvent.click(announcementsButton);

      await waitFor(() => {
        expect(screen.getByTestId('announcements-page')).toBeInTheDocument();
      });

      // Click events category
      const eventsCategory = screen.getByTestId('category-events');
      fireEvent.click(eventsCategory);

      // Check filtered announcements
      await waitFor(() => {
        const announcements = screen.getAllByTestId('announcement-card');
        announcements.forEach((card) => {
          expect(card.getAttribute('data-category')).toBe('events');
        });
      });
    });

    it('should compose and send messages to teachers', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      // Navigate to messages (via sidebar or main menu)
      const messagesLink = screen.getByTestId('messages-link');
      fireEvent.click(messagesLink);

      await waitFor(() => {
        expect(screen.getByTestId('messages-page')).toBeInTheDocument();
      });

      // Select a teacher message
      const messageItem = screen.getByTestId('message-item-0');
      fireEvent.click(messageItem);

      // Compose reply
      const replyInput = screen.getByTestId('reply-input');
      fireEvent.change(replyInput, {
        target: { value: 'Thank you for the update.' },
      });

      // Send reply
      const sendButton = screen.getByTestId('send-reply-button');
      fireEvent.click(sendButton);

      // Verify reply sent
      await waitFor(() => {
        expect(screen.getByText('Thank you for the update.')).toBeInTheDocument();
      });
    });
  });

  describe('Settings Workflow', () => {
    beforeEach(() => {
      localStorage.setItem('parentAuthToken', 'test-token-123');
      localStorage.setItem('parentEmail', 'parent@school.com');
    });

    it('should edit account settings', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      // Navigate to settings
      const settingsLink = screen.getByTestId('settings-link');
      fireEvent.click(settingsLink);

      await waitFor(() => {
        expect(screen.getByTestId('settings-page')).toBeInTheDocument();
      });

      // Edit phone
      const phoneInput = screen.getByTestId('settings-phone-input');
      fireEvent.change(phoneInput, { target: { value: '+919876543210' } });

      // Save
      const saveButton = screen.getByTestId('save-settings-button');
      fireEvent.click(saveButton);

      // Verify saved
      await waitFor(() => {
        expect(screen.getByTestId('settings-save-success')).toBeInTheDocument();
      });
    });

    it('should toggle notification preferences', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      const settingsLink = screen.getByTestId('settings-link');
      fireEvent.click(settingsLink);

      await waitFor(() => {
        expect(screen.getByTestId('settings-page')).toBeInTheDocument();
      });

      // Toggle email notifications
      const emailNotifToggle = screen.getByTestId(
        'notification-email-toggle'
      );
      fireEvent.click(emailNotifToggle);

      // Verify change
      expect(emailNotifToggle).toHaveAttribute('data-checked', 'false');

      // Save
      const saveButton = screen.getByTestId('save-settings-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-save-success')).toBeInTheDocument();
      });
    });

    it('should change language preference', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      const settingsLink = screen.getByTestId('settings-link');
      fireEvent.click(settingsLink);

      await waitFor(() => {
        expect(screen.getByTestId('settings-page')).toBeInTheDocument();
      });

      // Select Hindi
      const hindiButton = screen.getByTestId('language-hindi-button');
      fireEvent.click(hindiButton);

      // Verify language changed
      expect(hindiButton).toHaveClass('selected');

      // Save
      const saveButton = screen.getByTestId('save-settings-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('settings-save-success')).toBeInTheDocument();
      });
    });
  });

  describe('Multi-Child Support', () => {
    beforeEach(() => {
      localStorage.setItem('parentAuthToken', 'test-token-123');
      localStorage.setItem('parentEmail', 'parent@school.com');
    });

    it('should switch between children', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      // Open child selector
      const childSelector = screen.getByTestId('child-selector');
      fireEvent.click(childSelector);

      // Select second child
      const child2Option = screen.getByTestId('child-option-2');
      fireEvent.click(child2Option);

      // Verify data updated
      await waitFor(() => {
        const studentName = screen.getByTestId('student-name');
        expect(studentName.textContent).toBe('Emma Johnson');
      });
    });

    it('should update stats when switching children', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      // Get initial attendance %
      const attendancePercentage = screen.getByTestId('attendance-percentage');
      const initialAttendance = attendancePercentage.textContent;

      // Switch child
      const childSelector = screen.getByTestId('child-selector');
      fireEvent.click(childSelector);

      const child2Option = screen.getByTestId('child-option-2');
      fireEvent.click(child2Option);

      // Verify stats changed
      await waitFor(() => {
        expect(attendancePercentage.textContent).not.toBe(initialAttendance);
      });
    });
  });

  describe('Logout Journey', () => {
    beforeEach(() => {
      localStorage.setItem('parentAuthToken', 'test-token-123');
      localStorage.setItem('parentEmail', 'parent@school.com');
    });

    it('should logout and clear session', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ParentPortal />
          </Router>
        </Provider>
      );

      // Navigate to settings
      const settingsLink = screen.getByTestId('settings-link');
      fireEvent.click(settingsLink);

      await waitFor(() => {
        expect(screen.getByTestId('settings-page')).toBeInTheDocument();
      });

      // Click logout
      const logoutButton = screen.getByTestId('logout-button');
      fireEvent.click(logoutButton);

      // Confirm logout
      const confirmButton = screen.getByTestId('confirm-logout-button');
      fireEvent.click(confirmButton);

      // Should return to login
      await waitFor(() => {
        expect(screen.getByTestId('parent-login-page')).toBeInTheDocument();
      });

      // Verify localStorage cleared
      expect(localStorage.getItem('parentAuthToken')).toBeNull();
    });
  });
});
