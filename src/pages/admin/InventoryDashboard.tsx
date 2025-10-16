import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  Minus,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  BarChart3,
  Activity,
  ShoppingCart,
  Users,
  Calendar,
  Clock,
  Camera
} from 'lucide-react';
import { SimpleBottleConsumptionService } from '@/services/SimpleBottleConsumptionService';
import { productService } from '@/services/database';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';
import { formatPrice } from '@/utils/currency';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  sealed_bottles: number;
  open_bottle_remaining_ml: number;
  bottle_capacity_ml: number;
  min_stock_threshold: number;
  unit_price: number;
  total_ml_available: number;
  stock_status: 'good' | 'low' | 'out';
  last_restocked: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

interface StockMovement {
  id: string;
  product_name: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity_ml: number;
  reason: string;
  timestamp: string;
  user: string;
}

const InventoryDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showRestockModal, setShowRestockModal] = useState(false);

  // Quick stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValue: 0,
    recentConsumption: 0,
    todayServices: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [inventoryData, alertsData] = await Promise.all([
        SimpleBottleConsumptionService.getInventoryStatus(),
        SimpleBottleConsumptionService.getActiveStockAlerts()
      ]);

      setProducts(inventoryData);
      setLowStockAlerts(alertsData);

      // Calculate stats
      const totalProducts = inventoryData.length;
      const lowStockCount = inventoryData.filter(p => p.stock_status === 'low').length;
      const outOfStockCount = inventoryData.filter(p => p.stock_status === 'out').length;
      const totalValue = inventoryData.reduce((sum, p) => sum + (p.total_ml_available * p.unit_price / (p.bottle_capacity_ml || 1000)), 0);

      setStats({
        totalProducts,
        lowStockCount,
        outOfStockCount,
        totalValue,
        recentConsumption: 2450, // Mock data
        todayServices: 18 // Mock data
      });

      // Mock recent movements
      setRecentMovements([
        {
          id: '1',
          product_name: 'Shampoo Premium',
          movement_type: 'out',
          quantity_ml: 150,
          reason: 'Service consumption',
          timestamp: new Date().toISOString(),
          user: 'Sarah Johnson'
        },
        {
          id: '2',
          product_name: 'Hair Conditioner',
          movement_type: 'in',
          quantity_ml: 1000,
          reason: 'New bottle opened',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user: 'System'
        }
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handleRestock = async (productId: string, bottles: number) => {
    try {
      const restockData = {
        productId,
        bottlesToAdd: bottles,
        costPerBottle: 0, // Default cost, can be updated later
        totalCost: 0,
        supplier: '',
        invoiceNumber: '',
        notes: 'Quick restock from inventory dashboard',
        restockDate: new Date().toISOString().split('T')[0]
      };

      const success = await productService.restock(restockData);
      if (success) {
        toast.success('Product restocked successfully');
        loadDashboardData();
        setShowRestockModal(false);
      } else {
        toast.error('Failed to restock product');
      }
    } catch (error) {
      console.error('Error restocking product:', error);
      toast.error('Failed to restock product');
    }
  };

  const handleQuickAdjustment = async (productId: string, adjustment: number) => {
    try {
      // This would call an adjustment API
      toast.success(`Stock adjusted by ${adjustment}ml`);
      loadDashboardData();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Failed to adjust stock');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || product.stock_status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const quickActions: QuickAction[] = [
    {
      id: 'bulk-restock',
      label: 'Bulk Restock',
      icon: <Upload className="w-5 h-5" />,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => toast.info('Bulk restock feature coming soon')
    },
    {
      id: 'export-data',
      label: 'Export Data',
      icon: <Download className="w-5 h-5" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => toast.info('Export feature coming soon')
    },
    {
      id: 'inventory-snapshot',
      label: 'Create Snapshot',
      icon: <Camera className="w-5 h-5" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: async () => {
        try {
          // Create a simple inventory snapshot by exporting current stock data
          const currentDate = new Date().toISOString().split('T')[0];
          const snapshotData = products.map(product => ({
            name: product.name,
            brand: product.brand,
            category: product.category,
            sealed_bottles: product.sealed_bottles,
            open_bottle_remaining_ml: product.open_bottle_remaining_ml,
            total_ml_available: product.total_ml_available,
            stock_status: product.stock_status,
            snapshot_date: currentDate
          }));
          
          // Convert to CSV and download
          const csvContent = [
            'Product Name,Brand,Category,Sealed Bottles,Open Bottle ML,Total ML Available,Stock Status,Snapshot Date',
            ...snapshotData.map(item => 
              `"${item.name}","${item.brand}","${item.category}",${item.sealed_bottles},${item.open_bottle_remaining_ml},${item.total_ml_available},"${item.stock_status}","${item.snapshot_date}"`
            )
          ].join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `inventory-snapshot-${currentDate}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
          
          toast.success('Inventory snapshot created and downloaded');
        } catch (error) {
          toast.error('Failed to create snapshot');
        }
      }
    }
  ];

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, change, changeType, icon, color }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
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

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
          <p className="text-sm text-gray-600">{product.brand}</p>
          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full mt-2">
            {product.category}
          </span>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          product.stock_status === 'good' ? 'bg-green-100 text-green-800' :
          product.stock_status === 'low' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {product.stock_status.toUpperCase()}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Sealed Bottles:</span>
          <span className="font-medium">{product.sealed_bottles}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Open Bottle:</span>
          <span className="font-medium">{product.open_bottle_remaining_ml}ml</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Available:</span>
          <span className="font-medium text-primary-600">{product.total_ml_available}ml</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleQuickAdjustment(product.id, -50)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
        >
          <Minus className="w-4 h-4" />
          -50ml
        </button>
        <button
          onClick={() => {
            setSelectedProduct(product);
            setShowRestockModal(true);
          }}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Restock
        </button>

      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-primary-500" />
          <span className="text-lg text-gray-600">Loading dashboard...</span>
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Inventory Dashboard</h1>
            <p className="text-gray-600">Real-time inventory management and monitoring</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="flex items-center gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${action.color}`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            change="+2 this week"
            changeType="positive"
            icon={<Package className="w-6 h-6 text-white" />}
            color="bg-blue-500"
          />
          <StatCard
            title="Low Stock"
            value={stats.lowStockCount}
            change={stats.lowStockCount > 0 ? "Needs attention" : "All good"}
            changeType={stats.lowStockCount > 0 ? "negative" : "positive"}
            icon={<AlertTriangle className="w-6 h-6 text-white" />}
            color="bg-orange-500"
          />
          <StatCard
            title="Out of Stock"
            value={stats.outOfStockCount}
            icon={<Trash2 className="w-6 h-6 text-white" />}
            color="bg-red-500"
          />
          <StatCard
            title="Total Value"
            value={formatPrice(stats.totalValue)}
            change="+5.2%"
            changeType="positive"
            icon={<BarChart3 className="w-6 h-6 text-white" />}
            color="bg-green-500"
          />
          <StatCard
            title="Today's Consumption"
            value={`${stats.recentConsumption}ml`}
            change="Normal usage"
            changeType="neutral"
            icon={<Activity className="w-6 h-6 text-white" />}
            color="bg-purple-500"
          />
          <StatCard
            title="Services Today"
            value={stats.todayServices}
            change="+12%"
            changeType="positive"
            icon={<Users className="w-6 h-6 text-white" />}
            color="bg-indigo-500"
          />
        </div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              <option value="shampoo">Shampoo</option>
              <option value="conditioner">Conditioner</option>
              <option value="treatment">Treatment</option>
              <option value="styling">Styling</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="good">Good Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Stock Movements</h3>
          <div className="space-y-4">
            {recentMovements.map((movement) => (
              <div key={movement.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    movement.movement_type === 'in' ? 'bg-green-100 text-green-600' :
                    movement.movement_type === 'out' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {movement.movement_type === 'in' ? <Plus className="w-5 h-5" /> :
                     movement.movement_type === 'out' ? <Minus className="w-5 h-5" /> :
                     <Edit className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{movement.product_name}</h4>
                    <p className="text-sm text-gray-600">{movement.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    movement.movement_type === 'in' ? 'text-green-600' :
                    movement.movement_type === 'out' ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    {movement.movement_type === 'in' ? '+' : movement.movement_type === 'out' ? '-' : '±'}
                    {movement.quantity_ml}ml
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(movement.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InventoryDashboard;