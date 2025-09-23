import React, { useState } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ShoppingCart,
  Percent,
  Users,
  Calendar,
  LogOut,
  Menu,
  X,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '@/components/Logo';

// Staff Pages
import StaffPOS from '@/pages/staff/StaffPOS';
import StaffCommissions from '@/pages/staff/StaffCommissions';
import StaffClients from '@/pages/staff/StaffClients';
import StaffBookings from '@/pages/staff/StaffBookings';

const StaffLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { currentLanguage, setLanguage, languages, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: t('navigation.newSale'), href: '/', icon: ShoppingCart },
    { name: t('navigation.myAppointments'), href: '/staff/bookings', icon: Calendar },
    { name: t('navigation.myCommissions'), href: '/staff/commissions', icon: Percent },
    { name: t('navigation.clientHistory'), href: '/staff/clients', icon: Users },
  ];

  const handleLogout = () => {
    logout();
    toast.success(t('notifications.loggedOut'));
    navigate('/');
  };

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-cream-50">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="hidden lg:flex bg-white border-r border-gray-200 flex-col w-70 shadow-soft"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <Logo size="md" variant="light" />
          <p className="text-sm text-gray-600 mt-2 font-medium">{t('auth.staff')} Portal</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={`sidebar-item w-full ${isActive(item.href) ? 'active' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-4">
          {/* Language Selector */}
          <div className="space-y-2">
            <label className="text-xs text-gray-600 uppercase tracking-wider font-medium">
              {t('settings.language')}
            </label>
            <select
              value={currentLanguage.code}
              onChange={(e) => {
                const lang = languages.find(l => l.code === e.target.value);
                if (lang) setLanguage(lang);
              }}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </option>
              ))}
            </select>
          </div>

          {/* User Info & Logout */}
          <div className="space-y-2">
            <div className="text-sm p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-800 font-medium">{user?.name}</p>
              <p className="text-gray-600 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="sidebar-item w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            
            {/* Mobile Sidebar Content */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 h-full w-70 bg-white border-r border-gray-200 z-50 lg:hidden shadow-soft"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <Logo size="md" variant="light" />
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.name}
                      onClick={() => {
                        navigate(item.href);
                        setSidebarOpen(false);
                      }}
                      className={`sidebar-item w-full ${isActive(item.href) ? 'active' : ''}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </motion.button>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 space-y-4">
                {/* Language Selector */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-600 uppercase tracking-wider font-medium">
                    {t('settings.language')}
                  </label>
                  <select
                    value={currentLanguage.code}
                    onChange={(e) => {
                      const lang = languages.find(l => l.code === e.target.value);
                      if (lang) setLanguage(lang);
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.nativeName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Info & Logout */}
                <div className="space-y-2">
                  <div className="text-sm p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-800 font-medium">{user?.name}</p>
                    <p className="text-gray-600 capitalize">{user?.role}</p>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setSidebarOpen(false);
                    }}
                    className="sidebar-item w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    <span>{t('auth.logout')}</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <Logo size="sm" variant="light" />
            <div className="w-10" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-cream-50">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<StaffPOS />} />
              <Route path="/staff/bookings" element={<StaffBookings />} />
              <Route path="/staff/commissions" element={<StaffCommissions />} />
              <Route path="/staff/clients" element={<StaffClients />} />
              <Route path="/staff/*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden bg-white border-t border-gray-200 shadow-soft">
          <div className="flex">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`mobile-nav-item flex-1 py-3 ${
                    isActive(item.href) ? 'active' : ''
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs">{item.name}</span>
                </button>
              );
            })}
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="mobile-nav-item flex-1 py-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-6 h-6" />
              <span className="text-xs">{t('auth.logout')}</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default StaffLayout;
