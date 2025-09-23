import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Scissors,
  DollarSign,
  Clock,
  Tag,
  FileText,
  Package,
  Users,
  Percent,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Service, Product, User, ServiceProduct } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { productService, staffService } from '@/services/database';
import { formatPrice } from '@/utils/currency';
import toast from 'react-hot-toast';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  service?: Service | null;
  isLoading?: boolean;
  isSubmitting?: boolean;
}

const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  service,
  isLoading = false,
  isSubmitting = false,
}) => {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [staff, setStaff] = useState<User[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    nameFr: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    commissionPercent: '',
    isActive: true,
    requiredProducts: [] as ServiceProduct[],
    assignedStaff: [] as string[],
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Service categories
  const categories = [
    'haircut',
    'coloring',
    'styling',
    'treatment',
    'manicure',
    'pedicure',
    'facial',
    'massage',
    'waxing',
    'eyebrows',
    'other',
  ];

  // Load products and staff when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProducts();
      loadStaff();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const productsData = await productService.getAll();
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const staffData = await staffService.getAll();
      setStaff(staffData);
    } catch (error) {
      console.error('Error loading staff:', error);
      toast.error('Failed to load staff');
    } finally {
      setIsLoadingStaff(false);
    }
  };

  // Initialize form data when service changes
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        nameAr: service.nameAr || '',
        nameFr: service.nameFr || '',
        description: service.description || '',
        price: service.price.toString(),
        duration: service.duration.toString(),
        category: service.category || '',
        commissionPercent: service.commissionPercent?.toString() || '0',
        isActive: service.isActive,
        requiredProducts: service.requiredProducts || [],
        assignedStaff: service.assignedStaff || [],
      });
    } else {
      setFormData({
        name: '',
        nameAr: '',
        nameFr: '',
        description: '',
        price: '',
        duration: '',
        category: '',
        commissionPercent: '0',
        isActive: true,
        requiredProducts: [],
        assignedStaff: [],
      });
    }
    setErrors({});
  }, [service, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('services.serviceName') + ' is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.duration || parseInt(formData.duration) <= 0) {
      newErrors.duration = 'Valid duration is required';
    }

    if (!formData.category) {
      newErrors.category = t('services.serviceCategory') + ' is required';
    }

    const commission = parseFloat(formData.commissionPercent);
    if (isNaN(commission) || commission < 0 || commission > 100) {
      newErrors.commissionPercent = 'Commission must be between 0 and 100';
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

    try {
      const serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        nameAr: formData.nameAr.trim() || undefined,
        nameFr: formData.nameFr.trim() || undefined,
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        category: formData.category,
        commissionPercent: parseFloat(formData.commissionPercent),
        isActive: formData.isActive,
        requiredProducts: formData.requiredProducts,
        assignedStaff: formData.assignedStaff,
      };

      await onSubmit(serviceData);
      onClose();
    } catch (error) {
      console.error('Error submitting service:', error);
      toast.error('Failed to save service');
    }
  };

  const handleAddProduct = () => {
    setFormData(prev => ({
      ...prev,
      requiredProducts: [
        ...prev.requiredProducts,
        { productId: '', requiredMl: 0, isOptional: false },
      ],
    }));
  };

  const handleRemoveProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requiredProducts: prev.requiredProducts.filter((_, i) => i !== index),
    }));
  };

  const handleProductChange = (index: number, field: keyof ServiceProduct, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      requiredProducts: prev.requiredProducts.map((product, i) =>
        i === index ? { ...product, [field]: value } : product
      ),
    }));
  };

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
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Scissors className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {service ? t('services.editService') : t('services.addService')}
                </h2>
                <p className="text-gray-500 text-sm">
                  {service ? 'Update service details' : 'Create a new service for your salon'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-2" />
                    {t('services.serviceName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Enter service name"
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
                    <Tag className="w-4 h-4 inline mr-2" />
                    {t('services.serviceCategory')} *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className={`input-field ${errors.category ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.category}
                    </p>
                  )}
                </div>
              </div>

              {/* Price and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    {t('services.servicePrice')} (MAD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className={`input-field ${errors.price ? 'border-red-500' : ''}`}
                    placeholder="0.00"
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
                    <Clock className="w-4 h-4 inline mr-2" />
                    {t('services.serviceDuration')} (min) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    className={`input-field ${errors.duration ? 'border-red-500' : ''}`}
                    placeholder="30"
                  />
                  {errors.duration && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.duration}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Percent className="w-4 h-4 inline mr-2" />
                    Commission (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.commissionPercent}
                    onChange={(e) => setFormData(prev => ({ ...prev, commissionPercent: e.target.value }))}
                    className={`input-field ${errors.commissionPercent ? 'border-red-500' : ''}`}
                    placeholder="0"
                  />
                  {errors.commissionPercent && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.commissionPercent}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  {t('services.serviceDescription')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Describe the service..."
                />
              </div>

              {/* Multi-language Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name (Arabic)
                  </label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                    className="input-field"
                    placeholder="اسم الخدمة"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name (French)
                  </label>
                  <input
                    type="text"
                    value={formData.nameFr}
                    onChange={(e) => setFormData(prev => ({ ...prev, nameFr: e.target.value }))}
                    className="input-field"
                    placeholder="Nom du service"
                  />
                </div>
              </div>

              {/* Required Products */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    <Package className="w-4 h-4 inline mr-2" />
                    {t('services.requiredProducts')}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="btn-secondary text-sm flex items-center gap-2"
                    disabled={isLoadingProducts}
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.requiredProducts.map((product, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <select
                        value={product.productId}
                        onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                        className="input-field flex-1"
                        disabled={isLoadingProducts}
                      >
                        <option value="">Select product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.volume}{p.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={product.requiredMl || 0}
                        onChange={(e) => handleProductChange(index, 'requiredMl', parseFloat(e.target.value) || 0)}
                        className="input-field w-24"
                        placeholder="ml"
                      />

                      <span className="text-sm text-gray-500 px-2">ml</span>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={product.isOptional || false}
                          onChange={(e) => handleProductChange(index, 'isOptional', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-600">Optional</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {formData.requiredProducts.length === 0 && (
                    <p className="text-gray-500 text-sm italic text-center py-4">
                      No products required for this service
                    </p>
                  )}
                </div>
              </div>

              {/* Staff Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  <Users className="w-4 h-4 inline mr-2" />
                  Assigned Staff
                </label>
                
                {isLoadingStaff ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {staff.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No staff members available
                      </p>
                    ) : (
                      staff.map((staffMember) => (
                        <label key={staffMember.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={formData.assignedStaff.includes(staffMember.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  assignedStaff: [...prev.assignedStaff, staffMember.id]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  assignedStaff: prev.assignedStaff.filter(id => id !== staffMember.id)
                                }));
                              }
                            }}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{staffMember.name}</p>
                            <p className="text-xs text-gray-500">{staffMember.email}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  Select staff members who can perform this service. Leave empty if all staff can perform it.
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  {t('services.isActive')}
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </div>
                ) : (
                  service ? 'Update Service' : 'Create Service'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ServiceModal;