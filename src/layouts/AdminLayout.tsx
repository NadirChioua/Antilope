import React, { useState } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Package,
  Scissors,
  ShoppingCart,
  Percent,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import Logo from '@/components/Logo';

// Admin Pages
import Dashboard from '@/pages/admin/Dashboard';
import Clients from '@/pages/admin/Clients';
import Bookings from '@/pages/admin/Bookings';
import Products from '@/pages/admin/Products';
import Services from '@/pages/admin/Services';
import SalonServices from '@/pages/admin/SalonServices';
import POS from '@/pages/admin/POS';
import Commissions from '@/pages/admin/Commissions';
import Reports from '@/pages/admin/Reports';
import WhatsAppReports from '@/pages/admin/WhatsAppReports';
import SettingsPage from '@/pages/admin/Settings';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { currentLanguage, setLanguage, languages, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: t('navigation.dashboard'), href: '/admin/dashboard', icon: LayoutDashboard },
    { name: t('navigation.clients'), href: '/admin/clients', icon: Users },
    { name: t('navigation.bookings'), href: '/admin/bookings', icon: Calendar },
    { name: 'Product Usage', href: '/admin/products', icon: Package },
    { name: t('navigation.services'), href: '/admin/services', icon: Scissors },
    { name: t('navigation.pos'), href: '/admin/pos', icon: ShoppingCart },
    { name: t('navigation.commissions'), href: '/admin/commissions', icon: Percent },
    { name: t('navigation.reports'), href: '/admin/reports', icon: BarChart3 },
    { name: 'WhatsApp Reports', href: '/admin/whatsapp-reports', icon: MessageCircle },
    { name: t('navigation.settings'), href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return location.pathname === '/admin/dashboard';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-cream-50">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-soft ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Logo size="md" variant="light" />
              </motion.div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
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
                {!collapsed && <span>{item.name}</span>}
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-4">
          {/* Language Selector */}
          {!collapsed && (
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
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
          )}

          {/* User Info & Logout */}
          <div className="space-y-2">
            {!collapsed && (
              <div className="text-sm p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-800 font-medium">{user?.name}</p>
                <p className="text-gray-500 capitalize">{user?.role}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="sidebar-item w-full text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('auth.logout')}</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
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
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/clients" element={<Clients />} />
              <Route path="/admin/bookings" element={<Bookings />} />
              <Route path="/admin/products" element={<Products />} />
              <Route path="/admin/services" element={<Services />} />
              <Route path="/admin/pos" element={<POS />} />
              <Route path="/admin/commissions" element={<Commissions />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/whatsapp-reports" element={<WhatsAppReports />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
              <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
