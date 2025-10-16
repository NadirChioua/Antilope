import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Package,
  Plus,
  AlertCircle,
  Save,
  Truck,
  Calendar,
  DollarSign,
  Hash
} from 'lucide-react';
import { Product } from '@/types';
import toast from 'react-hot-toast';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onRestock: (restockData: RestockData) => Promise<boolean>;
}

export interface RestockData {
  productId: string;
  bottlesToAdd: number;
  costPerBottle: number;
  totalCost: number;
  supplier?: string;
  invoiceNumber?: string;
  notes?: string;
  restockDate: string;
}

const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  product,
  onRestock
}) => {
  const [formData, setFormData] = useState<RestockData>({
    productId: '',
    bottlesToAdd: 1,
    costPerBottle: 0,
    totalCost: 0,
    supplier: '',
    invoiceNumber: '',
    notes: '',
    restockDate: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        productId: product.id,
        bottlesToAdd: 1,
        costPerBottle: product.cost || 0,
        totalCost: product.cost || 0,
        supplier: '',
        invoiceNumber: '',
        notes: '',
        restockDate: new Date().toISOString().split('T')[0]
      });
      setErrors({});
    }
  }, [product, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.bottlesToAdd || formData.bottlesToAdd <= 0) {
      newErrors.bottlesToAdd = 'Number of bottles must be greater than 0';
    }

    if (formData.bottlesToAdd > 1000) {
      newErrors.bottlesToAdd = 'Number of bottles cannot exceed 1000';
    }

    if (formData.costPerBottle < 0) {
      newErrors.costPerBottle = 'Cost per bottle cannot be negative';
    }

    if (!formData.restockDate) {
      newErrors.restockDate = 'Restock date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof RestockData, value: string | number) => {
    const newFormData = {
      ...formData,
      [field]: value
    };

    // Auto-calculate total cost when bottles or cost per bottle changes
    if (field === 'bottlesToAdd' || field === 'costPerBottle') {
      newFormData.totalCost = newFormData.bottlesToAdd * newFormData.costPerBottle;
    }

    setFormData(newFormData);

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const success = await onRestock(formData);
      if (success) {
        // Create detailed success message with product name and quantity
        const bottleText = formData.bottlesToAdd === 1 ? 'bottle' : 'bottles';
        const successMessage = `Successfully restocked ${formData.bottlesToAdd} ${bottleText} of ${product?.name}`;
        toast.success(successMessage);
        onClose();
      }
    } catch (error) {
      console.error('Error restocking product:', error);
      toast.error('Failed to restock product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  const currentStock = product.sealed_bottles || 0;
  const newStock = currentStock + formData.bottlesToAdd;
  const totalMlAfterRestock = newStock * (product.bottle_capacity_ml || 1000) + (product.open_bottle_remaining_ml || 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Restock Product
                </h2>
                <p className="text-sm text-gray-600">
                  Add new bottles to {product.name} inventory
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

          {/* Current Stock Info */}
          <div className="p-6 bg-blue-50 border-b border-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{currentStock}</div>
                <div className="text-sm text-gray-600">Current Bottles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{newStock}</div>
                <div className="text-sm text-gray-600">After Restock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{Math.round(totalMlAfterRestock)}</div>
                <div className="text-sm text-gray-600">Total ml Available</div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-280px)]">
            <div className="p-6 space-y-6">
              {/* Restock Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  Restock Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Bottles *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.bottlesToAdd}
                      onChange={(e) => handleInputChange('bottlesToAdd', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.bottlesToAdd ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter number of bottles"
                    />
                    {errors.bottlesToAdd && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.bottlesToAdd}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Restock Date *
                    </label>
                    <input
                      type="date"
                      value={formData.restockDate}
                      onChange={(e) => handleInputChange('restockDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.restockDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.restockDate && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.restockDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cost Information */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Cost Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost per Bottle
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPerBottle}
                      onChange={(e) => handleInputChange('costPerBottle', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.costPerBottle ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.costPerBottle && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.costPerBottle}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.totalCost}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-purple-500" />
                  Additional Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supplier
                      </label>
                      <input
                        type="text"
                        value={formData.supplier || ''}
                        onChange={(e) => handleInputChange('supplier', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter supplier name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Invoice Number
                      </label>
                      <input
                        type="text"
                        value={formData.invoiceNumber || ''}
                        onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter invoice number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter any additional notes about this restock..."
                    />
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
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? 'Restocking...' : 'Restock Product'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RestockModal;