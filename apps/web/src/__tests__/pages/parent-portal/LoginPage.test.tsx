import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ParentLoginPage } from '@/pages/parent-portal/LoginPage';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ParentLoginPage', () => {
  it('should render login page with email input', () => {
    renderWithRouter(<ParentLoginPage />);
    expect(screen.getByText('School ERP')).toBeTruthy();
    expect(screen.getByText('Parent Portal')).toBeTruthy();
    expect(screen.getByPlaceholderText('your@email.com')).toBeTruthy();
  });

  it('should validate email format', async () => {
    renderWithRouter(<ParentLoginPage />);
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const sendButton = screen.getByText('Send OTP');

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeTruthy();
    });
  });

  it('should accept valid email and show OTP input', async () => {
    renderWithRouter(<ParentLoginPage />);
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const sendButton = screen.getByText('Send OTP');

    fireEvent.change(emailInput, { target: { value: 'parent@email.com' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeTruthy();
    });
  });

  it('should validate OTP length', async () => {
    renderWithRouter(<ParentLoginPage />);
    
    // First submit valid email
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'parent@email.com' } });
    fireEvent.click(screen.getByText('Send OTP'));

    await waitFor(() => {
      const otpInput = screen.getByPlaceholderText('000000');
      fireEvent.change(otpInput, { target: { value: '12345' } }); // Invalid
      fireEvent.click(screen.getByText('Verify & Login'));
      expect(screen.getByText(/6 digits/i)).toBeTruthy();
    });
  });

  it('should allow going back to email input', async () => {
    renderWithRouter(<ParentLoginPage />);
    
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'parent@email.com' } });
    fireEvent.click(screen.getByText('Send OTP'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Back to Email'));
      expect(screen.getByPlaceholderText('your@email.com')).toBeTruthy();
    });
  });
});
