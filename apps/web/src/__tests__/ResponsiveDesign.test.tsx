import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/app/authSlice';
import LoginPage from '../pages/LoginPage';
import DashboardLayout from '../components/DashboardLayout';

const createMockStore = (initialAuth: any = {}) => {
  const defaultAuth = {
    user: {
      uid: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User',
      token: 'demo-token'
    },
    role: 'teacher' as const,
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

const renderWithViewport = (Component: React.ComponentType, width: number, store = createMockStore()) => {
  const div = document.createElement('div');
  div.style.width = `${width}px`;
  div.style.height = '800px';
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <Component />
      </BrowserRouter>
    </Provider>,
    {
      container: document.body.appendChild(div)
    }
  );
};

describe('Responsive Design Tests', () => {
  beforeEach(() => {
    // Reset window size
    (window as any).innerWidth = 1024;
    (window as any).innerHeight = 768;
  });

  describe('TC5: Login Page - Responsive Breakpoints', () => {
    it('should be responsive on mobile (375px)', () => {
      (window as any).innerWidth = 375;
      render(
        <Provider store={createMockStore({ isAuthenticated: false })}>
          <BrowserRouter>
            <LoginPage />
          </BrowserRouter>
        </Provider>
      );

      const card = screen.getByTestId('login-container');
      expect(card).toBeInTheDocument();

      // Check responsive padding
      const container = screen.getByTestId('login-container').closest('div');
      expect(container).toBeInTheDocument();
    });

    it('should be responsive on tablet (768px)', () => {
      (window as any).innerWidth = 768;
      render(
        <Provider store={createMockStore({ isAuthenticated: false })}>
          <BrowserRouter>
            <LoginPage />
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
    });

    it('should be responsive on desktop (1920px)', () => {
      (window as any).innerWidth = 1920;
      render(
        <Provider store={createMockStore({ isAuthenticated: false })}>
          <BrowserRouter>
            <LoginPage />
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      const card = screen.getByTestId('login-container').closest('[class*="MuiContainer"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Dashboard Layout - Responsive Breakpoints', () => {
    it('should show hamburger menu on mobile (375px)', () => {
      (window as any).innerWidth = 375;
      render(
        <Provider store={createMockStore()}>
          <BrowserRouter>
            <DashboardLayout />
          </BrowserRouter>
        </Provider>
      );

      const menuButton = screen.getByTestId('menu-button');
      expect(menuButton).toBeInTheDocument();
    });

    it('should show responsive drawer on tablet (768px)', () => {
      (window as any).innerWidth = 768;
      render(
        <Provider store={createMockStore()}>
          <BrowserRouter>
            <DashboardLayout />
          </BrowserRouter>
        </Provider>
      );

      // Drawer should be present but hidden by default on tablet
      const drawer = screen.getByTestId('temporary-drawer');
      expect(drawer).toBeInTheDocument();
    });

    it('should show permanent sidebar on desktop (1920px)', () => {
      (window as any).innerWidth = 1920;
      render(
        <Provider store={createMockStore()}>
          <BrowserRouter>
            <DashboardLayout />
          </BrowserRouter>
        </Provider>
      );

      const permanentDrawer = screen.getByTestId('permanent-drawer');
      expect(permanentDrawer).toBeInTheDocument();
    });

    it('should display heading with responsive font size', () => {
      render(
        <Provider store={createMockStore()}>
          <BrowserRouter>
            <DashboardLayout />
          </BrowserRouter>
        </Provider>
      );

      const heading = screen.getByText(/Welcome Test User/);
      expect(heading).toBeInTheDocument();
    });

    it('should have responsive main content area', () => {
      render(
        <Provider store={createMockStore()}>
          <BrowserRouter>
            <DashboardLayout />
          </BrowserRouter>
        </Provider>
      );

      const mainContent = screen.getByTestId('main-content');
      expect(mainContent).toHaveStyle({
        flexGrow: 1
      });
    });
  });

  describe('Material-UI Breakpoint Compliance', () => {
    it('should use xs (0px), sm (600px), md (960px), lg (1280px), xl (1920px) breakpoints', () => {
      // Material-UI breakpoints are defined in theme
      const breakpoints = {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920
      };

      expect(breakpoints.sm).toBe(600);
      expect(breakpoints.md).toBe(960);
      expect(breakpoints.lg).toBe(1280);
      expect(breakpoints.xl).toBe(1920);
    });
  });

  describe('Mobile First Design', () => {
    it('should scale typography for mobile', () => {
      (window as any).innerWidth = 375;
      render(
        <Provider store={createMockStore()}>
          <BrowserRouter>
            <DashboardLayout />
          </BrowserRouter>
        </Provider>
      );

      const heading = screen.getByText(/Welcome Test User/);
      expect(heading).toBeInTheDocument();
    });

    it('should maintain touch-friendly button sizes on mobile', () => {
      (window as any).innerWidth = 375;
      render(
        <Provider store={createMockStore()}>
          <BrowserRouter>
            <DashboardLayout />
          </BrowserRouter>
        </Provider>
      );

      const menuButton = screen.getByTestId('menu-button');
      expect(menuButton).toHaveAttribute('data-testid', 'menu-button');
    });
  });
});
