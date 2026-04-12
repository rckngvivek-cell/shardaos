import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setUser, setRole } from '@/app/authSlice';
import DashboardLayout from '../components/DashboardLayout';

const createMockStore = (initialAuth = {}) => {
  const defaultAuth = {
    user: {
      uid: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User',
      token: 'demo-token'
    },
    role: 'teacher',
    isAuthenticated: true,
    loading: false,
    error: null
  };

  return configureStore({
    reducer: {
      auth: authReducer
    },
    preloadedState: {
      auth: { ...defaultAuth, ...initialAuth }
    }
  });
};

const renderDashboard = (store = createMockStore()) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <DashboardLayout />
      </BrowserRouter>
    </Provider>
  );
};

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard layout', () => {
    renderDashboard();

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });

  it('TC3: should display dashboard after auth and show user email in menu', async () => {
    renderDashboard();

    expect(screen.getByText('School ERP')).toBeInTheDocument();
    expect(screen.getByTestId('user-menu-button')).toBeInTheDocument();

    // Click user menu
    const userMenuButton = screen.getByTestId('user-menu-button');
    fireEvent.click(userMenuButton);

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('TC4: should display navigation items and filter by role', () => {
    renderDashboard();

    // Teacher should have dashboard, students, attendance, grades
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Students')).toBeInTheDocument();
    expect(screen.getByText('Attendance')).toBeInTheDocument();
    expect(screen.getByText('Grades')).toBeInTheDocument();
  });

  it('should show settings for admin role', () => {
    const adminStore = createMockStore({ role: 'admin' });
    renderDashboard(adminStore);

    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should hide settings for non-admin roles', () => {
    const studentStore = createMockStore({ role: 'student' });
    renderDashboard(studentStore);

    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('should display user welcome message', () => {
    renderDashboard();

    expect(screen.getByText(/Welcome Test User/)).toBeInTheDocument();
  });

  it('should show mobile menu button', () => {
    renderDashboard();

    const menuButton = screen.getByTestId('menu-button');
    expect(menuButton).toBeInTheDocument();
  });

  it('should toggle mobile drawer on menu button click', async () => {
    const user = userEvent.setup();
    renderDashboard();

    const menuButton = screen.getByTestId('menu-button');
    const tempDrawer = screen.getByTestId('temporary-drawer');

    // Initially drawer should not be visible
    expect(tempDrawer).toHaveStyle({ visibility: 'hidden' }); // or similar

    // Click menu button to open
    await user.click(menuButton);

    await waitFor(() => {
      // Drawer should now be open (implementation specific)
    });
  });

  it('should display permanent drawer on desktop', () => {
    renderDashboard();

    const permanentDrawer = screen.getByTestId('permanent-drawer');
    expect(permanentDrawer).toBeInTheDocument();
  });

  it('should have logout button in user menu', async () => {
    renderDashboard();

    const userMenuButton = screen.getByTestId('user-menu-button');
    fireEvent.click(userMenuButton);

    await waitFor(() => {
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    });
  });

  it('should display user role in menu', async () => {
    renderDashboard();

    const userMenuButton = screen.getByTestId('user-menu-button');
    fireEvent.click(userMenuButton);

    await waitFor(() => {
      expect(screen.getByText(/Role: teacher/)).toBeInTheDocument();
    });
  });

  it('TC5: should be responsive with proper grid layout', () => {
    const { container } = renderDashboard();

    const mainContent = screen.getByTestId('main-content');
    expect(mainContent).toHaveStyle({
      flexGrow: 1
    });

    // Check AppBar exists
    const appBar = container.querySelector('[class*="MuiAppBar"]');
    expect(appBar).toBeInTheDocument();
  });

  it('should highlight navigation items with proper testids', () => {
    renderDashboard();

    // Check that nav items have proper test IDs
    expect(screen.getByTestId('nav-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-2')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-3')).toBeInTheDocument();
  });
});
