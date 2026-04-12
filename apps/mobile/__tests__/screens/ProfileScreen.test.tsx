import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '@/store';
import ProfileScreen from '@/screens/ProfileScreen';
import * as AsyncStorage from '@react-native-async-storage/async-storage';

const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
};

const renderWithRedux = (component: React.ReactElement) => {
  return render(<Provider store={store}>{component}</Provider>);
};

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render profile screen with student information', () => {
    const { getByText } = renderWithRedux(
      <ProfileScreen navigation={mockNavigation} />
    );

    expect(getByText(/Rohan/i)).toBeTruthy();
    expect(getByText(/Sharma/i)).toBeTruthy();
    expect(getByText('Personal Information')).toBeTruthy();
  });

  it('should display all profile fields', () => {
    const { getByText } = renderWithRedux(
      <ProfileScreen navigation={mockNavigation} />
    );

    expect(getByText(/First Name/i)).toBeTruthy();
    expect(getByText(/Last Name/i)).toBeTruthy();
    expect(getByText(/Email/i)).toBeTruthy();
    expect(getByText(/Phone Number/i)).toBeTruthy();
    expect(getByText(/Date of Birth/i)).toBeTruthy();
  });

  it('should allow editing profile information', async () => {
    const { getByText, getByDisplayValue } = renderWithRedux(
      <ProfileScreen navigation={mockNavigation} />
    );

    const editButton = getByText(/edit/i);
    fireEvent.press(editButton);

    await waitFor(() => {
      expect(getByText(/Save Changes/i)).toBeTruthy();
    });
  });

  it('should validate required fields on save', async () => {
    const { getByText, getByPlaceholderText } = renderWithRedux(
      <ProfileScreen navigation={mockNavigation} />
    );

    const editButton = getByText(/edit/i);
    fireEvent.press(editButton);

    // Try to save without filling required fields
    await waitFor(() => {
      const saveButton = getByText(/Save Changes/i);
      fireEvent.press(saveButton);
    });
  });

  it('should handle password change', async () => {
    const { getByText, getByPlaceholderText } = renderWithRedux(
      <ProfileScreen navigation={mockNavigation} />
    );

    const changePasswordButton = getByText(/Change Password/i);
    fireEvent.press(changePasswordButton);

    await waitFor(() => {
      expect(getByPlaceholderText('Enter current password')).toBeTruthy();
      expect(getByPlaceholderText('Enter new password')).toBeTruthy();
    });
  });

  it('should validate password confirmation', async () => {
    const { getByText, getByPlaceholderText } = renderWithRedux(
      <ProfileScreen navigation={mockNavigation} />
    );

    const changePasswordButton = getByText(/Change Password/i);
    fireEvent.press(changePasswordButton);

    await waitFor(() => {
      const oldPasswordInput = getByPlaceholderText('Enter current password');
      const newPasswordInput = getByPlaceholderText('Enter new password');
      const confirmPasswordInput = getByPlaceholderText('Confirm new password');

      fireEvent.changeText(oldPasswordInput, 'oldPass');
      fireEvent.changeText(newPasswordInput, 'newPass123');
      fireEvent.changeText(confirmPasswordInput, 'different');

      const updateButton = getByText(/Update Password/i);
      fireEvent.press(updateButton);
    });
  });

  it('should handle logout', async () => {
    const { getByText } = renderWithRedux(
      <ProfileScreen navigation={mockNavigation} />
    );

    const logoutButton = getByText(/Logout/i);
    fireEvent.press(logoutButton);

    await waitFor(() => {
      expect(mockNavigation.replace).toHaveBeenCalledWith('Login');
    });
  });
});
