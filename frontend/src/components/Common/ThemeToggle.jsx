import React from 'react';
import {
  IconButton,
  Tooltip,
  Box,
  Switch,
  FormControlLabel,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Brightness6 as AutoModeIcon,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = ({ variant = 'icon' }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();

  if (variant === 'switch') {
    return (
      <FormControlLabel
        control={
          <Switch
            checked={isDarkMode}
            onChange={toggleTheme}
            color="primary"
            size="small"
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isDarkMode ? <DarkModeIcon /> : <LightModeIcon />}
            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
          </Box>
        }
        sx={{
          margin: 0,
          '& .MuiFormControlLabel-label': {
            fontSize: '0.875rem',
            color: muiTheme.palette.text.primary,
          },
        }}
      />
    );
  }

  if (variant === 'button') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          padding: '8px 16px',
          borderRadius: '8px',
          backgroundColor: muiTheme.palette.background.paper,
          border: `1px solid ${muiTheme.palette.divider}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: muiTheme.palette.action.hover,
          },
        }}
        onClick={toggleTheme}
      >
        {isDarkMode ? (
          <DarkModeIcon sx={{ color: muiTheme.palette.primary.main }} />
        ) : (
          <LightModeIcon sx={{ color: muiTheme.palette.primary.main }} />
        )}
        <Box sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
          {isDarkMode ? 'Dark' : 'Light'}
        </Box>
      </Box>
    );
  }

  // Default icon variant
  return (
    <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
      <IconButton
        onClick={toggleTheme}
        sx={{
          color: muiTheme.palette.text.primary,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            backgroundColor: muiTheme.palette.action.hover,
            transform: 'scale(1.1)',
          },
        }}
      >
        {isDarkMode ? (
          <LightModeIcon sx={{ fontSize: '1.5rem' }} />
        ) : (
          <DarkModeIcon sx={{ fontSize: '1.5rem' }} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;