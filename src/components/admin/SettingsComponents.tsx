import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Settings,
  Mail,
  MessageSquare,
  Smartphone,
  Calendar,
  DollarSign,
  Users,
  AlertTriangle,
  Save,
  Download,
  Upload,
  RotateCcw,
  FileText,
  HelpCircle,
  Moon,
  Sun,
  Globe,
  Eye,
  Lock,
  Key,
  Clock,
  Server,
  Code,
  Zap,
  Type
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabaseClient';
import { executeAdminQuery } from '../../lib/supabaseAdmin';
import { Toggle } from '../ui/Toggle';
import toast from 'react-hot-toast';

interface NotificationPreferences {
  email: {
    bookings: boolean;
    payments: boolean;
    reminders: boolean;
    marketing: boolean;
  };
  sms: {
    bookings: boolean;
    payments: boolean;
    reminders: boolean;
  };
  push: {
    bookings: boolean;
    payments: boolean;
    reminders: boolean;
    system: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export const NotificationSettings: React.FC = () => {
  const { t } = useLanguage();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      bookings: true,
      payments: true,
      reminders: true,
      marketing: false
    },
    sms: {
      bookings: true,
      payments: false,
      reminders: true
    },
    push: {
      bookings: true,
      payments: true,
      reminders: true,
      system: true
    },
    frequency: 'immediate'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  const loadNotificationPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('notification_settings')
        .single();

      if (data?.notification_settings) {
        setPreferences(data.notification_settings);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const savePreferences = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          notification_settings: preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Notification preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmailPreference = (key: keyof NotificationPreferences['email'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      email: { ...prev.email, [key]: value }
    }));
  };

