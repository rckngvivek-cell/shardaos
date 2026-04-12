import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '@/store';
import LoginScreen from '@/screens/LoginScreen';
import * as AsyncStorage from '@react-native-async-storage/async-storage';

const mockNavigation = {
  replace: jest.fn(),
};

const renderWithRedux = (component: React.ReactElement) => {
  return render(<Provider store={store}>{component}</Provider>);
};

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login screen with phone and email sections', () => {
    const { getByText, getByPlaceholderText } = renderWithRedux(
      <LoginScreen navigation={mockNavigation} />
    );

    expect(getByText('School ERP')).toBeTruthy();
    expect(getByText('Student App')).toBeTruthy();
    expect(getByText('Login with Phone')).toBeTruthy();
    expect(getByText('Login with Email')).toBeTruthy();
    expect(getByPlaceholderText('Enter 10-digit phone number')).toBeTruthy();
    expect(getByPlaceholderText('Enter email')).toBeTruthy();
  });

  it('should validate phone number format', async () => {
    const { getByText, getByPlaceholderText, getByDisplayValue } = renderWithRedux(
      <LoginScreen navigation={mockNavigation} />
    );

    const phoneInput = getByPlaceholderText('Enter 10-digit phone number');
    fireEvent.changeText(phoneInput, '123'); // Invalid

    const sendOtpButton = getByText('Send OTP');
    fireEvent.press(sendOtpButton);

    await waitFor(() => {
      expect(getByText(/valid 10-digit phone number/i)).toBeTruthy();
    });
  });

  it('should accept valid phone number and show OTP input', async () => {
    const { getByText, getByPlaceholderText } = renderWithRedux(
      <LoginScreen navigation={mockNavigation} />
    );

    const phoneInput = getByPlaceholderText('Enter 10-digit phone number');
    fireEvent.changeText(phoneInput, '9876543210');

    const sendOtpButton = getByText('Send OTP');
    fireEvent.press(sendOtpButton);

    await waitFor(() => {
      expect(getByPlaceholderText('Enter 6-digit OTP')).toBeTruthy();
    });
  });

  it('should handle email/password login', async () => {
    const { getByText, getByPlaceholderText } = renderWithRedux(
      <LoginScreen navigation={mockNavigation} />
    );

    const emailInput = getByPlaceholderText('Enter email');
    const passwordInput = getByPlaceholderText('Enter password');

    fireEvent.changeText(emailInput, 'test@school.edu');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('Login');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });
});
