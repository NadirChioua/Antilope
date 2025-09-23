import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  Scissors,
  Package,
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  Percent,
  BarChart3,
} from 'lucide-react';
import { DashboardStats } from '@/types';
import Logo from '@/components/Logo';
import { useLanguage } from '@/contexts/LanguageContext';
import { dashboardService } from '@/services/database';
import { supabaseAdmin, executeAdminQuery } from '@/lib/supabaseAdmin';
import { formatPrice } from '@/utils/currency';
import CommissionDashboard from '@/components/admin/CommissionDashboard';

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'commissions'>('overview');
  const [connectionTest, setConnectionTest] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const dashboardStats = await dashboardService.getStats();
        setStats(dashboardStats);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const testSupabaseConnection = async () => {
    setConnectionTest({ status: 'testing', message: 'Testing Supabase connection...' });
    
    try {
      console.log('🔄 Testing Supabase connection...');
      
      // Test basic connection using admin client
      const { data, error } = await executeAdminQuery(
        (client) => client.from('clients').select('*').limit(1)
      );
      
      if (error) {
        console.error('❌ Supabase connection error:', error);
        setConnectionTest({ 
          status: 'error', 
          message: `Connection failed: ${error.message}` 
        });
        return;
      }
      
      console.log('✅ Supabase connection successful:', data);
      setConnectionTest({ 
        status: 'success', 
        message: `Connection successful! Found ${data?.length || 0} clients in database.` 
      });
      
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setConnectionTest({ 
        status: 'error', 
        message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}` 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Logo size="lg" variant="light" />
          <h1 className="text-3xl font-bold text-gray-800 text-elegant">{t('dashboard.title')}</h1>
        </div>
        <p className="text-gray-600 mt-1">{t('dashboard.subtitle')}</p>
      </motion.div>

      {/* Supabase Connection Test */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-800">Supabase Connection Test</h3>
            <p className="text-xs text-blue-600 mt-1">
              {connectionTest.message || 'Click to test database connection'}
            </p>
          </div>
          <button
            onClick={testSupabaseConnection}
            disabled={connectionTest.status === 'testing'}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              connectionTest.status === 'testing'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : connectionTest.status === 'success'
                ? 'bg-green-500 text-white hover:bg-green-600'
                : connectionTest.status === 'error'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {connectionTest.status === 'testing' ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-200"
      >
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('commissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'commissions'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Commissions
            </div>
          </button>
        </nav>
      </motion.div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center hover:shadow-elegant transition-all duration-200"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatPrice(stats.totalSales)}</p>
          <p className="text-gray-600 text-sm">{t('dashboard.totalSales')}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card text-center hover:shadow-elegant transition-all duration-200"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalClients}</p>
          <p className="text-gray-600 text-sm">{t('dashboard.totalClients')}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card text-center hover:shadow-elegant transition-all duration-200"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Scissors className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalServices}</p>
          <p className="text-gray-600 text-sm">{t('dashboard.totalServices')}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card text-center hover:shadow-elegant transition-all duration-200"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
          <p className="text-gray-600 text-sm">{t('dashboard.totalProducts')}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.recentSales')}</h2>
          <div className="space-y-3">
            {stats.recentSales.map((sale, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{sale.service}</p>
                    <p className="text-sm text-gray-600">{sale.date}</p>
                  </div>
                </div>
                <span className="font-semibold text-primary-600">{formatPrice(sale.amount)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Services */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.topServices')}</h2>
          <div className="space-y-3">
            {stats.topServices.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{service.name}</p>
                    <p className="text-sm text-gray-600">{service.sales} {t('common.quantity')}</p>
                  </div>
                </div>
                <span className="font-semibold text-primary-600">{formatPrice(service.revenue)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.topClients')}</h2>
          <div className="space-y-3">
            {stats.topClients.map((client, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{client.name}</p>
                    <p className="text-sm text-gray-600">{client.visits} {t('common.visits')}</p>
                  </div>
                </div>
                <span className="font-semibold text-primary-600">{formatPrice(client.totalSpent)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Staff Sales */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.staffSales')}</h2>
          <div className="space-y-3">
            {stats.staffSales.map((staff, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{staff.staff}</p>
                    <p className="text-sm text-gray-600">{staff.sales} {t('common.quantity')}</p>
                  </div>
                </div>
                <span className="font-semibold text-primary-600">{formatPrice(staff.revenue)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Low Stock Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="card"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.lowStockAlerts')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.lowStockAlerts.map((alert, index) => (
            <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <div>
                  <p className="font-medium text-red-800">{alert.product}</p>
                  <p className="text-sm text-red-600">
                    {t('common.stock')}: {alert.quantity} / {alert.minQuantity}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="card"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/admin/clients')}
            className="p-4 bg-primary-50 hover:bg-primary-100 rounded-lg border border-primary-200 transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            <div className="text-center">
              <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-primary-800">{t('navigation.clients')}</p>
            </div>
          </button>
          <button 
            onClick={() => navigate('/admin/services')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            <div className="text-center">
              <Scissors className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-800">{t('navigation.services')}</p>
            </div>
          </button>
          <button 
            onClick={() => navigate('/admin/products')}
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            <div className="text-center">
              <Package className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-orange-800">{t('navigation.products')}</p>
            </div>
          </button>
          <button 
            onClick={() => navigate('/admin/bookings')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            <div className="text-center">
              <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">{t('navigation.bookings')}</p>
            </div>
          </button>
        </div>
      </motion.div>
        </>
      )}

      {/* Commission Tab Content */}
      {activeTab === 'commissions' && (
        <CommissionDashboard />
      )}
    </div>
  );
};

export default Dashboard;
