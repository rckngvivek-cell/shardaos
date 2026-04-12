# WEEK 4 PR #4 PLAN: Frontend Auth UI & Dashboard

**PR:** #4  
**Owner:** Frontend Agent  
**Day:** Tuesday-Wednesday, May 7-8, 2026  
**Duration:** 3.5 hours (Tue afternoon + Wed morning)  
**Status:** DRAFT - Awaiting Lead Architect Review

---

## 📋 FEATURE SUMMARY

Build responsive React authentication UI with login form, role-based dashboard shell, and navigation. Integrate Firebase Auth client, Redux Toolkit state management, RTK Query for API calls, and Material-UI for consistent design. Mobile-first responsive design targeting 375px+ breakpoints.

---

## 🎯 DELIVERABLES

| Component | Target | Platform |
|-----------|--------|----------|
| Login Page | Responsive | Mobile (375px) → Desktop (1920px) |
| Dashboard Shell | Responsive | 3+ breakpoints |
| Navigation | Role-aware | Admin / Teacher / Student |
| Auth State | Redux Toolkit | Persistent across sessions |
| Material-UI Theme | Consistent | Accessible WCAG 2.1 AA |

---

## 🎨 REACT COMPONENTS STRUCTURE

### Component Tree:

```
App.tsx (root)
├── router (React Router v6)
│   ├── <PublicRoute>
│   │   └── LoginPage
│   │       ├── LoginForm
│   │       └── BrandHeader
│   │
│   ├── <ProtectedRoute>
│   │   ├── DashboardLayout
│   │   │   ├── Header
│   │   │   │   ├── Logo
│   │   │   │   ├── Navigation
│   │   │   │   └── UserMenu
│   │   │   ├── Sidebar (collapsible)
│   │   │   │   ├── SchoolSelector
│   │   │   │   └── NavItems (role-based)
│   │   │   ├── MainContent
│   │   │   │   └── Dashboard (placeholder)
│   │   │   └── Footer
│   │   │
│   │   ├── Dashboard
│   │   ├── Students
│   │   ├── Attendance
│   │   └── Grades
```

---

## 📄 COMPONENT SPECIFICATIONS

### 1. App.tsx - Root Component (30 LOC)

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import store from './app/store';
import theme from './theme';
import PublicRoute from './components/PublicRoute';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />} />
              <Route path="/students" element={<DashboardLayout />} />
              <Route path="/attendance" element={<DashboardLayout />} />
              <Route path="/grades" element={<DashboardLayout />} />
            </Route>
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
```

---

### 2. LoginPage.tsx - Login Form (80 LOC)

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Alert,
  Card,
  Stack,
  Typography,
  CircularProgress
} from '@mui/material';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { setUser } from '../app/authSlice';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = getAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const idToken = await userCredential.user.getIdToken();
      dispatch(setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        token: idToken
      }));

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card sx={{ width: '100%', p: 4 }}>
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" gutterBottom>School ERP</Typography>
              <Typography variant="body2" color="text.secondary">Log in to your account</Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  sx={{ py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Sign In'}
                </Button>
              </Stack>
            </form>
          </Stack>
        </Card>
      </Box>
    </Container>
  );
}
```

---

### 3. DashboardLayout.tsx - Main Dashboard Shell (100 LOC)

```typescript
import React from 'react';
import { useSelector } from 'react-redux';
import { Box, AppBar, Toolbar, Drawer, List, ListItem, ListItemButton, ListItemText, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../app/store';

const DRAWER_WIDTH = 240;

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = useSelector((state: RootState) => state.auth.role);

  const menuOpen = Boolean(anchorEl);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    navigate('/login');
    handleMenuClose();
  };

  const getNavItems = () => {
    const baseItems = [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Students', path: '/students' },
      { label: 'Attendance', path: '/attendance' },
      { label: 'Grades', path: '/grades' }
    ];

    if (userRole === 'admin') {
      baseItems.push({ label: 'Settings', path: '/settings' });
    }

    return baseItems;
  };

  const drawerContent = (
    <List>
      {getNavItems().map(item => (
        <ListItem key={item.path} disablePadding>
          <ListItemButton onClick={() => navigate(item.path)}>
            <ListItemText primary={item.label} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: 1300 }}>
        <Toolbar>
          <IconButton color="inherit" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>School ERP</Typography>
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <AccountCircleIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
            <MenuItem disabled>{user?.email}</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar - Desktop */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box', mt: 8 },
          display: { xs: 'none', sm: 'block' }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Sidebar - Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{ display: { xs: 'block', sm: 'none' }, [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH } }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Typography variant="h4">Welcome {user?.displayName || 'User'}</Typography>
        {/* Page content will be inserted here */}
      </Box>
    </Box>
  );
}
```

---

### 4. ProtectedRoute.tsx - Route Guard (35 LOC)

```typescript
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';

export default function ProtectedRoute() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
```

---

### 5. Redux Auth Slice (authSlice.ts) - 60 LOC

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  token: string;
}

interface AuthState {
  user: User | null;
  role: 'admin' | 'teacher' | 'student' | 'parent' | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  role: null,
  isAuthenticated: false,
  loading: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setRole: (state, action: PayloadAction<AuthState['role']>) => {
      state.role = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.role = null;
      state.isAuthenticated = false;
    }
  }
});

export const { setUser, setRole, setLoading, logout } = authSlice.actions;
export default authSlice.reducer;
```

---

## 🗂️ FILES TO CHANGE

### Create New Files:
- [ ] `apps/web/src/pages/LoginPage.tsx` (80 LOC)
- [ ] `apps/web/src/components/DashboardLayout.tsx` (100 LOC)
- [ ] `apps/web/src/components/ProtectedRoute.tsx` (35 LOC)
- [ ] `apps/web/src/app/authSlice.ts` (60 LOC)
- [ ] `apps/web/src/theme.ts` (80 LOC - Material-UI theme)
- [ ] `apps/web/src/__tests__/LoginPage.test.tsx` (40 LOC)
- [ ] `apps/web/src/__tests__/DashboardLayout.test.tsx` (35 LOC)

### Modify Files:
- [ ] `apps/web/src/App.tsx` (30 LOC → new router structure)
- [ ] `apps/web/src/app/store.ts` (add authSlice)
- [ ] `apps/web/package.json` (verify Material-UI, Redux Toolkit installed)

---

## ✅ TEST CASES (5+ tests)

### Login Form Tests (2 tests)
- [ ] **TC1:** Login with valid email/password → Redirects to dashboard
- [ ] **TC2:** Login with invalid password → Shows error message

### Dashboard Layout Tests (2 tests)
- [ ] **TC3:** Dashboard loads → Shows user email in menu
- [ ] **TC4:** Navigation items visible → Role-based filtering works

### Responsive Tests (1 test)
- [ ] **TC5:** Login page responsive on mobile (375px), tablet (768px), desktop (1920px)

---

## 📱 RESPONSIVE BREAKPOINTS

**Material-UI Breakpoints (built-in):**
```typescript
xs: 0px       // Mobile phones
sm: 600px     // Tablets
md: 960px     // Small desktop
lg: 1280px    // Desktop
xl: 1920px    // Large desktop
```

**Design Targets:**
- Mobile (375px): Single column, hamburger menu, stacked forms
- Tablet (768px): Two columns, sidebar hidden
- Desktop (1920px): Full layout with sidebar

---

## 🎨 MATERIAL-UI THEME (theme.ts - 80 LOC)

```typescript
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    success: { main: '#4caf50' },
    error: { main: '#f44336' },
    background: { default: '#f5f5f5' }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
  }
});

export default theme;
```

---

## ⏱️ IMPLEMENTATION TIMELINE

| Task | Time | Owner |
|------|------|-------|
| **PLAN Review** | 15 min | Lead Architect |
| **Component Build** | 2 hours | Frontend |
| **Redux Setup** | 30 min | Frontend |
| **Test Writing** | 30 min | Frontend |
| **Responsive Design** | 15 min | Frontend |
| **Code Review** | 15 min | Lead Architect |
| **Total** | **3.75 hours** | - |

---

## 🎯 SUCCESS CRITERIA

- ✅ Login page fully functional with Firebase Auth
- ✅ Dashboard shell responsive on 3+ breakpoints (mobile, tablet, desktop)
- ✅ Navigation role-aware (admin shows different menu than teacher)
- ✅ Redux state persisting across page refreshes
- ✅ 5+ component tests passing
- ✅ Material-UI consistent styling across all pages
- ✅ Accessibility: WCAG 2.1 AA compliant

---

## 📝 NOTES FOR IMPLEMENTATION

1. **Firebase Auth:** Set up Google OAuth in Firebase console first.
2. **API Integration:** RTK Query will be added in future PRs; auth for now uses Firebase only.
3. **State Persistence:** Consider using localStorage for token persistence.
4. **Mobile First:** Design for 375px screen first, then scale up to desktop.
5. **Accessibility:** All form inputs have labels, buttons have aria-labels.

---

**Status:** ⏳ AWAITING LEAD ARCHITECT REVIEW  
**Next Steps:** Lead Architect to review. Then begin IMPLEMENT phase.

*Created: 2026-04-09*  
*PR Target:** PR #4, Tuesday-Wednesday May 7-8, 2026
