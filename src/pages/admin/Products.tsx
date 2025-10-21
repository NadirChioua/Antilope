import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Eye,
  MoreVertical,
  Grid,
  List,
  PackagePlus,
  History
} from 'lucide-react';
import ProductUsageDashboard from '@/components/ProductUsageDashboard';
import ProductModal from '@/components/ProductModal';
import RestockModal from '@/components/RestockModal';
import RestockHistory from '@/components/RestockHistory';
import { Product } from '@/types';
import { productService } from '@/services/database';
import { formatPrice } from '@/utils/currency';
import toast from 'react-hot-toast';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const categories = [
    'Soins des Cheveux',
    'Soins de la Peau',
    'Soins des Ongles',
    'Produits de Coiffage',
    'Outils et Équipements',
    'Produits de Nettoyage',
    'Autres'
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleRestockProduct = (product: Product) => {
    setRestockProduct(product);
    setIsRestockModalOpen(true);
  };

  const handleViewHistory = (product: Product) => {
    setHistoryProduct(product);
    setIsHistoryModalOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await productService.delete(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Product deleted successfully');
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleSaveProduct = (savedProduct: Product) => {
    if (selectedProduct) {
      // Update existing product
      setProducts(prev => prev.map(p => p.id === savedProduct.id ? savedProduct : p));
    } else {
      // Add new product
      setProducts(prev => [...prev, savedProduct]);
    }
  };

  const handleRestock = async (restockData: any) => {
    try {
      console.log('🔄 Starting restock operation in UI:', restockData);
      const success = await productService.restock(restockData);
      if (success) {
        console.log('✅ Restock successful, refreshing products...');
        // Refresh products to show updated stock levels
        await loadProducts();
        setIsRestockModalOpen(false);
        setRestockProduct(null);
        return true;
      } else {
        console.error('❌ Restock operation returned false');
        toast.error('Failed to restock product - operation returned false');
        return false;
      }
    } catch (error) {
      console.error('❌ Error restocking product:', error);
      toast.error(`Failed to restock product: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const handleRestockSuccess = () => {
    // Refresh products to show updated stock levels
    loadProducts();
    setIsRestockModalOpen(false);
    setRestockProduct(null);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (product: Product) => {
    const totalStock = (product.sealed_bottles || 0) + (product.open_bottle_remaining_ml || 0) / (product.bottle_capacity_ml || 1000);
    const threshold = product.minQuantity || 2;
    
    if (totalStock === 0) return { status: 'out', color: 'text-red-600 bg-red-100', label: 'Out of Stock' };
    if (totalStock <= threshold) return { status: 'low', color: 'text-yellow-600 bg-yellow-100', label: 'Low Stock' };
    return { status: 'good', color: 'text-green-600 bg-green-100', label: 'In Stock' };
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const stockStatus = getStockStatus(product);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <Package className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{product.name}</h3>
                <p className="text-xs text-gray-500">{product.brand}</p>
              </div>
            </div>
            <div className="relative">
              <button className="p-1 hover:bg-gray-100 rounded">
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Category:</span>
              <span className="text-gray-900">{product.category}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Volume:</span>
              <span className="text-gray-900">{product.volume} {product.unit}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Price:</span>
              <span className="text-gray-900">{formatPrice(product.price || 0)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
              {stockStatus.label}
            </span>
            <span className="text-xs text-gray-500">
              {product.sealed_bottles || 0} bottles
            </span>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => handleEditProduct(product)}
              className="flex-1 px-2 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium flex items-center justify-center gap-1"
            >
              <Edit className="w-3 h-3" />
              Edit
            </button>
            <button
              onClick={() => handleRestockProduct(product)}
              className="px-2 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs font-medium flex items-center justify-center"
              title="Restock"
            >
              <PackagePlus className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleViewHistory(product)}
              className="px-2 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-xs font-medium flex items-center justify-center"
              title="View History"
            >
              <History className="w-3 h-3" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(product.id)}
              className="px-2 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium flex items-center justify-center"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const ProductRow = ({ product }: { product: Product }) => {
    const stockStatus = getStockStatus(product);
    
    return (
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hover:bg-gray-50"
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-8 h-8 rounded object-cover"
                />
              ) : (
                <Package className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{product.name}</div>
              <div className="text-sm text-gray-500">{product.brand}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {product.category}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {product.volume} {product.unit}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {formatPrice(product.price || 0)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
            {stockStatus.label}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {product.sealed_bottles || 0}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEditProduct(product)}
              className="text-blue-600 hover:text-blue-900"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleRestockProduct(product)}
              className="text-green-600 hover:text-green-900"
              title="Restock"
            >
              <PackagePlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewHistory(product)}
              className="text-purple-600 hover:text-purple-900"
              title="View History"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(product.id)}
              className="text-red-600 hover:text-red-900"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </motion.tr>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product inventory and track usage</p>
        </div>
        <button
          onClick={handleAddProduct}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Dashboard */}
      <div className="bg-white rounded-lg shadow">
        <ProductUsageDashboard />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Products Display */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCategory ? 'Try adjusting your filters' : 'Get started by adding your first product'}
            </p>
            <button
              onClick={handleAddProduct}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Product
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bottles
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map(product => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        onSave={handleSaveProduct}
      />

      {/* Restock Modal */}
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        product={restockProduct}
        onRestock={handleRestock}
      />

      {/* Restock History Modal */}
      <RestockHistory
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        productId={historyProduct?.id}
        productName={historyProduct?.name}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this product? All associated data will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;