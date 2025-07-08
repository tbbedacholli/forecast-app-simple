// components/SettingsContent.js
'use client';
import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Divider,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Storage as StorageIcon,
  Api as ApiIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Camera as CameraIcon,
  Save as SaveIcon
} from '@mui/icons-material';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsContent() {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    // Profile
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    phone: '+1 (555) 123-4567',
    
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    forecastAlerts: true,
    weeklyReports: true,
    
    // Appearance
    theme: 'light',
    chartTheme: 'modern',
    language: 'en',
    timezone: 'UTC-8',
    
    // Data & API
    dataRetention: '1year',
    autoRefresh: 5,
    apiKey: 'fc-ak-***************',
    webhookUrl: '',
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginNotifications: true
  });

  const [saveStatus, setSaveStatus] = useState('');

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveSettings = () => {
    setSaveStatus('saving');
    // Simulate save
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
    }, 1000);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        {/* <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Settings
        </Typography> */}
        <Typography variant="body1" color="textSecondary">
          Manage your account preferences and application settings
        </Typography>
      </Box>

      {/* Save Status Alert */}
      {saveStatus && (
        <Alert 
          severity={saveStatus === 'saved' ? 'success' : 'info'} 
          sx={{ mb: 3 }}
        >
          {saveStatus === 'saving' ? 'Saving settings...' : 'Settings saved successfully!'}
        </Alert>
      )}

      {/* Settings Tabs */}
      <Paper sx={{ borderRadius: 2, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ borderBottom: '1px solid #e2e8f0' }}
        >
          <Tab icon={<PersonIcon />} label="Profile" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<PaletteIcon />} label="Appearance" />
          <Tab icon={<StorageIcon />} label="Data & API" />
          <Tab icon={<SecurityIcon />} label="Security" />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center', p: 3 }}>
                <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: '#3b82f6' }}>
                  <PersonIcon sx={{ fontSize: 50 }} />
                </Avatar>
                <IconButton sx={{ bgcolor: '#f3f4f6', mb: 2 }}>
                  <CameraIcon />
                </IconButton>
                <Typography variant="body2" color="textSecondary">
                  Click to upload a new photo
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={settings.firstName}
                    onChange={(e) => handleSettingChange('firstName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={settings.lastName}
                    onChange={(e) => handleSettingChange('lastName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleSettingChange('email', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={settings.phone}
                    onChange={(e) => handleSettingChange('phone', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={1}>
          <List>
            <ListItem>
              <ListItemIcon>
                <EmailIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Email Notifications"
                secondary="Receive forecast updates and alerts via email"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <SmsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="SMS Notifications"
                secondary="Get urgent alerts via text message"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.smsNotifications}
                  onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Push Notifications"
                secondary="Browser notifications for real-time updates"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.pushNotifications}
                  onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider sx={{ my: 2 }} />
            <ListItem>
              <ListItemText 
                primary="Forecast Alerts"
                secondary="Get notified when forecasts deviate significantly"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.forecastAlerts}
                  onChange={(e) => handleSettingChange('forecastAlerts', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Weekly Reports"
                secondary="Receive weekly summary reports"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.weeklyReports}
                  onChange={(e) => handleSettingChange('weeklyReports', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </TabPanel>

        {/* Appearance Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select
                  value={settings.theme}
                  label="Theme"
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="auto">Auto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Chart Theme</InputLabel>
                <Select
                  value={settings.chartTheme}
                  label="Chart Theme"
                  onChange={(e) => handleSettingChange('chartTheme', e.target.value)}
                >
                  <MenuItem value="modern">Modern</MenuItem>
                  <MenuItem value="classic">Classic</MenuItem>
                  <MenuItem value="minimal">Minimal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={settings.language}
                  label="Language"
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="de">German</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={settings.timezone}
                  label="Timezone"
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                >
                  <MenuItem value="UTC-8">Pacific Time (UTC-8)</MenuItem>
                  <MenuItem value="UTC-5">Eastern Time (UTC-5)</MenuItem>
                  <MenuItem value="UTC+0">UTC (UTC+0)</MenuItem>
                  <MenuItem value="UTC+1">Central European (UTC+1)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Data & API Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Data Retention</InputLabel>
                <Select
                  value={settings.dataRetention}
                  label="Data Retention"
                  onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
                >
                  <MenuItem value="3months">3 Months</MenuItem>
                  <MenuItem value="6months">6 Months</MenuItem>
                  <MenuItem value="1year">1 Year</MenuItem>
                  <MenuItem value="2years">2 Years</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Auto Refresh (minutes)"
                type="number"
                value={settings.autoRefresh}
                onChange={(e) => handleSettingChange('autoRefresh', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API Key"
                value={settings.apiKey}
                onChange={(e) => handleSettingChange('apiKey', e.target.value)}
                InputProps={{
                  endAdornment: (
                    <Button size="small" sx={{ ml: 1 }}>
                      Regenerate
                    </Button>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Webhook URL"
                placeholder="https://your-app.com/webhook"
                value={settings.webhookUrl}
                onChange={(e) => handleSettingChange('webhookUrl', e.target.value)}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={activeTab} index={4}>
          <List>
            <ListItem>
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Two-Factor Authentication"
                secondary="Add an extra layer of security to your account"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.twoFactorAuth}
                  onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Login Notifications"
                secondary="Get notified of new login attempts"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.loginNotifications}
                  onChange={(e) => handleSettingChange('loginNotifications', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Session Timeout (minutes)"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" color="error" sx={{ mr: 2 }}>
                Change Password
              </Button>
              <Button variant="outlined" color="error">
                Download Account Data
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Restart Welcome Tour Button */}
        <Box sx={{ p: 3, borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
          <Button
            variant="outlined"
            onClick={() => {
              localStorage.removeItem('hasSeenTour');
              window.location.reload();
            }}
            sx={{ mt: 2 }}
          >
            Restart Welcome Tour
          </Button>
        </Box>

        {/* Save Button */}
        <Box sx={{ p: 3, borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}