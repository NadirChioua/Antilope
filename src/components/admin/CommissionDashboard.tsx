import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Download,
  Filter,
  RefreshCw,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award,
  Percent,
  Edit,
  Trash2,
  Plus,
  CreditCard
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import CommissionAnalytics from './CommissionAnalytics';
import CommissionPayments from './CommissionPayments';
import { commissionService, staffService } from '@/services/database';
import { formatPrice } from '@/utils/currency';
import toast from 'react-hot-toast';

interface CommissionStats {
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  thisMonthCommissions: number;
  thisMonthAmount: number;
  averageCommissionRate: number;
}

interface StaffCommissionData {
  staffId: string;
  staffName: string;
  totalCommissions: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  commissionCount: number;
  averageRate: number;
}

interface MonthlyData {
  month: string;
  totalCommissions: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

const CommissionDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'payments'>('overview');
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [staffData, setStaffData] = useState<StaffCommissionData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [staffList, setStaffList] = useState<any[]>([]);

  useEffect(() => {
    fetchCommissionData();
    fetchStaffList();
  }, [selectedPeriod, selectedStaff]);

  const fetchStaffList = async () => {
    try {
      const staff = await staffService.getAll();
      setStaffList(staff || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchCommissionData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch overall stats
      const commissionStats = await commissionService.getCommissionStats(
        selectedStaff === 'all' ? undefined : selectedStaff
      );
      setStats(commissionStats);

      // Fetch staff-specific data
      if (selectedStaff === 'all') {
        const allStaff = await staffService.getAll();
        const staffCommissionData: StaffCommissionData[] = [];

        for (const staff of allStaff || []) {
          const staffStats = await commissionService.getCommissionStats(staff.id);
          const commissions = await commissionService.getByStaffId(staff.id);
          
          staffCommissionData.push({
            staffId: staff.id,
            staffName: staff.name,
            totalCommissions: staffStats.totalCommissions,
            totalAmount: staffStats.totalAmount,
            paidAmount: staffStats.paidAmount,
            pendingAmount: staffStats.pendingAmount,
            commissionCount: commissions.length,
            averageRate: staffStats.averageCommissionRate
          });
        }
        setStaffData(staffCommissionData);
      }

      // Fetch monthly data for charts
      const currentYear = new Date().getFullYear();
      const monthlyCommissionData: MonthlyData[] = [];
      
      for (let month = 1; month <= 12; month++) {
        const startDate = new Date(currentYear, month - 1, 1).toISOString();
        const endDate = new Date(currentYear, month, 0).toISOString();
        
        const monthCommissions = await commissionService.getByDateRange(
          startDate,
          endDate,
          selectedStaff === 'all' ? undefined : selectedStaff
        );

        const monthStats = {
          month: new Date(currentYear, month - 1).toLocaleDateString('en', { month: 'short' }),
          totalCommissions: monthCommissions.length,
          totalAmount: monthCommissions.reduce((sum, c) => sum + c.commission_amount, 0),
          paidAmount: monthCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0),
          pendingAmount: monthCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0)
        };
        
        monthlyCommissionData.push(monthStats);
      }
      setMonthlyData(monthlyCommissionData);

    } catch (error) {
      console.error('Error fetching commission data:', error);
      toast.error('Failed to load commission data');
    } finally {
      setIsLoading(false);
    }
  };

  const exportCommissionReport = async () => {
    try {
      const commissions = await commissionService.getAll();
      const csvContent = [
        ['Date', 'Staff', 'Service', 'Sale Amount', 'Commission %', 'Commission Amount', 'Status'],
        ...commissions.map(c => [
          new Date(c.created_at).toLocaleDateString(),
          c.staff?.name || 'Unknown',
          c.service?.name || 'Unknown',
          c.sale?.total_amount || 0,
          c.commission_percentage,
          c.commission_amount,
          c.status
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commission-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Commission report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export commission report');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Commission Management</h2>
          <p className="text-gray-600">Track and manage staff commissions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCommissionReport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={fetchCommissionData}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

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
              <DollarSign className="w-4 h-4" />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'analytics'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Analytics
            </div>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'payments'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payments
            </div>
          </button>
        </nav>
      </motion.div>

      {/* Filters */}
      {activeTab === 'overview' && (
        <div className="flex flex-wrap gap-3">
          {/* Period Filter */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          {/* Staff Filter */}
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Staff</option>
            {staffList.map(staff => (
              <option key={staff.id} value={staff.id}>{staff.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-soft border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalCommissions || 0}</p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                {formatPrice(stats?.totalAmount || 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-soft border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Commissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.paidCommissions || 0}</p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {formatPrice(stats?.paidAmount || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-soft border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Commissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingCommissions || 0}</p>
              <p className="text-sm text-orange-600 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatPrice(stats?.pendingAmount || 0)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-soft border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Rate</p>
              <p className="text-2xl font-bold text-gray-900">{(stats?.averageCommissionRate || 0).toFixed(1)}%</p>
              <p className="text-sm text-purple-600 flex items-center gap-1">
                <Target className="w-4 h-4" />
                This Month: {formatPrice(stats?.thisMonthAmount || 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Percent className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Commission Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-soft border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Commission Trend</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {monthlyData.slice(-6).map((month, index) => (
              <div key={month.month} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 text-sm font-medium text-gray-600">{month.month}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-32">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(5, (month.totalAmount / Math.max(...monthlyData.map(m => m.totalAmount))) * 100)}%`
                      }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{formatPrice(month.totalAmount)}</div>
                  <div className="text-xs text-gray-500">{month.totalCommissions} commissions</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Staff Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-soft border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Staff Performance</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {staffData.slice(0, 5).map((staff, index) => (
              <div key={staff.staffId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-600">
                      {staff.staffName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{staff.staffName}</div>
                    <div className="text-sm text-gray-500">{staff.commissionCount} commissions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatPrice(staff.totalAmount)}</div>
                  <div className="text-sm text-gray-500">{staff.averageRate.toFixed(1)}% avg</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Commission Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white p-6 rounded-xl shadow-soft border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Commission Status Overview</h3>
          <PieChart className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats?.paidCommissions || 0}</div>
            <div className="text-sm text-gray-600">Paid Commissions</div>
            <div className="text-lg font-semibold text-green-600">{formatPrice(stats?.paidAmount || 0)}</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats?.pendingCommissions || 0}</div>
            <div className="text-sm text-gray-600">Pending Commissions</div>
            <div className="text-lg font-semibold text-orange-600">{formatPrice(stats?.pendingAmount || 0)}</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{(stats?.averageCommissionRate || 0).toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Average Rate</div>
            <div className="text-lg font-semibold text-blue-600">This Month: {stats?.thisMonthCommissions || 0}</div>
          </div>
        </div>
      </motion.div>
        </>
      )}

      {activeTab === 'analytics' && (
        <CommissionAnalytics />
      )}

      {activeTab === 'payments' && (
        <CommissionPayments />
      )}
    </div>
  );
};

export default CommissionDashboard;