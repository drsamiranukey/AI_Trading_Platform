import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import {
  Person,
  Security,
  Notifications,
  TrendingUp,
  AccountBalance,
  Delete,
  Edit,
  Add,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`settings-tabpanel-${index}`}
    aria-labelledby={`settings-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Profile settings
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    timezone: 'UTC'
  });

  // Security settings
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailSignals: true,
    emailTrades: true,
    emailNews: false,
    pushSignals: true,
    pushTrades: true,
    pushNews: false,
    smsSignals: false,
    smsTrades: true
  });

  // Trading settings
  const [tradingSettings, setTradingSettings] = useState({
    defaultRiskPercent: 2,
    maxDailyLoss: 5,
    autoTradingEnabled: false,
    signalConfirmation: true,
    stopLossEnabled: true,
    takeProfitEnabled: true
  });

  // MT5 accounts
  const [mt5Accounts, setMt5Accounts] = useState([]);
  const [accountDialog, setAccountDialog] = useState({ open: false, account: null });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        timezone: user.timezone || 'UTC'
      });
    }
    loadSettings();
    loadMT5Accounts();
  }, [user]);

  const loadSettings = async () => {
    try {
      const response = await apiService.getUserSettings();
      if (response.data) {
        const { notifications, trading } = response.data;
        if (notifications) setNotificationSettings(notifications);
        if (trading) setTradingSettings(trading);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadMT5Accounts = async () => {
    try {
      const response = await apiService.getMT5Accounts();
      setMt5Accounts(response.data || []);
    } catch (error) {
      console.error('Failed to load MT5 accounts:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setMessage({ type: '', text: '' });
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      await updateUser(profileData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      await apiService.changePassword({
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setSecurityData({ ...securityData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (settingsType, data) => {
    setLoading(true);
    try {
      await apiService.updateUserSettings({ [settingsType]: data });
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleMT5AccountSave = async (accountData) => {
    setLoading(true);
    try {
      if (accountDialog.account) {
        await apiService.updateMT5Account(accountDialog.account.id, accountData);
      } else {
        await apiService.addMT5Account(accountData);
      }
      await loadMT5Accounts();
      setAccountDialog({ open: false, account: null });
      setMessage({ type: 'success', text: 'MT5 account saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save MT5 account' });
    } finally {
      setLoading(false);
    }
  };

  const handleMT5AccountDelete = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this MT5 account?')) {
      try {
        await apiService.deleteMT5Account(accountId);
        await loadMT5Accounts();
        setMessage({ type: 'success', text: 'MT5 account deleted successfully!' });
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to delete MT5 account' });
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="settings tabs">
            <Tab icon={<Person />} label="Profile" />
            <Tab icon={<Security />} label="Security" />
            <Tab icon={<Notifications />} label="Notifications" />
            <Tab icon={<TrendingUp />} label="Trading" />
            <Tab icon={<AccountBalance />} label="MT5 Accounts" />
          </Tabs>
        </Box>

        {/* Profile Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleProfileUpdate}
                disabled={loading}
              >
                Update Profile
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Current Password"
                type={showPassword ? 'text' : 'password'}
                value={securityData.currentPassword}
                onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={securityData.newPassword}
                onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                value={securityData.confirmPassword}
                onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handlePasswordChange}
                disabled={loading}
              >
                Change Password
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={securityData.twoFactorEnabled}
                    onChange={(e) => setSecurityData({ ...securityData, twoFactorEnabled: e.target.checked })}
                  />
                }
                label="Enable Two-Factor Authentication"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Email Notifications
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.emailSignals}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailSignals: e.target.checked })}
                  />
                }
                label="Trading Signals"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.emailTrades}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailTrades: e.target.checked })}
                  />
                }
                label="Trade Executions"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.emailNews}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNews: e.target.checked })}
                  />
                }
                label="Market News"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Push Notifications
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.pushSignals}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, pushSignals: e.target.checked })}
                  />
                }
                label="Trading Signals"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.pushTrades}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, pushTrades: e.target.checked })}
                  />
                }
                label="Trade Executions"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={() => handleSettingsUpdate('notifications', notificationSettings)}
                disabled={loading}
              >
                Save Notification Settings
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Trading Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Default Risk Percentage"
                type="number"
                value={tradingSettings.defaultRiskPercent}
                onChange={(e) => setTradingSettings({ ...tradingSettings, defaultRiskPercent: parseFloat(e.target.value) })}
                InputProps={{ endAdornment: '%' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Maximum Daily Loss"
                type="number"
                value={tradingSettings.maxDailyLoss}
                onChange={(e) => setTradingSettings({ ...tradingSettings, maxDailyLoss: parseFloat(e.target.value) })}
                InputProps={{ endAdornment: '%' }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={tradingSettings.autoTradingEnabled}
                    onChange={(e) => setTradingSettings({ ...tradingSettings, autoTradingEnabled: e.target.checked })}
                  />
                }
                label="Enable Auto Trading"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={tradingSettings.signalConfirmation}
                    onChange={(e) => setTradingSettings({ ...tradingSettings, signalConfirmation: e.target.checked })}
                  />
                }
                label="Require Signal Confirmation"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={() => handleSettingsUpdate('trading', tradingSettings)}
                disabled={loading}
              >
                Save Trading Settings
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* MT5 Accounts Tab */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAccountDialog({ open: true, account: null })}
            >
              Add MT5 Account
            </Button>
          </Box>

          <Grid container spacing={3}>
            {mt5Accounts.map((account) => (
              <Grid item xs={12} md={6} key={account.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6">
                        {account.name || `Account ${account.login}`}
                      </Typography>
                      <Chip
                        label={account.status}
                        color={account.status === 'connected' ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Login: {account.login}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Server: {account.server}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Balance: ${account.balance?.toFixed(2) || '0.00'}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton
                      onClick={() => setAccountDialog({ open: true, account })}
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleMT5AccountDelete(account.id)}
                      size="small"
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>

      {/* MT5 Account Dialog */}
      <MT5AccountDialog
        open={accountDialog.open}
        account={accountDialog.account}
        onClose={() => setAccountDialog({ open: false, account: null })}
        onSave={handleMT5AccountSave}
      />
    </Container>
  );
};

// MT5 Account Dialog Component
const MT5AccountDialog = ({ open, account, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    login: '',
    password: '',
    server: '',
    investor_password: ''
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        login: account.login || '',
        password: '',
        server: account.server || '',
        investor_password: ''
      });
    } else {
      setFormData({
        name: '',
        login: '',
        password: '',
        server: '',
        investor_password: ''
      });
    }
  }, [account]);

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {account ? 'Edit MT5 Account' : 'Add MT5 Account'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Account Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Login"
              value={formData.login}
              onChange={(e) => setFormData({ ...formData, login: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Server"
              value={formData.server}
              onChange={(e) => setFormData({ ...formData, server: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Investor Password (Optional)"
              type="password"
              value={formData.investor_password}
              onChange={(e) => setFormData({ ...formData, investor_password: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {account ? 'Update' : 'Add'} Account
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Settings;