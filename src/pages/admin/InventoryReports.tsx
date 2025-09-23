import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Eye,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import { SimpleBottleConsumptionService } from '@/services/SimpleBottleConsumptionService';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/utils/currency';
import toast from 'react-hot-toast';

interface InventoryMetrics {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValueMl: number;
  averageStockLevel: number;
  recentConsumption: number;
}

interface ConsumptionTrend {
  date: string;
  totalMl: number;
  bottlesOpened: number;
  services: number;
}

interface ProductPerformance {
  productName: string;
  totalConsumed: number;
  bottlesUsed: number;
  frequency: number;
  value: number;
}

interface StockAlert {
  id: string;
  productName: string;
  alertType: 'low_stock' | 'out_of_stock' | 'critical';
  currentStock: number;
  minThreshold: number;
  daysRemaining: number;
}

const InventoryReports: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'consumption' | 'alerts' | 'performance'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  
  // Data states
  const [inventoryStatus, setInventoryStatus] = useState<any[]>([]);
  const [serviceAvailability, setServiceAvailability] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<InventoryMetrics>({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalValueMl: 0,
    averageStockLevel: 0,
    recentConsumption: 0
  });

  // Mock data for charts (in real app, this would come from API)
  const consumptionTrends: ConsumptionTrend[] = [
    { date: '2024-01-01', totalMl: 1250, bottlesOpened: 3, services: 15 },
    { date: '2024-01-02', totalMl: 980, bottlesOpened: 2, services: 12 },
    { date: '2024-01-03', totalMl: 1450, bottlesOpened: 4, services: 18 },
    { date: '2024-01-04', totalMl: 1100, bottlesOpened: 3, services: 14 },
    { date: '2024-01-05', totalMl: 1350, bottlesOpened: 3, services: 16 },
    { date: '2024-01-06', totalMl: 1600, bottlesOpened: 4, services: 20 },
    { date: '2024-01-07', totalMl: 1200, bottlesOpened: 3, services: 15 }
  ];

  const productPerformance: ProductPerformance[] = [
    { productName: 'Shampoo Premium', totalConsumed: 2500, bottlesUsed: 5, frequency: 45, value: 125 },
    { productName: 'Hair Conditioner', totalConsumed: 1800, bottlesUsed: 4, frequency: 32, value: 90 },
    { productName: 'Hair Mask', totalConsumed: 1200, bottlesUsed: 2, frequency: 28, value: 180 },
    { productName: 'Styling Gel', totalConsumed: 800, bottlesUsed: 2, frequency: 20, value: 60 },
    { productName: 'Hair Oil', totalConsumed: 600, bottlesUsed: 1, frequency: 15, value: 45 }
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [inventoryData, serviceData, alertsData] = await Promise.all([
        SimpleBottleConsumptionService.getInventoryStatus(),
        // Note: getAllServicesAvailability method doesn't exist in SimpleBottleConsumptionService
        // This would need to be implemented or use a different approach
        Promise.resolve([]),
        SimpleBottleConsumptionService.getActiveStockAlerts()
      ]);

      setInventoryStatus(inventoryData);
      setServiceAvailability(serviceData);
      setLowStockAlerts(alertsData);

      // Calculate metrics
      const totalProducts = inventoryData.length;
      const lowStockProducts = inventoryData.filter(item => item.stock_status === 'low').length;
      const outOfStockProducts = inventoryData.filter(item => item.stock_status === 'out').length;
      const totalValueMl = inventoryData.reduce((sum, item) => sum + item.total_ml_available, 0);
      const averageStockLevel = totalProducts > 0 ? totalValueMl / totalProducts : 0;

      setMetrics({
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalValueMl,
        averageStockLevel,
        recentConsumption: 8500 // This would come from consumption log
      });

    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, change, changeType, icon, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {changeType === 'positive' ? <TrendingUp className="w-4 h-4" /> : 
             changeType === 'negative' ? <TrendingDown className="w-4 h-4" /> : null}
            {change}
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-1">{value}</h3>
      <p className="text-gray-600 text-sm">{title}</p>
    </motion.div>
  );

  const TabButton: React.FC<{
    id: string;
    label: string;
    icon: React.ReactNode;
    active: boolean;
    onClick: () => void;
  }> = ({ id, label, icon, active, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        active 
          ? 'bg-primary-500 text-white' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-primary-500" />
          <span className="text-lg text-gray-600">Loading reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Inventory Reports</h1>
            <p className="text-gray-600">Comprehensive inventory and consumption analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={loadReportData}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Products"
            value={metrics.totalProducts}
            change="+2 this month"
            changeType="positive"
            icon={<Package className="w-6 h-6 text-white" />}
            color="bg-blue-500"
          />
          <MetricCard
            title="Low Stock Alerts"
            value={metrics.lowStockProducts}
            change={metrics.lowStockProducts > 0 ? "Needs attention" : "All good"}
            changeType={metrics.lowStockProducts > 0 ? "negative" : "positive"}
            icon={<AlertTriangle className="w-6 h-6 text-white" />}
            color="bg-orange-500"
          />
          <MetricCard
            title="Total Stock (ml)"
            value={`${metrics.totalValueMl.toLocaleString()}`}
            change="-5% vs last month"
            changeType="negative"
            icon={<Activity className="w-6 h-6 text-white" />}
            color="bg-green-500"
          />
          <MetricCard
            title="Avg Stock Level"
            value={`${Math.round(metrics.averageStockLevel)}ml`}
            change="Stable"
            changeType="neutral"
            icon={<BarChart3 className="w-6 h-6 text-white" />}
            color="bg-purple-500"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <TabButton
            id="overview"
            label="Overview"
            icon={<Eye className="w-4 h-4" />}
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />
          <TabButton
            id="consumption"
            label="Consumption Trends"
            icon={<TrendingUp className="w-4 h-4" />}
            active={activeTab === 'consumption'}
            onClick={() => setActiveTab('consumption')}
          />
          <TabButton
            id="alerts"
            label="Stock Alerts"
            icon={<AlertTriangle className="w-4 h-4" />}
            active={activeTab === 'alerts'}
            onClick={() => setActiveTab('alerts')}
          />
          <TabButton
            id="performance"
            label="Product Performance"
            icon={<BarChart3 className="w-4 h-4" />}
            active={activeTab === 'performance'}
            onClick={() => setActiveTab('performance')}
          />
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Current Inventory Status */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Current Inventory Status</h3>
                <div className="space-y-4">
                  {inventoryStatus.slice(0, 8).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-800">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.brand}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-800">{item.sealed_bottles} bottles</p>
                        <p className="text-sm text-gray-600">{item.total_ml_available}ml total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Availability */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Service Availability</h3>
                <div className="space-y-4">
                  {serviceAvailability.slice(0, 8).map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-800">{service.service_name}</h4>
                        <p className="text-sm text-gray-600">{formatPrice(service.service_price)}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        service.is_available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {service.is_available ? 'Available' : 'Limited Stock'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'consumption' && (
            <motion.div
              key="consumption"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Consumption Trends Chart */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Daily Consumption Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={consumptionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="totalMl" stackId="1" stroke="#8884d8" fill="#8884d8" name="Total ml Consumed" />
                    <Area type="monotone" dataKey="bottlesOpened" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Bottles Opened" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Services vs Consumption */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Services vs Product Consumption</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={consumptionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="services" stroke="#8884d8" name="Services Performed" />
                    <Line type="monotone" dataKey="totalMl" stroke="#82ca9d" name="Total ml Consumed" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Stock Alerts</h3>
              {lowStockAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No stock alerts at this time</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockAlerts.map((alert, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${
                      alert.alert_type === 'out_of_stock' ? 'bg-red-50 border-red-500' :
                      alert.alert_type === 'critical' ? 'bg-orange-50 border-orange-500' :
                      'bg-yellow-50 border-yellow-500'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800">{alert.product?.name}</h4>
                          <p className="text-sm text-gray-600">{alert.product?.brand}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Current: {alert.current_sealed_bottles} bottles, {alert.current_open_ml}ml open
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          alert.alert_type === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                          alert.alert_type === 'critical' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {alert.alert_type.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Product Performance Chart */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Product Consumption</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="productName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalConsumed" fill="#8884d8" name="Total Consumed (ml)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Usage Frequency Pie Chart */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Usage Frequency</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="frequency"
                    >
                      {productPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InventoryReports;