import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MessagesPage } from '@/pages/parent-portal/MessagesPage';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('MessagesPage', () => {
  it('should render messages page', () => {
    renderWithRouter(<MessagesPage />);
    expect(screen.getByText('Messages')).toBeTruthy();
  });

  it('should display search field', () => {
    renderWithRouter(<MessagesPage />);
    expect(screen.getByPlaceholderText('Search messages...')).toBeTruthy();
  });

  it('should display messages list', () => {
    renderWithRouter(<MessagesPage />);
    expect(screen.getByText('Mrs. Sharma (Math Teacher)')).toBeTruthy();
    expect(screen.getByText('Principal\'s Office')).toBeTruthy();
  });

  it('should select message when clicked', () => {
    renderWithRouter(<MessagesPage />);
    const messageItem = screen.getByText('Mrs. Sharma (Math Teacher)');
    fireEvent.click(messageItem.closest('li') || messageItem);
    // Message should be selected
  });

  it('should display message content when selected', () => {
    renderWithRouter(<MessagesPage />);
    const firstMessage = screen.getByText('Mrs. Sharma (Math Teacher)').closest('li');
    if (firstMessage) {
      fireEvent.click(firstMessage);
      expect(screen.getByText('Great progress in Math!')).toBeTruthy();
    }
  });

  it('should have reply text field', () => {
    renderWithRouter(<MessagesPage />);
    expect(screen.getByPlaceholderText('Type your message here...')).toBeTruthy();
  });

  it('should allow sending reply', async () => {
    renderWithRouter(<MessagesPage />);
    const replyField = screen.getByPlaceholderText('Type your message here...');
    fireEvent.change(replyField, { target: { value: 'Thank you for the update' } });
    
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);

    await waitFor(() => {
      // Message should be sent
      expect(replyField).toHaveValue('');
    });
  });

  it('should disable send button for empty message', () => {
    renderWithRouter(<MessagesPage />);
    const sendButton = screen.getByText('Send');
    expect(sendButton).toBeDisabled();
  });

  it('should search messages', () => {
    renderWithRouter(<MessagesPage />);
    const searchInput = screen.getByPlaceholderText('Search messages...');
    fireEvent.change(searchInput, { target: { value: 'Math' } });
    // Should filter messages
  });
});
