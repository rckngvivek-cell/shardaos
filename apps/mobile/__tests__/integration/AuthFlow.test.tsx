import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from '../../src/App';

// Mock Firebase
jest.mock('@react-native-firebase/auth', () => ({
  auth: jest.fn(() => ({
    verifyPhoneNumber: jest.fn().mockResolvedValue({
      verificationId: 'test-verification-id',
    }),
    signInWithCredential: jest.fn().mockResolvedValue({
      user: {
        uid: 'test-user-id',
        phone: '+911234567890',
      },
    }),
    signInWithEmailAndPassword: jest.fn().mockResolvedValue({
      user: {
        uid: 'test-user-id',
        email: 'parent@school.com',
      },
    }),
  })),
  PhoneAuthProvider: {
    credential: jest.fn(),
  },
}));

describe('Mobile App - Auth Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  it('should complete phone OTP login flow', async () => {
    const { rerender } = render(
      <Provider store={configureStore({ reducer: {} })}>
        <App />
      </Provider>
    );

    // Find phone input
    const phoneInput = screen.getByTestId('phone-input');
    fireEvent.changeText(phoneInput, '9876543210');

    // Find send OTP button
    const sendOtpButton = screen.getByTestId('send-otp-button');
    fireEvent.press(sendOtpButton);

    // Wait for OTP field to appear
    await waitFor(() => {
      expect(screen.getByTestId('otp-input')).toBeDefined();
    });

    // Enter OTP
    const otpInput = screen.getByTestId('otp-input');
    fireEvent.changeText(otpInput, '123456');

    // Verify OTP
    const verifyButton = screen.getByTestId('verify-otp-button');
    fireEvent.press(verifyButton);

    // Should navigate to dashboard
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-screen')).toBeDefined();
    });
  });

  it('should store auth token in AsyncStorage', async () => {
    render(
      <Provider store={configureStore({ reducer: {} })}>
        <App />
      </Provider>
    );

    const phoneInput = screen.getByTestId('phone-input');
    fireEvent.changeText(phoneInput, '9876543210');

    const sendOtpButton = screen.getByTestId('send-otp-button');
    fireEvent.press(sendOtpButton);

    const otpInput = await screen.findByTestId('otp-input');
    fireEvent.changeText(otpInput, '123456');

    const verifyButton = screen.getByTestId('verify-otp-button');
    fireEvent.press(verifyButton);

    // Verify token stored
    await waitFor(async () => {
      const token = await AsyncStorage.getItem('userAuthToken');
      expect(token).toBeDefined();
    });
  });

  it('should complete email login flow', async () => {
    render(
      <Provider store={configureStore({ reducer: {} })}>
        <App />
      </Provider>
    );

    // Click email tab
    const emailTab = screen.getByTestId('email-tab');
    fireEvent.press(emailTab);

    // Enter email
    const emailInput = screen.getByTestId('email-input');
    fireEvent.changeText(emailInput, 'parent@school.com');

    // Enter password
    const passwordInput = screen.getByTestId('password-input');
    fireEvent.changeText(passwordInput, 'SecurePass123');

    // Click login
    const loginButton = screen.getByTestId('email-login-button');
    fireEvent.press(loginButton);

    // Should navigate to dashboard
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-screen')).toBeDefined();
    });
  });

  it('should persist login state on app restart', async () => {
    // First login
    const { unmount } = render(
      <Provider store={configureStore({ reducer: {} })}>
        <App />
      </Provider>
    );

    const phoneInput = screen.getByTestId('phone-input');
    fireEvent.changeText(phoneInput, '9876543210');

    const sendOtpButton = screen.getByTestId('send-otp-button');
    fireEvent.press(sendOtpButton);

    const otpInput = await screen.findByTestId('otp-input');
    fireEvent.changeText(otpInput, '123456');

    const verifyButton = screen.getByTestId('verify-otp-button');
    fireEvent.press(verifyButton);

    // Unmount app
    unmount();

    // Remount app
    render(
      <Provider store={configureStore({ reducer: {} })}>
        <App />
      </Provider>
    );

    // Should show dashboard (not login) due to persisted state
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-screen')).toBeDefined();
    });
  });

  it('should handle logout and return to login', async () => {
    render(
      <Provider store={configureStore({ reducer: {} })}>
        <App />
      </Provider>
    );

    // Complete login first
    const phoneInput = screen.getByTestId('phone-input');
    fireEvent.changeText(phoneInput, '9876543210');

    const sendOtpButton = screen.getByTestId('send-otp-button');
    fireEvent.press(sendOtpButton);

    const otpInput = await screen.findByTestId('otp-input');
    fireEvent.changeText(otpInput, '123456');

    const verifyButton = screen.getByTestId('verify-otp-button');
    fireEvent.press(verifyButton);

    // Navigate to dashboard
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-screen')).toBeDefined();
    });

    // Go to profile
    const profileTab = screen.getByTestId('profile-tab');
    fireEvent.press(profileTab);

    // Find logout button
    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.press(logoutButton);

    // Confirm logout
    const confirmButton = screen.getByTestId('confirm-logout-button');
    fireEvent.press(confirmButton);

    // Should return to login
    await waitFor(() => {
      expect(screen.getByTestId('login-screen')).toBeDefined();
    });
  });
});
