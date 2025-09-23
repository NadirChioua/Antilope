import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Settings,
  Scissors,
  Clock,
  DollarSign,
  Package,
  Droplets,
  AlertTriangle,
  CheckCircle,
  Eye,
  TrendingUp
} from 'lucide-react';
import ServiceModal from '../../components/ServiceModal';
import ServiceProductsModal from '../../components/ServiceProductsModal';
import { serviceService } from '../../services/database';
import SalonService, { ServiceWithProducts } from '../../services/salonService';
import { formatPrice } from '../../utils/currency';
import toast from 'react-hot-toast';

const SalonServices: React.FC = () => {
  const [services, setServices] = useState<ServiceWithProducts[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceWithProducts[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceWithProducts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [salonService] = useState(new SalonService());

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, selectedCategory]);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const data = await salonService.getServicesWithProducts();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    setFilteredServices(filtered);
  };

  const handleEditService = (service: ServiceWithProducts) => {
    setSelectedService(service);
    setShowServiceModal(true);
  };

  const handleConfigureProducts = (service: ServiceWithProducts) => {
    setSelectedService(service);
    setShowProductsModal(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await serviceService.delete(serviceId);
      setServices(services.filter(s => s.id !== serviceId));
      toast.success('Service deleted successfully');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  const handleServiceSaved = () => {
    fetchServices();
    setShowServiceModal(false);
    setSelectedService(null);
  };

  const handleProductsSaved = () => {
    fetchServices();
    setShowProductsModal(false);
    setSelectedService(null);
  };

  const getCategories = () => {
    const categories = [...new Set(services.map(s => s.category))];
    return categories.sort();
  };

  const getServiceStats = (service: ServiceWithProducts) => {
    const productCount = service.required_products.length;
    const totalCost = service.required_products.reduce((sum, req) => {
      // This would need actual product cost calculation
      return sum;
    }, 0);
    
    return {
      productCount,
      totalCost,
      hasProducts: productCount > 0
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salon Services</h1>
          <p className="text-gray-600">Manage services and their product requirements</p>
        </div>
        <button
          onClick={() => {
            setSelectedService(null);
            setShowServiceModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {getCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => {
          const stats = getServiceStats(service);
          
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Service Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Scissors className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-600">{service.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditService(service)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Service Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Duration</span>
                    </div>
                    <span className="font-medium">{service.duration} min</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span>Price</span>
                    </div>
                    <span className="font-semibold text-green-600">{formatPrice(service.price)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Package className="w-4 h-4" />
                      <span>Products</span>
                    </div>
                    <span className="font-medium">{stats.productCount}</span>
                  </div>
                </div>

                {/* Product Requirements Status */}
                <div className="mb-4">
                  {stats.hasProducts ? (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Products configured</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span>No products configured</span>
                    </div>
                  )}
                </div>

                {/* Product Requirements Preview */}
                {service.required_products.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Required Products:</p>
                    <div className="space-y-1">
                      {service.required_products.slice(0, 2).map((req, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <Droplets className="w-3 h-3 text-blue-500" />
                          <span className="text-gray-600 truncate">
                            {req.product_name} - {req.quantity_ml}ml
                          </span>
                        </div>
                      ))}
                      {service.required_products.length > 2 && (
                        <p className="text-xs text-gray-400">
                          +{service.required_products.length - 2} more...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 pb-6">
                <button
                  onClick={() => handleConfigureProducts(service)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Configure Products
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredServices.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Scissors className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first service'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <button
              onClick={() => {
                setSelectedService(null);
                setShowServiceModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add First Service
            </button>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {services.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{services.length}</div>
              <div className="text-sm text-gray-600">Total Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {services.filter(s => s.required_products.length > 0).length}
              </div>
              <div className="text-sm text-gray-600">With Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {getCategories().length}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ServiceModal
        service={selectedService}
        isOpen={showServiceModal}
        onClose={() => {
          setShowServiceModal(false);
          setSelectedService(null);
        }}
        onSave={handleServiceSaved}
      />

      <ServiceProductsModal
        service={selectedService}
        isOpen={showProductsModal}
        onClose={() => {
          setShowProductsModal(false);
          setSelectedService(null);
        }}
        onSave={handleProductsSaved}
      />
    </div>
  );
};

export default SalonServices;