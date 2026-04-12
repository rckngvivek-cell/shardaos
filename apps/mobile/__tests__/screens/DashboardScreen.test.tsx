import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '@/store';
import DashboardScreen from '@/screens/DashboardScreen';
import * as AsyncStorage from '@react-native-async-storage/async-storage';

const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
};

const renderWithRedux = (component: React.ReactElement) => {
  return render(<Provider store={store}>{component}</Provider>);
};

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('student-123');
  });

  it('should render dashboard with student name and attendance', async () => {
    const { getByText } = renderWithRedux(
      <DashboardScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText(/Rohan/i)).toBeTruthy();
      expect(getByText(/Sharma/i)).toBeTruthy();
    });
  });

  it('should display attendance percentage', async () => {
    const { getByText } = renderWithRedux(
      <DashboardScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('92%')).toBeTruthy();
    });
  });

  it('should show recent grades', async () => {
    const { getByText } = renderWithRedux(
      <DashboardScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText(/Mathematics/i)).toBeTruthy();
      expect(getByText(/English/i)).toBeTruthy();
      expect(getByText(/Science/i)).toBeTruthy();
    });
  });

  it('should navigate to attendance when action button clicked', async () => {
    const { getByText } = renderWithRedux(
      <DashboardScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      const attendanceButton = getByText('Attendance');
      fireEvent.press(attendanceButton);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Attendance');
    });
  });

  it('should navigate to grades when action button clicked', async () => {
    const { getByText } = renderWithRedux(
      <DashboardScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      const gradesButton = getByText('Grades');
      fireEvent.press(gradesButton);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Grades');
    });
  });

  it('should logout when logout button pressed', async () => {
    const { getByText } = renderWithRedux(
      <DashboardScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      const logoutButton = getByText('logout') || getByText(/logout/i);
      if (logoutButton) {
        fireEvent.press(logoutButton);
        expect(AsyncStorage.removeItem).toHaveBeenCalled();
      }
    });
  });
});