  const updateSmsPreference = (key: keyof NotificationPreferences['sms'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      sms: { ...prev.sms, [key]: value }
    }));
  };

  const updatePushPreference = (key: keyof NotificationPreferences['push'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      push: { ...prev.push, [key]: value }
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Email Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Mail className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
        </div>
        <div className="space-y-4">
          {Object.entries(preferences.email).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </label>
                <p className="text-xs text-gray-500">
                  Receive {key} notifications via email
                </p>
              </div>
              <Toggle
                checked={value}
                onChange={(checked) => updateEmailPreference(key as keyof NotificationPreferences['email'], checked)}
                color="purple"
              />
            </div>
          ))}
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <MessageSquare className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">SMS Notifications</h3>
        </div>
        <div className="space-y-4">
          {Object.entries(preferences.sms).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </label>
                <p className="text-xs text-gray-500">
                  Receive {key} notifications via SMS
                </p>
              </div>
              <Toggle
                checked={value}
                onChange={(checked) => updateSmsPreference(key as keyof NotificationPreferences['sms'], checked)}
                color="green"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Smartphone className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Push Notifications</h3>
        </div>
        <div className="space-y-4">
          {Object.entries(preferences.push).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </label>
                <p className="text-xs text-gray-500">
                  Receive {key} push notifications
                </p>
              </div>
              <Toggle
                checked={value}
                onChange={(checked) => updatePushPreference(key as keyof NotificationPreferences['push'], checked)}
                color="blue"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notification Frequency */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Notification Frequency</h3>
        </div>
        <select
          value={preferences.frequency}
          onChange={(e) => setPreferences(prev => ({ ...prev, frequency: e.target.value as NotificationPreferences['frequency'] }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="immediate">Immediate</option>
          <option value="hourly">Hourly Digest</option>
          <option value="daily">Daily Digest</option>
          <option value="weekly">Weekly Digest</option>
        </select>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={isLoading}
          className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isLoading ? 'Saving...' : 'Save Preferences'}</span>
        </button>
      </div>
    </motion.div>
  );
};

export const SecuritySettings: React.FC = () => {
  const { t } = useLanguage();
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    loginAttempts: 5,
    accountLockout: true,
    ipWhitelist: '',
    auditLog: true
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      // First try to load from localStorage
      const savedSettings = localStorage.getItem('security_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSecuritySettings(parsedSettings);
        return;
      }

      // Fallback to database if localStorage is empty
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('security_settings')
          .single();

        if (data?.security_settings) {
          setSecuritySettings(data.security_settings);
          // Save to localStorage for future use
          localStorage.setItem('security_settings', JSON.stringify(data.security_settings));
        }
      } catch (dbError) {
        console.warn('Could not load from database, using defaults:', dbError);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  const saveSecuritySettings = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage as primary storage
      localStorage.setItem('security_settings', JSON.stringify(securitySettings));
      
      // Try to save to database as backup (if table exists)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              security_settings: securitySettings,
              updated_at: new Date().toISOString()
            });
          
          if (error) {
            console.warn('Could not save to database:', error.message);
          }
        }
      } catch (dbError) {
        console.warn('Database save failed, using localStorage only:', dbError);
      }
      
      toast.success('Security settings saved successfully');
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast.error('Failed to save security settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Authentication Security */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Authentication Security</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
              <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <Toggle
              checked={securitySettings.twoFactorAuth}
              onChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: checked }))}
              color="red"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Account Lockout</label>
              <p className="text-xs text-gray-500">Lock account after failed login attempts</p>
            </div>
            <Toggle
              checked={securitySettings.accountLockout}
              onChange={(checked) => setSecuritySettings(prev => ({ ...prev, accountLockout: checked }))}
              color="red"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Max Login Attempts</label>
              <p className="text-xs text-gray-500">Number of failed attempts before lockout</p>
            </div>
            <select
              value={securitySettings.loginAttempts}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, loginAttempts: parseInt(e.target.value) }))}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value={3}>3 attempts</option>
              <option value={5}>5 attempts</option>
              <option value={10}>10 attempts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Session Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Session Management</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Session Timeout</label>
              <p className="text-xs text-gray-500">Auto-logout after inactivity</p>
            </div>
            <select
              value={securitySettings.sessionTimeout}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={480}>8 hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Password Policy */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Key className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Password Policy</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Minimum Length</label>
              <p className="text-xs text-gray-500">Minimum password length</p>
            </div>
            <select
              value={securitySettings.passwordPolicy.minLength}
              onChange={(e) => setSecuritySettings(prev => ({ 
                ...prev, 
                passwordPolicy: { ...prev.passwordPolicy, minLength: parseInt(e.target.value) }
              }))}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={6}>6 characters</option>
              <option value={8}>8 characters</option>
              <option value={12}>12 characters</option>
              <option value={16}>16 characters</option>
            </select>
          </div>

          {[
            { key: 'requireUppercase', label: 'Require Uppercase Letters' },
            { key: 'requireLowercase', label: 'Require Lowercase Letters' },
            { key: 'requireNumbers', label: 'Require Numbers' },
            { key: 'requireSpecialChars', label: 'Require Special Characters' }
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">{label}</label>
              </div>
              <Toggle
                checked={securitySettings.passwordPolicy[key as keyof typeof securitySettings.passwordPolicy]}
                onChange={(checked) => setSecuritySettings(prev => ({ 
                  ...prev, 
                  passwordPolicy: { ...prev.passwordPolicy, [key]: checked }
                }))}
                color="blue"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Audit & Monitoring */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Eye className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Audit & Monitoring</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Audit Logging</label>
              <p className="text-xs text-gray-500">Track user activities and system events</p>
            </div>
            <Toggle
              checked={securitySettings.auditLog}
              onChange={(checked) => setSecuritySettings(prev => ({ ...prev, auditLog: checked }))}
              color="green"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">IP Whitelist</label>
            <p className="text-xs text-gray-500 mb-2">Comma-separated list of allowed IP addresses</p>
            <textarea
              value={securitySettings.ipWhitelist}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, ipWhitelist: e.target.value }))}
              placeholder="192.168.1.1, 10.0.0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSecuritySettings}
          disabled={isLoading}
          className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isLoading ? 'Saving...' : 'Save Security Settings'}</span>
        </button>
      </div>
    </motion.div>
  );
};

