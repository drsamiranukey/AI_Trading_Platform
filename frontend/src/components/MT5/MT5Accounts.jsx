import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Link,
  LinkOff,
  Refresh,
  Settings
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

const MT5Accounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showPassword, setShowPassword] = useState({});

  const [accountData, setAccountData] = useState({
    name: '',
    server: '',
    login: '',
    password: '',
    account_type: 'demo',
    broker: '',
    description: ''
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMT5Accounts();
      setAccounts(response.data || []);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch MT5 accounts' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = () => {
    setEditingAccount(null);
    setAccountData({
      name: '',
      server: '',
      login: '',
      password: '',
      account_type: 'demo',
      broker: '',
      description: ''
    });
    setOpenDialog(true);
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setAccountData({
      name: account.name || '',
      server: account.server || '',
      login: account.login || '',
      password: '', // Don't show existing password
      account_type: account.account_type || 'demo',
      broker: account.broker || '',
      description: account.description || ''
    });
    setOpenDialog(true);
  };

  const handleSaveAccount = async () => {
    try {
      setLoading(true);
      if (editingAccount) {
        await apiService.updateMT5Account(editingAccount.id, accountData);
        setMessage({ type: 'success', text: 'Account updated successfully' });
      } else {
        await apiService.createMT5Account(accountData);
        setMessage({ type: 'success', text: 'Account added successfully' });
      }
      setOpenDialog(false);
      fetchAccounts();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save account' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await apiService.deleteMT5Account(accountId);
        setMessage({ type: 'success', text: 'Account deleted successfully' });
        fetchAccounts();
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to delete account' });
      }
    }
  };

  const handleTestConnection = async (accountId) => {
    try {
      setLoading(true);
      await apiService.testMT5Connection(accountId);
      setMessage({ type: 'success', text: 'Connection test successful' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Connection test failed' });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (accountId) => {
    setShowPassword(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'success';
      case 'disconnected': return 'error';
      case 'connecting': return 'warning';
      default: return 'default';
    }
  };

  const getAccountTypeColor = (type) => {
    return type === 'live' ? 'error' : 'info';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">MT5 Accounts</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddAccount}
        >
          Add Account
        </Button>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      {/* Account Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountBalance color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{accounts.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Accounts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Link color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {accounts.filter(acc => acc.status === 'connected').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Connected
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {accounts.filter(acc => acc.account_type === 'live').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Live Accounts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingDown color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {accounts.filter(acc => acc.account_type === 'demo').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Demo Accounts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Accounts Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Broker</TableCell>
                <TableCell>Login</TableCell>
                <TableCell>Server</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No MT5 accounts found. Add your first account to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {account.name}
                        </Typography>
                        {account.description && (
                          <Typography variant="caption" color="text.secondary">
                            {account.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{account.broker}</TableCell>
                    <TableCell>{account.login}</TableCell>
                    <TableCell>{account.server}</TableCell>
                    <TableCell>
                      <Chip
                        label={account.account_type?.toUpperCase()}
                        color={getAccountTypeColor(account.account_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={account.status || 'Unknown'}
                        color={getStatusColor(account.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {account.balance ? `$${account.balance.toLocaleString()}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Test Connection">
                          <IconButton
                            size="small"
                            onClick={() => handleTestConnection(account.id)}
                          >
                            <Refresh />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditAccount(account)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteAccount(account.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Account Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAccount ? 'Edit MT5 Account' : 'Add MT5 Account'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Name"
                value={accountData.name}
                onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                placeholder="My Trading Account"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Broker"
                value={accountData.broker}
                onChange={(e) => setAccountData({ ...accountData, broker: e.target.value })}
                placeholder="e.g., MetaQuotes"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Account Type</InputLabel>
                <Select
                  value={accountData.account_type}
                  onChange={(e) => setAccountData({ ...accountData, account_type: e.target.value })}
                >
                  <MenuItem value="demo">Demo</MenuItem>
                  <MenuItem value="live">Live</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Login"
                value={accountData.login}
                onChange={(e) => setAccountData({ ...accountData, login: e.target.value })}
                placeholder="Account login number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Server"
                value={accountData.server}
                onChange={(e) => setAccountData({ ...accountData, server: e.target.value })}
                placeholder="e.g., MetaQuotes-Demo"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Password"
                value={accountData.password}
                onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                placeholder={editingAccount ? "Leave blank to keep current password" : "Account password"}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                value={accountData.description}
                onChange={(e) => setAccountData({ ...accountData, description: e.target.value })}
                placeholder="Additional notes about this account"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveAccount}
            variant="contained"
            disabled={!accountData.name || !accountData.login || !accountData.server}
          >
            {editingAccount ? 'Update' : 'Add'} Account
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MT5Accounts;