import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scissors, Plus, Search, Edit, Trash2, DollarSign, Clock, Package, AlertTriangle, Filter, Users } from 'lucide-react';
import { Service, User } from '@/types';
import Logo from '@/components/Logo';
import ServiceModal from '@/components/ServiceModal';
import { serviceService, staffService } from '@/services/database';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'react-hot-toast';
import { formatPrice } from '@/utils/currency';

const Services: React.FC = () => {
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<User[]>([]);

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

  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [servicesData, staffData] = await Promise.all([
        serviceService.getAll(),
        staffService.getAll()
      ]);
      setServices(servicesData);
      setStaff(staffData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Filter services based on search and category
  useEffect(() => {
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, selectedCategory]);

  const handleCreateService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsSubmitting(true);
    try {
      const newService = await serviceService.create(serviceData);
      if (newService) {
        setServices(prev => [newService, ...prev]);
        toast.success('Service created successfully');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error('Failed to create service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedService) return;
    
    setIsSubmitting(true);
    try {
      const updatedService = await serviceService.update(selectedService.id, serviceData);
      if (updatedService) {
        setServices(prev => prev.map(s => s.id === selectedService.id ? updatedService : s));
        toast.success('Service updated successfully');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await serviceService.delete(serviceId);
      setServices(prev => prev.filter(s => s.id !== serviceId));
      toast.success('Service deleted successfully');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  const handleOpenModal = (service?: Service) => {
    setSelectedService(service || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  const handleSubmitService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedService) {
      await handleUpdateService(serviceData);
    } else {
      await handleCreateService(serviceData);
    }
  };

  const getStaffNames = (staffIds: string[]) => {
    return staffIds
      .map(id => staff.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={fetchServices}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {service.name}
                </h3>
                <p className="text-sm text-gray-500">{service.category}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleOpenModal(service)}
                  className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                  title="Edit service"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteService(service.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete service"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Price:</span>
                <span className="font-medium text-gray-900">{formatPrice(service.price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Duration:</span>
                <span className="font-medium text-gray-900">{service.duration} min</span>
              </div>
              {service.commissionPercent && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Commission:</span>
                  <span className="font-medium text-gray-900">{service.commissionPercent}%</span>
                </div>
              )}
            </div>

            {service.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>
            )}

            {service.requiredProducts && service.requiredProducts.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Required Products:</p>
                <div className="flex flex-wrap gap-1">
                  {service.requiredProducts.slice(0, 3).map((product, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      Product {product.productId} ({product.quantity} {product.unit})
                    </span>
                  ))}
                  {service.requiredProducts.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      +{service.requiredProducts.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {service.assignedStaff && service.assignedStaff.length > 0 && (
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <span className="text-sm text-gray-600">
                    Assigned to: {getStaffNames(service.assignedStaff)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory 
              ? "Try adjusting your search or filter criteria"
              : "Get started by creating your first service"
            }
          </p>
          {!searchTerm && !selectedCategory && (
            <button
              onClick={() => handleOpenModal()}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Add Service
            </button>
          )}
        </div>
      )}

      {/* Service Modal */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitService}
        service={selectedService}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default Services;
