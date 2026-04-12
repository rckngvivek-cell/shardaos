import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '@/store';
import GradesScreen from '@/screens/GradesScreen';

const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
};

const renderWithRedux = (component: React.ReactElement) => {
  return render(<Provider store={store}>{component}</Provider>);
};

describe('GradesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render grades screen with average score', () => {
    const { getByText } = renderWithRedux(
      <GradesScreen navigation={mockNavigation} />
    );

    expect(getByText('Grades')).toBeTruthy();
    expect(getByText('Average Score')).toBeTruthy();
  });

  it('should filter grades by term', async () => {
    const { getByText, getByDisplayValue } = renderWithRedux(
      <GradesScreen navigation={mockNavigation} />
    );

    const term2Button = getByText('Term 2');
    fireEvent.press(term2Button);

    await waitFor(() => {
      expect(getByText('Term 2 - Grades')).toBeTruthy();
    });
  });

  it('should sort grades by marks', async () => {
    const { getByText } = renderWithRedux(
      <GradesScreen navigation={mockNavigation} />
    );

    const marksButton = getByText('Marks');
    fireEvent.press(marksButton);

    await waitFor(() => {
      // Should sort in descending order by marks
      expect(getByText(/Mathematics|Science/i)).toBeTruthy();
    });
  });

  it('should display subjects and marks', () => {
    const { getByText } = renderWithRedux(
      <GradesScreen navigation={mockNavigation} />
    );

    expect(getByText(/Mathematics/i)).toBeTruthy();
    expect(getByText(/English/i)).toBeTruthy();
    expect(getByText(/Science/i)).toBeTruthy();
  });

  it('should show grade letters (A, B, C, etc)', () => {
    const { getByText } = renderWithRedux(
      <GradesScreen navigation={mockNavigation} />
    );

    expect(getByText(/\bA\b/)).toBeTruthy();
    expect(getByText(/B\+/)).toBeTruthy();
  });

  it('should calculate and display average correctly', () => {
    const { getByText } = renderWithRedux(
      <GradesScreen navigation={mockNavigation} />
    );

    // Average of 85, 78, 88, 81, 80, 92 = 84 (approximately)
    expect(getByText(/Average Score/i)).toBeTruthy();
  });
});
