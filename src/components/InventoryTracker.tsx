import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
} from 'lucide-react';
import { Product } from '@/types';

interface InventoryTrackerProps {
  products: Product[];
}

const InventoryTracker: React.FC<InventoryTrackerProps> = ({
  products,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  const statuses = ['all', 'ok', 'low', 'empty'];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    
    let matchesStatus = true;
    if (filterStatus !== 'all') {
      const availableMl = (product.sealed_bottles || 0) * (product.bottle_capacity_ml || 0) + (product.open_bottle_remaining_ml || 0);
      const status = availableMl === 0 ? 'empty' : 
                    availableMl <= 100 ? 'low' : 'ok'; // Consider low stock when less than 100ml available
      matchesStatus = status === filterStatus;
    }
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStockStatus = (product: Product) => {
    const availableMl = (product.sealed_bottles || 0) * (product.bottle_capacity_ml || 0) + (product.open_bottle_remaining_ml || 0);
    if (availableMl === 0) return 'empty';
    if (availableMl <= 100) return 'low'; // Consider low stock when less than 100ml available
    return 'ok';
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-600 bg-green-50 border-green-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'empty': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="w-4 h-4" />;
      case 'low': return <AlertTriangle className="w-4 h-4" />;
      case 'empty': return <AlertTriangle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'ok': return 'In Stock';
      case 'low': return 'Low Stock';
      case 'empty': return 'Out of Stock';
      default: return 'Unknown';
    }
  };





  const lowStockProducts = products.filter(p => getStockStatus(p) === 'low');
  const outOfStockProducts = products.filter(p => getStockStatus(p) === 'empty');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 text-elegant">Product Usage Tracker</h1>
          <p className="text-gray-600">Monitor product usage and stock levels</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{products.length}</p>
          <p className="text-gray-600 text-sm">Total Products</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card text-center"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {products.filter(p => getStockStatus(p) === 'ok').length}
          </p>
          <p className="text-gray-600 text-sm">In Stock</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card text-center"
        >
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{lowStockProducts.length}</p>
          <p className="text-gray-600 text-sm">Low Stock</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card text-center"
        >
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{outOfStockProducts.length}</p>
          <p className="text-gray-600 text-sm">Out of Stock</p>
        </motion.div>
      </div>

      {/* Stock Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-800">Stock Alerts</h2>
          </div>
          
          {outOfStockProducts.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-red-700 mb-2">Out of Stock:</h3>
              <div className="space-y-1">
                {outOfStockProducts.map(product => (
                  <p key={product.id} className="text-sm text-red-600">
                    • {product.name}
                  </p>
                ))}
              </div>
            </div>
          )}

          {lowStockProducts.length > 0 && (
            <div>
              <h3 className="font-medium text-yellow-700 mb-2">Low Stock:</h3>
              <div className="space-y-1">
                {lowStockProducts.map(product => (
                  <p key={product.id} className="text-sm text-yellow-600">
                    • {product.name} - {((product.sealed_bottles || 0) * (product.bottle_capacity_ml || 0) + (product.open_bottle_remaining_ml || 0))}ml remaining
                  </p>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field"
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Status' : 
                 status === 'ok' ? 'In Stock' :
                 status === 'low' ? 'Low Stock' : 'Out of Stock'}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Products List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-4"
      >
        {filteredProducts.map((product, index) => {
          const status = getStockStatus(product);
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card hover:shadow-elegant transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {product.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                    <p className="text-gray-600 text-sm">{product.category}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>Volume: {product.volume} {product.unit}</span>
                      <span>Bottles: {product.sealed_bottles || 0} sealed + {product.open_bottle_remaining_ml || 0}ml open</span>
                      <span>Price: ${product.price}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Stock Status */}
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStockStatusColor(status)}`}>
                    {getStockStatusIcon(status)}
                    <span>{getStockStatusText(status)}</span>
                  </div>

                  {/* Bottle Inventory Display */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800">
                        {((product.sealed_bottles || 0) * (product.bottle_capacity_ml || 0) + (product.open_bottle_remaining_ml || 0))}ml
                      </div>
                      <div className="text-xs text-gray-500">Available</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-600">
                        {product.sealed_bottles || 0}
                      </div>
                      <div className="text-xs text-gray-500">Sealed</div>
                    </div>
                  </div>


                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {filteredProducts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No products found</h3>
          <p className="text-gray-400">Try adjusting your search or filter criteria</p>
        </motion.div>
      )}


    </div>
  );
};

export default InventoryTracker;
