import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Award,
  Clock,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { commissionService } from '@/services/database';
import { formatPrice } from '@/utils/currency';

interface CommissionAnalytics {
  totalCommissions: number;
  averageCommissionRate: number;
  topPerformers: Array<{
    staffId: string;
    staffName: string;
    totalCommissions: number;
    salesCount: number;
    averageCommissionPerSale: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    totalCommissions: number;
    salesCount: number;
    averageRate: number;
  }>;
  serviceCommissionBreakdown: Array<{
    serviceName: string;
    totalCommissions: number;
    salesCount: number;
    commissionRate: number;
  }>;
  performanceMetrics: {
    growthRate: number;
    efficiency: number;
    consistency: number;
  };
}

const CommissionAnalytics: React.FC = () => {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState<CommissionAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedMetric, setSelectedMetric] = useState<'commissions' | 'sales' | 'rate'>('commissions');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Simulate analytics data - in real implementation, this would come from the database
      const mockAnalytics: CommissionAnalytics = {
        totalCommissions: 15420.50,
        averageCommissionRate: 12.5,
        topPerformers: [
          {
            staffId: '1',
            staffName: 'Sarah Johnson',
            totalCommissions: 4250.00,
            salesCount: 85,
            averageCommissionPerSale: 50.00
          },
          {
            staffId: '2',
            staffName: 'Mike Chen',
            totalCommissions: 3890.25,
            salesCount: 78,
            averageCommissionPerSale: 49.87
          },
          {
            staffId: '3',
            staffName: 'Emma Wilson',
            totalCommissions: 3520.75,
            salesCount: 72,
            averageCommissionPerSale: 48.90
          }
        ],
        monthlyTrends: [
          { month: 'Jan', totalCommissions: 2450.00, salesCount: 48, averageRate: 12.2 },
          { month: 'Feb', totalCommissions: 2680.50, salesCount: 52, averageRate: 12.4 },
          { month: 'Mar', totalCommissions: 2890.25, salesCount: 58, averageRate: 12.6 },
          { month: 'Apr', totalCommissions: 3120.75, salesCount: 62, averageRate: 12.8 },
          { month: 'May', totalCommissions: 2980.00, salesCount: 59, averageRate: 12.5 },
          { month: 'Jun', totalCommissions: 3299.00, salesCount: 65, averageRate: 12.7 }
        ],
        serviceCommissionBreakdown: [
          { serviceName: 'Hair Cut & Style', totalCommissions: 4250.00, salesCount: 85, commissionRate: 15.0 },
          { serviceName: 'Hair Coloring', totalCommissions: 3890.25, salesCount: 45, commissionRate: 18.0 },
          { serviceName: 'Facial Treatment', totalCommissions: 2680.50, salesCount: 67, commissionRate: 12.0 },
          { serviceName: 'Manicure & Pedicure', totalCommissions: 2450.00, salesCount: 98, commissionRate: 10.0 },
          { serviceName: 'Massage Therapy', totalCommissions: 2149.75, salesCount: 32, commissionRate: 20.0 }
        ],
        performanceMetrics: {
          growthRate: 15.8,
          efficiency: 87.5,
          consistency: 92.3
        }
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading commission analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnalytics = () => {
    if (!analytics) return;

    const csvContent = [
      ['Commission Analytics Report'],
      ['Generated:', new Date().toLocaleDateString()],
      ['Date Range:', `${dateRange.startDate} to ${dateRange.endDate}`],
      [''],
      ['Summary'],
      ['Total Commissions', formatPrice(analytics.totalCommissions)],
      ['Average Commission Rate', `${analytics.averageCommissionRate}%`],
      [''],
      ['Top Performers'],
      ['Staff Name', 'Total Commissions', 'Sales Count', 'Avg Commission/Sale'],
      ...analytics.topPerformers.map(performer => [
        performer.staffName,
        formatPrice(performer.totalCommissions),
          performer.salesCount.toString(),
          formatPrice(performer.averageCommissionPerSale)
      ]),
      [''],
      ['Service Breakdown'],
      ['Service Name', 'Total Commissions', 'Sales Count', 'Commission Rate'],
      ...analytics.serviceCommissionBreakdown.map(service => [
        service.serviceName,
        formatPrice(service.totalCommissions),
          service.salesCount.toString(),
          `${service.commissionRate}%`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Commission Analytics</h2>
          <p className="text-gray-600">Advanced insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Date Range:</span>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <span className="self-center text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatPrice(analytics.totalCommissions)}</p>
          <p className="text-gray-600 text-sm">Total Commissions</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">+{analytics.performanceMetrics.growthRate}%</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card text-center"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{analytics.averageCommissionRate}%</p>
          <p className="text-gray-600 text-sm">Avg Commission Rate</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <Award className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-600">{analytics.performanceMetrics.efficiency}% efficiency</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card text-center"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{analytics.topPerformers.length}</p>
          <p className="text-gray-600 text-sm">Active Staff</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <Clock className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-purple-600">{analytics.performanceMetrics.consistency}% consistency</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card text-center"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {formatPrice(analytics.totalCommissions / analytics.monthlyTrends.reduce((sum, month) => sum + month.salesCount, 0))}
          </p>
          <p className="text-gray-600 text-sm">Avg Commission/Sale</p>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Monthly Trends</h3>
            <div className="flex gap-1">
              {(['commissions', 'sales', 'rate'] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedMetric === metric
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {analytics.monthlyTrends.map((month, index) => {
              const value = selectedMetric === 'commissions' 
                ? month.totalCommissions 
                : selectedMetric === 'sales' 
                ? month.salesCount 
                : month.averageRate;
              const maxValue = Math.max(...analytics.monthlyTrends.map(m => 
                selectedMetric === 'commissions' 
                  ? m.totalCommissions 
                  : selectedMetric === 'sales' 
                  ? m.salesCount 
                  : m.averageRate
              ));
              const percentage = (value / maxValue) * 100;

              return (
                <div key={month.month} className="flex items-center gap-3">
                  <span className="w-8 text-sm font-medium text-gray-600">{month.month}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="bg-purple-600 h-2 rounded-full"
                    />
                  </div>
                  <span className="w-16 text-sm font-medium text-gray-800 text-right">
                    {selectedMetric === 'commissions' 
                      ? formatPrice(value) 
                      : selectedMetric === 'sales' 
                      ? value.toString() 
                      : `${value}%`}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Performers</h3>
          <div className="space-y-4">
            {analytics.topPerformers.map((performer, index) => (
              <div key={performer.staffId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{performer.staffName}</p>
                  <p className="text-sm text-gray-600">{performer.salesCount} sales</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-purple-600">{formatPrice(performer.totalCommissions)}</p>
              <p className="text-xs text-gray-500">{formatPrice(performer.averageCommissionPerSale)}/sale</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Service Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Commission by Service</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Service</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Total Commissions</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Sales Count</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Commission Rate</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Avg/Sale</th>
              </tr>
            </thead>
            <tbody>
              {analytics.serviceCommissionBreakdown.map((service, index) => (
                <motion.tr
                  key={service.serviceName}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 font-medium text-gray-800">{service.serviceName}</td>
                  <td className="py-3 px-4 text-right font-semibold text-purple-600">
                    {formatPrice(service.totalCommissions)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">{service.salesCount}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{service.commissionRate}%</td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {formatPrice(service.totalCommissions / service.salesCount)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default CommissionAnalytics;