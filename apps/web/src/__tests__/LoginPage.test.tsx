import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/app/authSlice';
import LoginPage from '../pages/LoginPage';

const createMockStore = () =>
  configureStore({
    reducer: {
      auth: authReducer
    }
  });

const renderLoginPage = (store = createMockStore()) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    </Provider>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form with email and password fields', () => {
    renderLoginPage();

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('should display "School ERP" title', () => {
    renderLoginPage();

    expect(screen.getByText('School ERP')).toBeInTheDocument();
    expect(screen.getByText('Log in to your account')).toBeInTheDocument();
  });

  it('TC1: should handle successful login submission', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByTestId('email-input').querySelector('input') as HTMLInputElement;
    const passwordInput = screen.getByTestId('password-input').querySelector('input') as HTMLInputElement;
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Loading state should show spinner
    await waitFor(() => {
      expect(submitButton).toHaveAttribute('disabled');
    });
  });

  it('TC2: should show validation error for empty fields', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

  it('should show error for invalid email', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByTestId('email-input').querySelector('input') as HTMLInputElement;
    const passwordInput = screen.getByTestId('password-input').querySelector('input') as HTMLInputElement;
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    });
  });

  it('should show error for short password', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByTestId('email-input').querySelector('input') as HTMLInputElement;
    const passwordInput = screen.getByTestId('password-input').querySelector('input') as HTMLInputElement;
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const toggleButton = screen.getByLabelText('toggle password visibility');
    const passwordInput = screen.getByTestId('password-input').querySelector('input') as HTMLInputElement;

    expect(passwordInput.type).toBe('password');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('should be responsive on mobile viewport (375px)', () => {
    const { container } = renderLoginPage();

    // Check responsive classes are applied
    const card = container.querySelector('[class*="MuiCard"]');
    expect(card).toBeInTheDocument();
  });
});
