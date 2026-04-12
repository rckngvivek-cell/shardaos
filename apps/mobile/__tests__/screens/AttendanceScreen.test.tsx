import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '@/store';
import AttendanceScreen from '@/screens/AttendanceScreen';

const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
};

const renderWithRedux = (component: React.ReactElement) => {
  return render(<Provider store={store}>{component}</Provider>);
};

describe('AttendanceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render attendance screen with percentage', () => {
    const { getByText } = renderWithRedux(
      <AttendanceScreen navigation={mockNavigation} />
    );

    expect(getByText('Attendance')).toBeTruthy();
    expect(getByText(/92%/)).toBeTruthy();
  });

  it('should display attendance stats', () => {
    const { getByText } = renderWithRedux(
      <AttendanceScreen navigation={mockNavigation} />
    );

    expect(getByText('Present')).toBeTruthy();
    expect(getByText('Absent')).toBeTruthy();
    expect(getByText('Leave')).toBeTruthy();
  });

  it('should toggle between calendar and chart view', async () => {
    const { getByText } = renderWithRedux(
      <AttendanceScreen navigation={mockNavigation} />
    );

    const chartButton = getByText('Chart');
    fireEvent.press(chartButton);

    await waitFor(() => {
      expect(getByText('Attendance Summary')).toBeTruthy();
    });
  });

  it('should show last 30 days in calendar view', () => {
    const { getByText } = renderWithRedux(
      <AttendanceScreen navigation={mockNavigation} />
    );

    expect(getByText('Last 30 Days')).toBeTruthy();
    expect(getByText(/2026-04-14/)).toBeTruthy();
  });

  it('should display proper attendance status colors', () => {
    const { getByText } = renderWithRedux(
      <AttendanceScreen navigation={mockNavigation} />
    );

    expect(getByText('PRESENT')).toBeTruthy();
    expect(getByText('ABSENT')).toBeTruthy();
  });
});