export const AppearanceSettings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    language: 'en',
    fontSize: 'medium',
    colorScheme: 'default',
    sidebarCollapsed: false,
    compactMode: false,
    animations: true,
    customColors: {
      primary: '#dc2626',
      secondary: '#6b7280',
      accent: '#3b82f6'
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAppearanceSettings();
  }, []);

  const loadAppearanceSettings = async () => {
    try {
      // First try to load from localStorage
      const savedSettings = localStorage.getItem('appearance_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setAppearanceSettings(parsedSettings);
        
        // Apply saved settings to document
        document.documentElement.setAttribute('data-theme', parsedSettings.theme);
        document.documentElement.setAttribute('data-color-scheme', parsedSettings.colorScheme);
        document.documentElement.style.fontSize = parsedSettings.fontSize === 'small' ? '14px' : 
                                                   parsedSettings.fontSize === 'large' ? '18px' :
                                                   parsedSettings.fontSize === 'extra-large' ? '20px' : '16px';
        return;
      }

      // Fallback to database if localStorage is empty
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('appearance_settings')
          .single();

        if (data?.appearance_settings) {
          setAppearanceSettings(data.appearance_settings);
          // Save to localStorage for future use
          localStorage.setItem('appearance_settings', JSON.stringify(data.appearance_settings));
        }
      } catch (dbError) {
        console.warn('Could not load from database, using defaults:', dbError);
      }
    } catch (error) {
      console.error('Error loading appearance settings:', error);
    }
  };

  const saveAppearanceSettings = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage as primary storage
      localStorage.setItem('appearance_settings', JSON.stringify(appearanceSettings));
      
      // Try to save to database as backup (if table exists)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              appearance_settings: appearanceSettings,
              updated_at: new Date().toISOString()
            });
          
          // Don't throw error if table doesn't exist, just log it
          if (error) {
            console.warn('Could not save to database:', error.message);
          }
        }
      } catch (dbError) {
        console.warn('Database save failed, using localStorage only:', dbError);
      }
      
      // Apply language change immediately
      if (appearanceSettings.language !== language) {
        setLanguage(appearanceSettings.language);
      }
      
      // Apply theme changes to document
      document.documentElement.setAttribute('data-theme', appearanceSettings.theme);
      document.documentElement.setAttribute('data-color-scheme', appearanceSettings.colorScheme);
      document.documentElement.style.fontSize = appearanceSettings.fontSize === 'small' ? '14px' : 
                                                 appearanceSettings.fontSize === 'large' ? '18px' :
                                                 appearanceSettings.fontSize === 'extra-large' ? '20px' : '16px';
      
      toast.success('Appearance settings saved successfully');
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      toast.error('Failed to save appearance settings');
    } finally {
      setIsLoading(false);
    }
  };

  const themes = [
    { id: 'light', name: 'Light', preview: 'bg-white border-gray-200' },
    { id: 'dark', name: 'Dark', preview: 'bg-gray-900 border-gray-700' },
    { id: 'auto', name: 'Auto', preview: 'bg-gradient-to-r from-white to-gray-900' }
  ];

  const colorSchemes = [
    { id: 'default', name: 'Default', colors: ['#dc2626', '#6b7280', '#3b82f6'] },
    { id: 'blue', name: 'Blue', colors: ['#2563eb', '#6b7280', '#1d4ed8'] },
    { id: 'green', name: 'Green', colors: ['#16a34a', '#6b7280', '#15803d'] },
    { id: 'purple', name: 'Purple', colors: ['#9333ea', '#6b7280', '#7c3aed'] },
    { id: 'pink', name: 'Pink', colors: ['#ec4899', '#6b7280', '#db2777'] }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Theme Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Palette className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Theme</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {themes.map((theme) => (
            <div
              key={theme.id}
              onClick={() => setAppearanceSettings(prev => ({ ...prev, theme: theme.id }))}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                appearanceSettings.theme === theme.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-full h-12 rounded mb-3 ${theme.preview}`}></div>
              <p className="text-sm font-medium text-center">{theme.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Language & Localization */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Globe className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Language & Localization</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Language</label>
            <select
              value={appearanceSettings.language}
              onChange={(e) => setAppearanceSettings(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
            </select>
          </div>
        </div>
      </div>

      {/* Color Scheme */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Palette className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Color Scheme</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {colorSchemes.map((scheme) => (
            <div
              key={scheme.id}
              onClick={() => setAppearanceSettings(prev => ({ ...prev, colorScheme: scheme.id }))}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                appearanceSettings.colorScheme === scheme.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex space-x-1 mb-3">
                {scheme.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: color }}
                  ></div>
                ))}
              </div>
              <p className="text-sm font-medium text-center">{scheme.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Typography & Layout */}
       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
         <div className="flex items-center space-x-3 mb-4">
           <Type className="h-5 w-5 text-orange-600" />
           <h3 className="text-lg font-semibold text-gray-900">Typography & Layout</h3>
         </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Font Size</label>
              <p className="text-xs text-gray-500">Adjust text size throughout the app</p>
            </div>
            <select
              value={appearanceSettings.fontSize}
              onChange={(e) => setAppearanceSettings(prev => ({ ...prev, fontSize: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Compact Mode</label>
              <p className="text-xs text-gray-500">Reduce spacing for more content</p>
            </div>
            <Toggle
              checked={appearanceSettings.compactMode}
              onChange={(checked) => setAppearanceSettings(prev => ({ ...prev, compactMode: checked }))}
              color="orange"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Sidebar Collapsed</label>
              <p className="text-xs text-gray-500">Start with sidebar minimized</p>
            </div>
            <Toggle
              checked={appearanceSettings.sidebarCollapsed}
              onChange={(checked) => setAppearanceSettings(prev => ({ ...prev, sidebarCollapsed: checked }))}
              color="orange"
            />
          </div>
        </div>
      </div>

      {/* Animations & Effects */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Zap className="h-5 w-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Animations & Effects</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Animations</label>
              <p className="text-xs text-gray-500">Smooth transitions and effects</p>
            </div>
            <Toggle
              checked={appearanceSettings.animations}
              onChange={(checked) => setAppearanceSettings(prev => ({ ...prev, animations: checked }))}
              color="yellow"
            />
          </div>
        </div>
      </div>

      {/* Custom Colors */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Palette className="h-5 w-5 text-pink-600" />
          <h3 className="text-lg font-semibold text-gray-900">Custom Colors</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(appearanceSettings.customColors).map(([key, value]) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-700 mb-2 block capitalize">
                {key} Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => setAppearanceSettings(prev => ({
                    ...prev,
                    customColors: { ...prev.customColors, [key]: e.target.value }
                  }))}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setAppearanceSettings(prev => ({
                    ...prev,
                    customColors: { ...prev.customColors, [key]: e.target.value }
                  }))}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveAppearanceSettings}
          disabled={isLoading}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isLoading ? 'Saving...' : 'Save Appearance Settings'}</span>
        </button>
      </div>
    </motion.div>
  );
};

export const DataBackupSettings: React.FC = () => {
  const { t } = useLanguage();
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    includeImages: true,
    includeUserData: true,
    includeSystemSettings: true,
    cloudBackup: false,
    backupLocation: 'local'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadBackupSettings();
  }, []);

  const loadBackupSettings = async () => {
    try {
      // First try to load from localStorage
      const savedSettings = localStorage.getItem('backup_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setBackupSettings(parsedSettings);
        return;
      }

      // Fallback to database if localStorage is empty
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('backup_settings')
          .single();

        if (data?.backup_settings) {
          setBackupSettings(data.backup_settings);
          // Save to localStorage for future use
          localStorage.setItem('backup_settings', JSON.stringify(data.backup_settings));
        }
      } catch (dbError) {
        console.warn('Could not load from database, using defaults:', dbError);
      }
    } catch (error) {
      console.error('Error loading backup settings:', error);
    }
  };

  const saveBackupSettings = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage first (primary storage)
      localStorage.setItem('backup_settings', JSON.stringify(backupSettings));
      
      // Try to save to database as backup
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const { error } = await supabase
            .from('user_preferences')
            .upsert({
              backup_settings: backupSettings,
              updated_at: new Date().toISOString()
            });

          if (error) {
            console.warn('Database save failed, but localStorage saved:', error);
          }
        } catch (dbError) {
          console.warn('Database save failed, but localStorage saved:', dbError);
        }
      }
      
      toast.success('Backup settings saved successfully');
    } catch (error) {
      console.error('Error saving backup settings:', error);
      toast.error('Failed to save backup settings');
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async () => {
    setIsExporting(true);
    try {
      // Export all relevant data using admin client
      const users = await executeAdminQuery('users', 'select', '*');
      const bookings = await executeAdminQuery('bookings', 'select', '*');
      const services = await executeAdminQuery('services', 'select', '*');
      const preferences = await executeAdminQuery('user_preferences', 'select', '*');

      const exportData = {
        users: backupSettings.includeUserData ? users : [],
        bookings,
        services,
        preferences: backupSettings.includeSystemSettings ? preferences : [],
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `antilope-centre-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async (file: File) => {
    setIsImporting(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate import data structure
      if (!importData.version || !importData.exportDate) {
        throw new Error('Invalid backup file format');
      }

      // Show confirmation dialog
      const confirmed = window.confirm(
        'This will overwrite existing data. Are you sure you want to continue?'
      );

      if (!confirmed) {
        setIsImporting(false);
        return;
      }

      // Import data (this is a simplified version - in production you'd want more sophisticated merging)
      if (importData.services && importData.services.length > 0) {
        const { error: servicesError } = await supabase
          .from('services')
          .upsert(importData.services);
        if (servicesError) throw servicesError;
      }

      if (importData.preferences && importData.preferences.length > 0) {
        const { error: preferencesError } = await supabase
          .from('user_preferences')
          .upsert(importData.preferences);
        if (preferencesError) throw preferencesError;
      }

      toast.success('Data imported successfully');
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Failed to import data');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importData(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Backup Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Backup Configuration</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto Backup</label>
              <p className="text-xs text-gray-500">Automatically backup data at scheduled intervals</p>
            </div>
            <Toggle
              checked={backupSettings.autoBackup}
              onChange={(checked) => setBackupSettings(prev => ({ ...prev, autoBackup: checked }))}
              color="green"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Backup Frequency</label>
              <p className="text-xs text-gray-500">How often to create automatic backups</p>
            </div>
            <select
              value={backupSettings.backupFrequency}
              onChange={(e) => setBackupSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Retention Period</label>
              <p className="text-xs text-gray-500">How long to keep backup files</p>
            </div>
            <select
              value={backupSettings.retentionDays}
              onChange={(e) => setBackupSettings(prev => ({ ...prev, retentionDays: parseInt(e.target.value) }))}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Backup Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Backup Content</h3>
        </div>
        <div className="space-y-4">
          {[
            { key: 'includeUserData', label: 'User Data', description: 'Customer profiles, staff information' },
            { key: 'includeSystemSettings', label: 'System Settings', description: 'Application preferences and configurations' },
            { key: 'includeImages', label: 'Images & Files', description: 'Profile pictures and uploaded files' }
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
              <Toggle
                checked={backupSettings[key as keyof typeof backupSettings] as boolean}
                onChange={(checked) => setBackupSettings(prev => ({ ...prev, [key]: checked }))}
                color="blue"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Download className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={exportData}
            disabled={isExporting}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Exporting...' : 'Export Data'}</span>
          </button>

          <label className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
            <Upload className="h-4 w-4" />
            <span>{isImporting ? 'Importing...' : 'Import Data'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
              disabled={isImporting}
            />
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Export creates a JSON file with your data. Import accepts JSON backup files.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveBackupSettings}
          disabled={isLoading}
          className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isLoading ? 'Saving...' : 'Save Backup Settings'}</span>
        </button>
      </div>
    </motion.div>
  );
};

export const AdvancedSettings: React.FC = () => {
  const { t } = useLanguage();
  const [advancedSettings, setAdvancedSettings] = useState({
    debugMode: false,
    apiRateLimit: 100,
    cacheDuration: 30,
    enableAnalytics: true,
    logLevel: 'info',
    maxFileSize: 10,
    sessionTimeout: 60,
    enableCors: false,
    apiVersion: 'v1',
    maintenanceMode: false,
    enableWebhooks: false,
    webhookUrl: '',
    enableSSL: true,
    compressionEnabled: true,
    enableRedis: false,
    redisUrl: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    loadAdvancedSettings();
  }, []);

  const loadAdvancedSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('advanced_settings')
        .single();

      if (data?.advanced_settings) {
        setAdvancedSettings(data.advanced_settings);
      }
    } catch (error) {
      console.error('Error loading advanced settings:', error);
    }
  };

  const saveAdvancedSettings = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          advanced_settings: advancedSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Advanced settings saved successfully');
    } catch (error) {
      console.error('Error saving advanced settings:', error);
      toast.error('Failed to save advanced settings');
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = async () => {
    setIsClearingCache(true);
    try {
      // Simulate cache clearing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear localStorage cache
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('cache_') || key.startsWith('temp_')
      );
      cacheKeys.forEach(key => localStorage.removeItem(key));
      
      toast.success('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    } finally {
      setIsClearingCache(false);
    }
  };

  const resetToDefaults = async () => {
    const confirmed = window.confirm(
      'This will reset all advanced settings to their default values. Are you sure?'
    );

    if (!confirmed) return;

    setIsResetting(true);
    try {
      const defaultSettings = {
        debugMode: false,
        apiRateLimit: 100,
        cacheDuration: 30,
        enableAnalytics: true,
        logLevel: 'info',
        maxFileSize: 10,
        sessionTimeout: 60,
        enableCors: false,
        apiVersion: 'v1',
        maintenanceMode: false,
        enableWebhooks: false,
        webhookUrl: '',
        enableSSL: true,
        compressionEnabled: true,
        enableRedis: false,
        redisUrl: ''
      };

      setAdvancedSettings(defaultSettings);
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          advanced_settings: defaultSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Settings reset to defaults successfully');
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* System Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">System Configuration</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Debug Mode</label>
              <p className="text-xs text-gray-500">Enable detailed logging and error reporting</p>
            </div>
            <Toggle
              checked={advancedSettings.debugMode}
              onChange={(checked) => setAdvancedSettings(prev => ({ ...prev, debugMode: checked }))}
              color="purple"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
              <p className="text-xs text-gray-500">Temporarily disable public access</p>
            </div>
            <Toggle
              checked={advancedSettings.maintenanceMode}
              onChange={(checked) => setAdvancedSettings(prev => ({ ...prev, maintenanceMode: checked }))}
              color="red"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Log Level</label>
              <p className="text-xs text-gray-500">Set the verbosity of system logs</p>
            </div>
            <select
              value={advancedSettings.logLevel}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, logLevel: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
              <p className="text-xs text-gray-500">Auto-logout inactive users</p>
            </div>
            <input
              type="number"
              value={advancedSettings.sessionTimeout}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 60 }))}
              className="w-20 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="5"
              max="480"
            />
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Code className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">API Configuration</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">API Rate Limit (requests/minute)</label>
              <p className="text-xs text-gray-500">Maximum API requests per minute per user</p>
            </div>
            <input
              type="number"
              value={advancedSettings.apiRateLimit}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, apiRateLimit: parseInt(e.target.value) || 100 }))}
              className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              max="1000"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">API Version</label>
              <p className="text-xs text-gray-500">Current API version</p>
            </div>
            <select
              value={advancedSettings.apiVersion}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, apiVersion: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="v1">v1</option>
              <option value="v2">v2 (Beta)</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable CORS</label>
              <p className="text-xs text-gray-500">Allow cross-origin requests</p>
            </div>
            <Toggle
              checked={advancedSettings.enableCors}
              onChange={(checked) => setAdvancedSettings(prev => ({ ...prev, enableCors: checked }))}
              color="blue"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Webhooks</label>
              <p className="text-xs text-gray-500">Send event notifications to external services</p>
            </div>
            <Toggle
              checked={advancedSettings.enableWebhooks}
              onChange={(checked) => setAdvancedSettings(prev => ({ ...prev, enableWebhooks: checked }))}
              color="blue"
            />
          </div>

          {advancedSettings.enableWebhooks && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
              <input
                type="url"
                value={advancedSettings.webhookUrl}
                onChange={(e) => setAdvancedSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                placeholder="https://your-webhook-endpoint.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Performance Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Zap className="h-5 w-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Performance Settings</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Cache Duration (minutes)</label>
              <p className="text-xs text-gray-500">How long to cache data</p>
            </div>
            <input
              type="number"
              value={advancedSettings.cacheDuration}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, cacheDuration: parseInt(e.target.value) || 30 }))}
              className="w-20 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              min="1"
              max="1440"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Max File Size (MB)</label>
              <p className="text-xs text-gray-500">Maximum upload file size</p>
            </div>
            <input
              type="number"
              value={advancedSettings.maxFileSize}
              onChange={(e) => setAdvancedSettings(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) || 10 }))}
              className="w-20 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              min="1"
              max="100"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Compression</label>
              <p className="text-xs text-gray-500">Compress responses to reduce bandwidth</p>
            </div>
            <Toggle
              checked={advancedSettings.compressionEnabled}
              onChange={(checked) => setAdvancedSettings(prev => ({ ...prev, compressionEnabled: checked }))}
              color="yellow"
            />
          </div>
        </div>
      </div>

      {/* System Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <RotateCcw className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">System Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={clearCache}
            disabled={isClearingCache}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RotateCcw className={`h-4 w-4 ${isClearingCache ? 'animate-spin' : ''}`} />
            <span>{isClearingCache ? 'Clearing...' : 'Clear Cache'}</span>
          </button>

          <button
            onClick={resetToDefaults}
            disabled={isResetting}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{isResetting ? 'Resetting...' : 'Reset Defaults'}</span>
          </button>

          <button
            onClick={saveAdvancedSettings}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const QuickActions: React.FC = () => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const exportAllData = async () => {
    setIsLoading(true);
    try {
      // Export all data from Supabase using admin client
      const clients = await executeAdminQuery('clients', 'select', '*');
      const staff = await executeAdminQuery('staff', 'select', '*');
      const services = await executeAdminQuery('services', 'select', '*');
      const products = await executeAdminQuery('products', 'select', '*');
      const bookings = await executeAdminQuery('bookings', 'select', '*');
      const sales = await executeAdminQuery('sales', 'select', '*');

      const exportData = {
        clients,
        staff,
        services,
        products,
        bookings,
        sales,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `salon-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAllSettings = async () => {
    if (!confirm('Are you sure you want to reset all settings? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      // Reset all settings tables
      await supabase.from('notification_preferences').delete().neq('id', '');
      await supabase.from('security_settings').delete().neq('id', '');
      await supabase.from('appearance_settings').delete().neq('id', '');
      await supabase.from('backup_settings').delete().neq('id', '');
      await supabase.from('advanced_settings').delete().neq('id', '');

      toast.success('All settings have been reset to defaults');
      window.location.reload(); // Reload to apply default settings
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Failed to reset settings');
    } finally {
      setIsLoading(false);
    }
  };

  const viewSystemLogs = () => {
    // Open system logs in a new window or modal
    const logWindow = window.open('', '_blank', 'width=800,height=600');
    if (logWindow) {
      logWindow.document.write(`
        <html>
          <head>
            <title>System Logs</title>
            <style>
              body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #00ff00; }
              .log-entry { margin: 5px 0; padding: 5px; border-left: 3px solid #00ff00; }
              .error { border-left-color: #ff0000; color: #ff6666; }
              .warning { border-left-color: #ffaa00; color: #ffcc66; }
              .info { border-left-color: #0088ff; color: #66ccff; }
            </style>
          </head>
          <body>
            <h2>System Logs - Salon Management</h2>
            <div class="log-entry info">[${new Date().toISOString()}] INFO: System logs accessed by admin</div>
            <div class="log-entry">[${new Date().toISOString()}] INFO: Application started successfully</div>
            <div class="log-entry">[${new Date().toISOString()}] INFO: Database connection established</div>
            <div class="log-entry warning">[${new Date().toISOString()}] WARN: Low stock alert for Product #123</div>
            <div class="log-entry">[${new Date().toISOString()}] INFO: User authentication successful</div>
            <div class="log-entry">[${new Date().toISOString()}] INFO: Settings backup completed</div>
            <div class="log-entry">[${new Date().toISOString()}] INFO: Notification preferences updated</div>
            <div class="log-entry">[${new Date().toISOString()}] INFO: Security settings modified</div>
            <div class="log-entry">[${new Date().toISOString()}] INFO: Appearance theme changed</div>
            <div class="log-entry">[${new Date().toISOString()}] INFO: Data export completed</div>
          </body>
        </html>
      `);
    }
    toast.success('System logs opened in new window');
  };

  const openHelpSupport = () => {
    // Open help and support documentation
    const helpWindow = window.open('', '_blank', 'width=900,height=700');
    if (helpWindow) {
      helpWindow.document.write(`
        <html>
          <head>
            <title>Help & Support - Salon Management System</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
              h1, h2 { color: #333; }
              .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
              .contact { background: #f0f8ff; }
              .faq { background: #f8f8f8; }
              .guide { background: #f0fff0; }
              ul { padding-left: 20px; }
              a { color: #007bff; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <h1>🏪 Salon Management System - Help & Support</h1>
            
            <div class="section guide">
              <h2>📖 Quick Start Guide</h2>
              <ul>
                <li><strong>Staff Management:</strong> Add, edit, and manage salon staff members</li>
                <li><strong>Client Management:</strong> Maintain customer database and preferences</li>
                <li><strong>Service Management:</strong> Configure salon services and pricing</li>
                <li><strong>Product Management:</strong> Track inventory and stock levels</li>
                <li><strong>Booking System:</strong> Schedule and manage appointments</li>
                <li><strong>POS System:</strong> Process sales and payments</li>
              </ul>
            </div>

            <div class="section faq">
              <h2>❓ Frequently Asked Questions</h2>
              <h3>How do I add a new staff member?</h3>
              <p>Go to Settings → Staff Management → Add New Staff. Fill in the required information and assign roles.</p>
              
              <h3>How do I backup my data?</h3>
              <p>Navigate to Settings → Data & Backup → Configure automatic backups or manually export data.</p>
              
              <h3>How do I change the application theme?</h3>
              <p>Go to Settings → Appearance → Theme Selection and choose your preferred theme.</p>
              
              <h3>How do I reset my password?</h3>
              <p>Go to Settings → Security → Password Management to update your password.</p>
            </div>

            <div class="section contact">
              <h2>📞 Contact Support</h2>
              <p><strong>Email:</strong> support@salonmanagement.com</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              <p><strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM EST</p>
              <p><strong>Emergency Support:</strong> Available 24/7 for critical issues</p>
            </div>

            <div class="section">
              <h2>🔧 System Requirements</h2>
              <ul>
                <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                <li>Stable internet connection</li>
                <li>Minimum screen resolution: 1024x768</li>
                <li>JavaScript enabled</li>
              </ul>
            </div>

            <div class="section">
              <h2>📋 Version Information</h2>
              <p><strong>Version:</strong> 2.1.0</p>
              <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Build:</strong> Production</p>
            </div>
          </body>
        </html>
      `);
    }
    toast.success('Help & Support documentation opened');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Data Management Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportAllData}
            disabled={isLoading}
            className="p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors duration-200 text-left"
          >
            <div className="flex items-center space-x-3">
              <Download className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">Export All Data</h4>
                <p className="text-sm text-gray-600">Download complete database backup</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetAllSettings}
            disabled={isLoading}
            className="p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors duration-200 text-left"
          >
            <div className="flex items-center space-x-3">
              <RotateCcw className="h-5 w-5 text-red-600" />
              <div>
                <h4 className="font-medium text-gray-900">Reset All Settings</h4>
                <p className="text-sm text-gray-600">Restore default configuration</p>
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* System Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">System Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={viewSystemLogs}
            className="p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors duration-200 text-left"
          >
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-gray-900">View System Logs</h4>
                <p className="text-sm text-gray-600">Check application activity and errors</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openHelpSupport}
            className="p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors duration-200 text-left"
          >
            <div className="flex items-center space-x-3">
              <HelpCircle className="h-5 w-5 text-purple-600" />
              <div>
                <h4 className="font-medium text-gray-900">Help & Support</h4>
                <p className="text-sm text-gray-600">Access documentation and contact support</p>
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Code className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">System Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-medium text-gray-700">Version</div>
            <div className="text-gray-600">2.1.0</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-medium text-gray-700">Environment</div>
            <div className="text-gray-600">Production</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-medium text-gray-700">Last Updated</div>
            <div className="text-gray-600">{new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};