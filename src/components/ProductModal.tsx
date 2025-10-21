import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Package,
  Save,
  AlertCircle,
  Upload,
  DollarSign,
  Hash,
  Tag,
  Droplets,
  BarChart3,
  Info
} from 'lucide-react';
import { Product } from '@/types';
import { productService } from '@/services/database';
import toast from 'react-hot-toast';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: (product: Product) => void;
}

interface ProductFormData {
  name: string;
  brand: string;
  category: string;
  volume: number;
  unit: string;
  price: number;
  cost: number;
  totalQuantity: number;
  minThreshold: number;
  imageUrl: string;
  isActive: boolean;
  // Bottle-specific fields
  sealedBottles: number;
  openBottleRemainingMl: number;
  bottleSizeMl: number;
  minStockThreshold: number;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    brand: '',
    category: '',
    volume: 0,
    unit: 'ml',
    price: 0,
    cost: 0,
    totalQuantity: 0,
    minThreshold: 10,
    imageUrl: '',
    isActive: true,
    sealedBottles: 0,
    openBottleRemainingMl: 0,
    bottleSizeMl: 1000,
    minStockThreshold: 2
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!product;

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        brand: product.brand || '',
        category: product.category || '',
        volume: product.volume || 0,
        unit: product.unit || 'ml',
        price: product.price || 0,
        cost: product.cost || 0,
        totalQuantity: product.totalQuantity || product.quantity || 0,
        minThreshold: product.minThreshold || product.minQuantity || 10,
        imageUrl: product.imageUrl || '',
        isActive: product.isActive !== false,
        sealedBottles: product.sealed_bottles || 0,
        openBottleRemainingMl: product.open_bottle_remaining_ml || 0,
        bottleSizeMl: product.bottle_capacity_ml || 1000,
        minStockThreshold: product.minQuantity || 2
      });
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        brand: '',
        category: '',
        volume: 0,
        unit: 'ml',
        price: 0,
        cost: 0,
        totalQuantity: 0,
        minThreshold: 10,
        imageUrl: '',
        isActive: true,
        sealedBottles: 0,
        openBottleRemainingMl: 0,
        bottleSizeMl: 1000,
        minStockThreshold: 2
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (formData.volume <= 0) {
      newErrors.volume = 'Volume must be greater than 0';
    }

    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }

    if (formData.cost < 0) {
      newErrors.cost = 'Cost cannot be negative';
    }

    if (formData.cost > formData.price && formData.price > 0) {
      newErrors.cost = 'Cost cannot be higher than price';
    }

    if (formData.totalQuantity < 0) {
      newErrors.totalQuantity = 'Total quantity cannot be negative';
    }

    if (formData.minThreshold < 0) {
      newErrors.minThreshold = 'Minimum threshold cannot be negative';
    }

    if (formData.sealedBottles < 0) {
      newErrors.sealedBottles = 'Sealed bottles cannot be negative';
    }

    if (formData.openBottleRemainingMl < 0) {
      newErrors.openBottleRemainingMl = 'Open bottle remaining ML cannot be negative';
    }

    if (formData.bottleSizeMl <= 0) {
      newErrors.bottleSizeMl = 'Bottle size must be greater than 0';
    }

    if (formData.minStockThreshold < 0) {
      newErrors.minStockThreshold = 'Minimum stock threshold cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      let savedProduct: Product | null = null;

      // Map camelCase form fields to snake_case Product fields
      const productData = {
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        volume: formData.volume,
        unit: formData.unit,
        price: formData.price,
        cost: formData.cost,
        quantity: formData.totalQuantity,
        totalQuantity: formData.totalQuantity,
        minQuantity: formData.minThreshold,
        minThreshold: formData.minThreshold,
        isActive: formData.isActive,
        imageUrl: formData.imageUrl,
        // Map bottle fields correctly
        sealed_bottles: formData.sealedBottles,
        open_bottle_remaining_ml: formData.openBottleRemainingMl,
        bottle_capacity_ml: formData.bottleSizeMl,
        minStockThreshold: formData.minStockThreshold
      };

      if (isEditing && product) {
        savedProduct = await productService.update(product.id, productData);
      } else {
        savedProduct = await productService.create(productData);
      }

      if (savedProduct) {
        toast.success(isEditing ? 'Product updated successfully!' : 'Product created successfully!');
        onSave(savedProduct);
        onClose();
      } else {
        throw new Error('Failed to save product');
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const categories = [
    'Soins des Cheveux',
    'Soins de la Peau',
    'Soins des Ongles',
    'Produits de Coiffage',
    'Outils et Équipements',
    'Produits de Nettoyage',
    'Autres'
  ];

  const units = ['ml', 'g', 'pieces', 'bottles', 'tubes'];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditing ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="text-sm text-gray-600">
                  {isEditing ? 'Update product information' : 'Create a new product for your inventory'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter product name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand *
                    </label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.brand ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter brand name"
                    />
                    {errors.brand && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.brand}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.category}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => handleInputChange('unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing & Volume */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Pricing & Volume
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Volume *
                    </label>
                    <input
                      type="number"
                      value={formData.volume}
                      onChange={(e) => handleInputChange('volume', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.volume ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                    {errors.volume && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.volume}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    {errors.price && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.price}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost
                    </label>
                    <input
                      type="number"
                      value={formData.cost}
                      onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.cost ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    {errors.cost && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.cost}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bottle Size (ML)
                    </label>
                    <input
                      type="number"
                      value={formData.bottleSizeMl}
                      onChange={(e) => handleInputChange('bottleSizeMl', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.bottleSizeMl ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="1000"
                      min="1"
                    />
                    {errors.bottleSizeMl && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.bottleSizeMl}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Inventory Management */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Inventory Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.totalQuantity}
                      onChange={(e) => handleInputChange('totalQuantity', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.totalQuantity ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                      min="0"
                    />
                    {errors.totalQuantity && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.totalQuantity}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sealed Bottles
                    </label>
                    <input
                      type="number"
                      value={formData.sealedBottles}
                      onChange={(e) => handleInputChange('sealedBottles', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.sealedBottles ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                      min="0"
                    />
                    {errors.sealedBottles && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.sealedBottles}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Open Bottle Remaining (ML)
                    </label>
                    <input
                      type="number"
                      value={formData.openBottleRemainingMl}
                      onChange={(e) => handleInputChange('openBottleRemainingMl', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.openBottleRemainingMl ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                      min="0"
                    />
                    {errors.openBottleRemainingMl && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.openBottleRemainingMl}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Stock Threshold
                    </label>
                    <input
                      type="number"
                      value={formData.minStockThreshold}
                      onChange={(e) => handleInputChange('minStockThreshold', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.minStockThreshold ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="2"
                      min="0"
                    />
                    {errors.minStockThreshold && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.minStockThreshold}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Threshold (General)
                  </label>
                  <input
                    type="number"
                    value={formData.minThreshold}
                    onChange={(e) => handleInputChange('minThreshold', parseInt(e.target.value) || 0)}
                    className={`w-full md:w-1/4 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.minThreshold ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="10"
                    min="0"
                  />
                  {errors.minThreshold && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.minThreshold}
                    </p>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-500" />
                  Additional Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/product-image.jpg"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Product is active
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProductModal;