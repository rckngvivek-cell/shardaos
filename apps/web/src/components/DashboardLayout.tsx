import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Badge
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import GradeIcon from '@mui/icons-material/Grade';
import SettingsIcon from '@mui/icons-material/Settings';
import { logout } from '@/app/authSlice';

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  requiredRoles?: string[];
}

/**
 * DashboardLayout - Main application shell with responsive navigation
 * Features:
 * - Collapsible sidebar (mobile: hamburger, desktop: always visible)
 * - Responsive header with user menu
 * - Role-based navigation
 * - Mobile (375px), Tablet (768px), Desktop (1920px) support
 */
export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const userRole = useAppSelector((state) => state.auth.role);

  const menuOpen = Boolean(anchorEl);

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon />
    },
    {
      label: 'Students',
      path: '/students',
      icon: <PeopleIcon />
    },
    {
      label: 'Attendance',
      path: '/attendance',
      icon: <EventAvailableIcon />
    },
    {
      label: 'Grades',
      path: '/grades',
      icon: <GradeIcon />
    }
  ];

  const adminItems: NavItem[] = [
    {
      label: 'Settings',
      path: '/settings',
      icon: <SettingsIcon />,
      requiredRoles: ['admin']
    }
  ];

  const allNavItems = userRole === 'admin' ? [...navItems, ...adminItems] : navItems;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
    navigate('/login');
  };

  const drawerContent = (
    <Box>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          School ERP
        </Typography>
        <IconButton
          onClick={handleDrawerToggle}
          sx={{ display: { sm: 'none' } }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {allNavItems.map((item, index) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleNavigate(item.path)}
              sx={{
                '&:hover': {
                  backgroundColor: 'action.hover'
                },
                py: 1.5
              }}
              data-testid={`nav-item-${index}`}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.95rem' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }} data-testid="dashboard-layout">
      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { sm: 'none' }
            }}
            size="large"
            data-testid="menu-button"
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            School ERP
          </Typography>
          <Badge badgeContent={userRole === 'admin' ? 'Admin' : ''} color="secondary">
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
              size="large"
              data-testid="user-menu-button"
            >
              <AccountCircleIcon />
            </IconButton>
          </Badge>
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            data-testid="user-menu"
          >
            <MenuItem disabled data-testid="user-email">
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {user?.email}
              </Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                Role: {userRole || 'Not assigned'}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} data-testid="logout-button">
              <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar - Desktop (permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            mt: 8,
            height: `calc(100vh - 64px)`
          },
          display: { xs: 'none', sm: 'block' }
        }}
        data-testid="permanent-drawer"
      >
        {drawerContent}
      </Drawer>

      {/* Sidebar - Mobile (temporary) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: 'block', sm: 'none' },
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box'
          }
        }}
        data-testid="temporary-drawer"
      >
        {drawerContent}
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          mt: 8,
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          width: { xs: '100%', sm: `calc(100% - ${DRAWER_WIDTH}px)` }
        }}
        data-testid="main-content"
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontSize: { xs: '1.5rem', sm: '2.125rem' },
            fontWeight: 600,
            mb: 3
          }}
        >
          Welcome {user?.displayName || 'User'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Dashboard content goes here
        </Typography>
      </Box>
    </Box>
  );
}
