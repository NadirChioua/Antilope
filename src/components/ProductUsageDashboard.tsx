import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Activity,
  Droplets,
  Plus,
  Minus,
  RefreshCw,
  Eye,
  Calendar,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Scissors,
  ShoppingCart
} from 'lucide-react';
import { SimpleBottleConsumptionService, ProductInventoryStatus } from '@/services/SimpleBottleConsumptionService';
import { serviceService, saleService, productService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

// Type definitions for the component
interface ConsumptionLog {
  id: string;
  product_id: string;
  product_name: string;
  ml_consumed: number;
  bottles_opened: number;
  consumption_type: string;
  created_at: string;
  service_name?: string;
}

interface StockAlert {
  id: string;
  product_name: string;
  alert_type: 'low' | 'critical' | 'out_of_stock';
  current_sealed_bottles: number;
  current_open_ml: number;
  min_threshold: number;
  created_at: string;
}

interface ProductUsageDashboardProps {
  className?: string;
}

interface ServiceProductRequirement {
  productId: string;
  productName: string;
  requiredAmount: number;
  unit: string;
}

interface ServiceWithProducts {
  id: string;
  name: string;
  duration: number;
  price: number;
  isActive: boolean;
  productRequirements: ServiceProductRequirement[];
}

interface RecentSaleWithUsage {
  id: string;
  clientName: string;
  serviceName: string;
  amount: number;
  timestamp: string;
  totalProductUsage: number;
}

const ProductUsageDashboard: React.FC<ProductUsageDashboardProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductInventoryStatus[]>([]);
  const [consumptionHistory, setConsumptionHistory] = useState<ConsumptionLog[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductInventoryStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'history' | 'restock' | 'sales'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'good' | 'low' | 'critical' | 'out'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRestocking, setIsRestocking] = useState(false);
  const [restockAmount, setRestockAmount] = useState(1);
  const [servicesWithProducts, setServicesWithProducts] = useState<ServiceWithProducts[]>([]);
  const [recentSalesWithUsage, setRecentSalesWithUsage] = useState<RecentSaleWithUsage[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [productsData, alertsData, historyData, servicesData, salesData] = await Promise.all([
        SimpleBottleConsumptionService.getInventoryStatus(),
        SimpleBottleConsumptionService.getActiveStockAlerts(),
        SimpleBottleConsumptionService.getConsumptionHistory(undefined, 20),
        loadServicesWithProducts(),
        loadRecentSalesWithUsage()
      ]);

      setProducts(productsData);
      
      // Convert ProductInventoryStatus to StockAlert format
      const convertedAlerts: StockAlert[] = alertsData.map(alert => ({
        id: alert.id,
        product_name: alert.name,
        alert_type: alert.stock_status === 'out' ? 'out_of_stock' : 
                   alert.stock_status === 'critical' ? 'critical' : 'low',
        current_sealed_bottles: alert.sealed_bottles,
        current_open_ml: alert.open_bottle_remaining_ml,
        min_threshold: alert.min_threshold,
        created_at: new Date().toISOString()
      }));
      
      setStockAlerts(convertedAlerts);
      setConsumptionHistory(historyData);
      setServicesWithProducts(servicesData);
      setRecentSalesWithUsage(salesData);
      
      // Auto-select the first product if no product is currently selected and products exist
      if (!selectedProduct && productsData.length > 0) {
        setSelectedProduct(productsData[0]);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadServicesWithProducts = async (): Promise<ServiceWithProducts[]> => {
    try {
      const services = await serviceService.getAll();
      const servicesWithProducts: ServiceWithProducts[] = [];

      for (const service of services) {
        // Get product requirements for this service
        const productRequirements = await SimpleBottleConsumptionService.getServiceProductRequirements(service.id);
        
        servicesWithProducts.push({
          id: service.id,
          name: service.name,
          duration: service.duration,
          price: service.price,
          isActive: service.isActive,
          productRequirements: productRequirements.map(req => ({
            productId: req.product_id,
            productName: req.product_name || 'Unknown Product',
            requiredAmount: req.required_ml,
            unit: 'ml'
          }))
        });
      }

      return servicesWithProducts;
    } catch (error) {
      console.error('Failed to load services with products:', error);
      return [];
    }
  };

  const loadRecentSalesWithUsage = async (): Promise<RecentSaleWithUsage[]> => {
    try {
      const recentSales = await saleService.getRecentSales(10);
      const salesWithUsage: RecentSaleWithUsage[] = [];

      for (const sale of recentSales) {
        // Calculate total product usage for this sale
        const productUsage = await SimpleBottleConsumptionService.getSaleProductUsage(sale.id);
        const totalUsage = productUsage.reduce((sum, usage) => sum + usage.mlConsumed, 0);

        salesWithUsage.push({
          id: sale.id,
          clientName: sale.clientName,
          serviceName: sale.serviceName,
          amount: sale.total,
          timestamp: sale.createdAt,
          totalProductUsage: totalUsage
        });
      }

      return salesWithUsage;
    } catch (error) {
      console.error('Failed to load recent sales with usage:', error);
      return [];
    }
  };

  const handleRestock = async (productId: string, amount: number) => {
    setIsRestocking(true);
    try {
      const restockData = {
        productId,
        bottlesToAdd: amount,
        costPerBottle: 0, // Default cost, can be updated later
        totalCost: 0,
        supplier: '',
        invoiceNumber: '',
        notes: 'Quick restock from dashboard',
        restockDate: new Date().toISOString().split('T')[0]
      };

      const success = await productService.restock(restockData);
      if (success) {
        toast.success(`Successfully restocked ${amount} bottles`);
        // Refresh the data
        loadDashboardData();
      } else {
        toast.error('Failed to restock product');
      }
    } catch (error) {
      console.error('Restock error:', error);
      toast.error('Failed to restock product');
    } finally {
      setIsRestocking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'low': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-orange-600 bg-orange-100';
      case 'out': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4" />;
      case 'low': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <TrendingDown className="w-4 h-4" />;
      case 'out': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || product.stock_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getConsumptionTypeIcon = (type: string) => {
    switch (type) {
      case 'service': return <Scissors className="w-4 h-4" />;
      case 'manual': return <User className="w-4 h-4" />;
      case 'adjustment': return <RefreshCw className="w-4 h-4" />;
      case 'waste': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl p-8 border border-gray-200 shadow-sm ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Product Usage Dashboard</h2>
              <p className="text-gray-600">Monitor product usage and stock levels</p>
            </div>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'sales', label: 'Sales', icon: ShoppingCart },
            { key: 'alerts', label: 'Alerts', icon: AlertTriangle, count: stockAlerts.length },
            { key: 'history', label: 'History', icon: Clock },
            { key: 'restock', label: 'Restock', icon: Plus }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Search and Filter */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="good">Good Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="critical">Critical</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <motion.div
                    key={product.id}
                    layout
                    className={`rounded-xl p-4 border hover:shadow-md transition-all duration-200 cursor-pointer ${
                      selectedProduct?.id === product.id
                        ? 'bg-primary-50 border-primary-300 shadow-md ring-2 ring-primary-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-800">{product.name}</h3>
                          {selectedProduct?.id === product.id && (
                            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              Opened
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{product.brand}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(product.stock_status)}`}>
                        {getStatusIcon(product.stock_status)}
                        {product.stock_status}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Sealed Bottles:</span>
                        <span className="font-medium">{product.sealed_bottles}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Open Bottle:</span>
                        <span className="font-medium">{product.open_bottle_remaining_ml}ml</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Available:</span>
                        <span className="font-medium text-primary-600">{product.total_ml_available}ml</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            product.stock_status === 'good' ? 'bg-green-500' :
                            product.stock_status === 'low' ? 'bg-yellow-500' :
                            product.stock_status === 'critical' ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{
                            width: `${Math.max(10, (product.sealed_bottles / Math.max(product.min_stock_threshold * 2, 1)) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No products found matching your criteria</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Sales Integration Tab */}
          {activeTab === 'sales' && (
            <motion.div
              key="sales"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Sales Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Today's Sales</p>
                      <p className="text-2xl font-bold">12 Services</p>
                      <p className="text-sm text-blue-100">Products consumed: 850ml</p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Service Efficiency</p>
                      <p className="text-2xl font-bold">94%</p>
                      <p className="text-sm text-green-100">Product usage accuracy</p>
                    </div>
                    <Activity className="w-8 h-8 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Revenue Impact</p>
                      <p className="text-2xl font-bold">$1,240</p>
                      <p className="text-sm text-purple-100">From product usage</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-200" />
                  </div>
                </div>
              </div>

              {/* Service-Product Relationships */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-primary-500" />
                  Service-Product Relationships
                </h3>
                
                <div className="space-y-4">
                  {servicesWithProducts.length > 0 ? (
                    servicesWithProducts.map((service) => (
                      <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-800">{service.name}</h4>
                            <p className="text-sm text-gray-600">
                              Duration: {service.duration} minutes • Price: ${service.price}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            service.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {service.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Required Products:</p>
                          {service.productRequirements.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {service.productRequirements.map((req, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                  <span className="text-sm text-gray-700">{req.productName}</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {req.requiredAmount}{req.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No product requirements defined</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No services with product requirements found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Sales with Product Usage */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary-500" />
                  Recent Sales & Product Usage
                </h3>
                
                <div className="space-y-3">
                  {recentSalesWithUsage.length > 0 ? (
                    recentSalesWithUsage.map((sale, index) => {
                      const colors = ['blue', 'green', 'purple', 'orange', 'pink'];
                      const color = colors[index % colors.length];
                      const formatTime = (timestamp: string) => {
                        return new Date(timestamp).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        });
                      };

                      return (
                        <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-${color}-100 rounded-full flex items-center justify-center`}>
                              <User className={`w-5 h-5 text-${color}-600`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{sale.clientName}</p>
                              <p className="text-sm text-gray-600">
                                {sale.serviceName} • {formatTime(sale.timestamp)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-800">${sale.amount.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">
                              {sale.totalProductUsage > 0 ? `${sale.totalProductUsage}ml used` : 'No usage tracked'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No recent sales found</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {stockAlerts.length > 0 ? (
                stockAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border-l-4 ${
                      alert.alert_type === 'out_of_stock' ? 'border-red-500 bg-red-50' :
                      alert.alert_type === 'critical' ? 'border-orange-500 bg-orange-50' :
                      'border-yellow-500 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className={`w-5 h-5 ${
                            alert.alert_type === 'out_of_stock' ? 'text-red-600' :
                            alert.alert_type === 'critical' ? 'text-orange-600' :
                            'text-yellow-600'
                          }`} />
                          <h3 className="font-semibold text-gray-800">{alert.product_name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alert.alert_type === 'out_of_stock' ? 'bg-red-100 text-red-700' :
                            alert.alert_type === 'critical' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {alert.alert_type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Sealed Bottles:</span>
                            <p className="font-medium">{alert.current_sealed_bottles}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Open Bottle:</span>
                            <p className="font-medium">{alert.current_open_ml}ml</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Min Threshold:</span>
                            <p className="font-medium">{alert.min_threshold}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{formatDate(alert.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No active stock alerts</p>
                  <p className="text-sm text-gray-500">All products are adequately stocked</p>
                </div>
              )}
            </motion.div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {consumptionHistory.length > 0 ? (
                consumptionHistory.map(log => (
                  <div key={log.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          log.consumption_type === 'service' ? 'bg-blue-100 text-blue-600' :
                          log.consumption_type === 'adjustment' ? 'bg-green-100 text-green-600' :
                          log.consumption_type === 'waste' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {getConsumptionTypeIcon(log.consumption_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-800">{log.consumption_type}</span>
                            <span className="text-sm text-gray-600">•</span>
                            <span className="text-sm text-gray-600">{log.ml_consumed}ml consumed</span>
                            {log.bottles_opened > 0 && (
                              <>
                                <span className="text-sm text-gray-600">•</span>
                                <span className="text-sm text-gray-600">{log.bottles_opened} bottles opened</span>
                              </>
                            )}
                          </div>
                          {log.notes && (
                            <p className="text-sm text-gray-600">{log.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{formatDate(log.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No consumption history available</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Restock Tab */}
          {activeTab === 'restock' && (
            <motion.div
              key="restock"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.filter(p => p.stock_status !== 'good').map(product => (
                  <div key={product.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.brand}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.stock_status)}`}>
                        {product.stock_status}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-sm">
                        <span className="text-gray-600">Current: </span>
                        <span className="font-medium">{product.sealed_bottles} bottles</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setRestockAmount(Math.max(1, restockAmount - 1))}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={restockAmount}
                          onChange={(e) => setRestockAmount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => setRestockAmount(restockAmount + 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRestock(product.id, restockAmount)}
                        disabled={isRestocking}
                        className="w-full py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        {isRestocking ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        Restock {restockAmount} bottles
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {products.filter(p => p.stock_status !== 'good').length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">All products are well stocked</p>
                  <p className="text-sm text-gray-500">No restocking needed at this time</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedProduct.name}</h3>
                <p className="text-gray-600">{selectedProduct.brand}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Sealed Bottles</p>
                  <p className="text-lg font-semibold">{selectedProduct.sealed_bottles}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Open Bottle</p>
                  <p className="text-lg font-semibold">{selectedProduct.open_bottle_remaining_ml}ml</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Bottle Size</p>
                  <p className="text-lg font-semibold">{selectedProduct.bottle_capacity_ml || 1000}ml</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Total Available</p>
                  <p className="text-lg font-semibold text-primary-600">{selectedProduct.total_ml_available}ml</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Stock Status</span>
                <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(selectedProduct.stock_status)}`}>
                  {getStatusIcon(selectedProduct.stock_status)}
                  {selectedProduct.stock_status}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setActiveTab('restock');
                  }}
                  className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Restock
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// Utility functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'good':
      return 'bg-green-100 text-green-700';
    case 'low':
      return 'bg-yellow-100 text-yellow-700';
    case 'critical':
      return 'bg-orange-100 text-orange-700';
    case 'out':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'good':
      return <CheckCircle className="w-4 h-4" />;
    case 'low':
      return <AlertTriangle className="w-4 h-4" />;
    case 'critical':
      return <AlertTriangle className="w-4 h-4" />;
    case 'out':
      return <XCircle className="w-4 h-4" />;
    default:
      return <Package className="w-4 h-4" />;
  }
};

const getConsumptionTypeIcon = (type: string) => {
  switch (type) {
    case 'service':
      return <Scissors className="w-4 h-4" />;
    case 'adjustment':
      return <RefreshCw className="w-4 h-4" />;
    case 'waste':
      return <XCircle className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default ProductUsageDashboard;