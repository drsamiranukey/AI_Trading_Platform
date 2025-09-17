import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Badge,
  Tooltip,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  TrendingUp,
  AccountCircle,
  Notifications,
  Settings,
  Dashboard,
  ShowChart,
  AccountBalance,
  SmartToy,
  ExitToApp,
  Person,
  Security,
  Help,
  Brightness4,
  Brightness7
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = ({ darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  const isMenuOpen = Boolean(anchorEl);
  const isNotificationOpen = Boolean(notificationAnchor);

  // Handle profile menu
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle notifications menu
  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchor(null);
  };

  // Handle logout
  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  // Navigation items for authenticated users
  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
    { label: 'Signals', path: '/signals', icon: <ShowChart /> },
    { label: 'Accounts', path: '/accounts', icon: <AccountBalance /> },
    { label: 'Trading Bot', path: '/trading-bot', icon: <SmartToy /> },
  ];

  // Mock notifications (in real app, this would come from context/API)
  const notifications = [
    { id: 1, title: 'New Trading Signal', message: 'EURUSD BUY signal generated', time: '2 min ago', unread: true },
    { id: 2, title: 'Account Connected', message: 'MT5 account successfully connected', time: '1 hour ago', unread: true },
    { id: 3, title: 'Trade Executed', message: 'Position opened on GBPUSD', time: '3 hours ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar>
        {/* Logo and Brand */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            mr: 4
          }}
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
        >
          <TrendingUp sx={{ fontSize: 32, mr: 1 }} />
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 'bold',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            AI Trading
          </Typography>
        </Box>

        {/* Navigation Items (for authenticated users) */}
        {isAuthenticated && (
          <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 'auto' }}>
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  mx: 1,
                  backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Right side items */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Dark mode toggle */}
          <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton
              color="inherit"
              onClick={toggleDarkMode}
              sx={{ mr: 1 }}
            >
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <Tooltip title="Notifications">
                <IconButton
                  color="inherit"
                  onClick={handleNotificationMenuOpen}
                  sx={{ mr: 1 }}
                >
                  <Badge badgeContent={unreadCount} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* User Profile */}
              <Tooltip title="Account">
                <IconButton
                  onClick={handleProfileMenuOpen}
                  sx={{ p: 0 }}
                >
                  <Avatar
                    alt={user?.first_name || 'User'}
                    src={user?.avatar_url}
                    sx={{ width: 32, height: 32 }}
                  >
                    {user?.first_name?.[0] || 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              {/* Login/Register buttons for non-authenticated users */}
              <Button
                color="inherit"
                onClick={() => navigate('/login')}
                sx={{ mr: 1 }}
              >
                Login
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/register')}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={isMenuOpen}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              minWidth: 200,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* User Info */}
          <MenuItem disabled>
            <Avatar
              alt={user?.first_name || 'User'}
              src={user?.avatar_url}
            >
              {user?.first_name?.[0] || 'U'}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="bold">
                {user?.first_name} {user?.last_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </MenuItem>

          <Divider />

          {/* Menu Items */}
          <MenuItem onClick={() => navigate('/dashboard')}>
            <ListItemIcon>
              <Dashboard fontSize="small" />
            </ListItemIcon>
            <ListItemText>Dashboard</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => navigate('/profile')}>
            <ListItemIcon>
              <Person fontSize="small" />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => navigate('/settings')}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => navigate('/security')}>
            <ListItemIcon>
              <Security fontSize="small" />
            </ListItemIcon>
            <ListItemText>Security</ListItemText>
          </MenuItem>

          <Divider />

          <MenuItem onClick={() => navigate('/help')}>
            <ListItemIcon>
              <Help fontSize="small" />
            </ListItemIcon>
            <ListItemText>Help & Support</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <ExitToApp fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={isNotificationOpen}
          onClose={handleNotificationMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              minWidth: 320,
              maxHeight: 400,
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* Notifications Header */}
          <MenuItem disabled>
            <Typography variant="h6" fontWeight="bold">
              Notifications
            </Typography>
          </MenuItem>

          <Divider />

          {/* Notification Items */}
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={handleNotificationMenuClose}
                sx={{
                  backgroundColor: notification.unread ? 'action.hover' : 'transparent',
                  borderLeft: notification.unread ? '3px solid' : 'none',
                  borderLeftColor: 'primary.main',
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" fontWeight="bold">
                    {notification.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notification.time}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </MenuItem>
          )}

          <Divider />

          <MenuItem onClick={handleNotificationMenuClose}>
            <Typography variant="body2" color="primary" sx={{ width: '100%', textAlign: 'center' }}>
              View All Notifications
            </Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;