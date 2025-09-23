import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Database, Users, Plus, UserCheck } from 'lucide-react';
import Logo from '@/components/Logo';
import { useLanguage } from '@/contexts/LanguageContext';
import StaffManagement from '../../components/admin/StaffManagement';
import UserManagement from '../../components/UserManagement';
import { 
  NotificationSettings, 
  SecuritySettings, 
  AppearanceSettings, 
  DataBackupSettings, 
  AdvancedSettings,
  QuickActions 
} from '../../components/admin/SettingsComponents';

const Settings: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('staff');

  const tabs = [
    { id: 'staff', label: 'Staff Management', icon: Users },
    { id: 'users', label: 'User Management', icon: UserCheck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data & Backup', icon: Database },
    { id: 'advanced', label: 'Advanced', icon: SettingsIcon },
    { id: 'quick', label: 'Quick Actions', icon: Plus },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Logo size="lg" variant="light" />
          <h1 className="text-3xl font-bold text-gray-800 text-elegant">System Settings</h1>
        </div>
        <p className="text-gray-600 mt-1">Configure application preferences and system options</p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'staff' && <StaffManagement />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'security' && <SecuritySettings />}
        {activeTab === 'appearance' && <AppearanceSettings />}
        {activeTab === 'data' && <DataBackupSettings />}
        {activeTab === 'advanced' && <AdvancedSettings />}
        {activeTab === 'quick' && <QuickActions />}
      </motion.div>
    </div>
  );
};

export default Settings;
