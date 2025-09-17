import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ThemeToggle from '../Common/ThemeToggle';
import { useAuth } from './AuthProvider';

const AuthPage = () => {
  const theme = useTheme();
  const { resetPassword, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const handleSwitchToRegister = () => {
    setAuthMode('register');
  };

  const handleSwitchToLogin = () => {
    setAuthMode('login');
  };

  const handleForgotPassword = () => {
    setForgotPasswordOpen(true);
    setResetMessage('');
    setResetError('');
    setResetEmail('');
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setResetError('Please enter your email address');
      return;
    }

    const result = await resetPassword(resetEmail);
    
    if (result.success) {
      setResetMessage(result.message);
      setResetError('');
      setTimeout(() => {
        setForgotPasswordOpen(false);
      }, 3000);
    } else {
      setResetError(result.error);
      setResetMessage('');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              mb: 1,
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            AI Trading Platform
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255,255,255,0.9)',
              mb: 2,
            }}
          >
            Advanced Trading with Artificial Intelligence
          </Typography>
          
          {/* Theme Toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <ThemeToggle variant="button" />
          </Box>
        </Box>

        {/* Auth Forms */}
        <Paper
          elevation={24}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {authMode === 'login' ? (
            <LoginForm
              onSwitchToRegister={handleSwitchToRegister}
              onForgotPassword={handleForgotPassword}
            />
          ) : (
            <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
          )}
        </Paper>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              mb: 1,
            }}
          >
            © 2024 AI Trading Platform. All rights reserved.
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            Secure • Reliable • Intelligent Trading Solutions
          </Typography>
        </Box>
      </Container>

      {/* Forgot Password Dialog */}
      <Dialog
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your email address and we'll send you a link to reset your password.
          </Typography>
          
          {resetMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {resetMessage}
            </Alert>
          )}
          
          {resetError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {resetError}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            disabled={loading}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setForgotPasswordOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={16} />}
          >
            Send Reset Link
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuthPage;