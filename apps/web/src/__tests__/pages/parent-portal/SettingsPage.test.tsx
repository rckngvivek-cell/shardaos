import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsPage } from '@/pages/parent-portal/SettingsPage';

describe('SettingsPage', () => {
  it('should render settings page', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('Account Information')).toBeTruthy();
  });

  it('should display email and phone fields', () => {
    render(<SettingsPage />);
    const emailInput = screen.getByDisplayValue('parent@email.com');
    const phoneInput = screen.getByDisplayValue('+91 98765 43210');
    expect(emailInput).toBeTruthy();
    expect(phoneInput).toBeTruthy();
  });

  it('should allow editing email', async () => {
    render(<SettingsPage />);
    const emailInput = screen.getByDisplayValue('parent@email.com') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'newemail@domain.com' } });
    expect(emailInput.value).toBe('newemail@domain.com');
  });

  it('should display notification preferences', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Notifications')).toBeTruthy();
    expect(screen.getByLabelText('Enable all notifications')).toBeTruthy();
  });

  it('should toggle notifications', () => {
    render(<SettingsPage />);
    const notificationToggle = screen.getByLabelText('Enable all notifications');
    fireEvent.click(notificationToggle);
    expect(notificationToggle).not.toBeChecked();
  });

  it('should allow changing language', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Language')).toBeTruthy();
    const englishButton = screen.getByText('English').closest('button');
    const hindiButton = screen.getByText('Hindi').closest('button');
    expect(englishButton).toBeTruthy();
    expect(hindiButton).toBeTruthy();
  });

  it('should save settings', async () => {
    render(<SettingsPage />);
    const emailInput = screen.getByDisplayValue('parent@email.com') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'newemail@domain.com' } });
    
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Settings saved successfully!')).toBeTruthy();
    });
  });

  it('should disable save button when no changes', () => {
    render(<SettingsPage />);
    const saveButton = screen.getByText('Save Settings');
    expect(saveButton).toBeDisabled();
  });

  it('should display help links', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Help & Support')).toBeTruthy();
    expect(screen.getByText('Contact Support')).toBeTruthy();
    expect(screen.getByText('FAQ')).toBeTruthy();
  });
});
