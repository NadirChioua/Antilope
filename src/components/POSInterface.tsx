import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Scissors,
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  CreditCard,
  Receipt,
  ChevronRight,
  Clock,
  TrendingUp,
  ShoppingCart,
  Minus,
  Edit3,
  Send,
} from 'lucide-react';
import { Client, Service, Product } from '@/types';
import ClientModal from '@/components/ClientModal';
import Logo from '@/components/Logo';
import { clientService, serviceService, productService, saleService } from '@/services/database';
import { SimpleBottleConsumptionService } from '@/services/SimpleBottleConsumptionService';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { formatPrice } from '@/utils/currency';

interface ProductUsage {
  productId: string;
  product: Product;
  suggestedQuantity: number;
  actualQuantity: number;
  unit: string;
  stockStatus: 'ok' | 'low' | 'empty';
  serviceId?: string; // Track which service this product belongs to
}

interface SelectedService {
  service: Service;
  products: ProductUsage[];
}

interface POSInterfaceProps {
  onSaleComplete?: (saleData: any) => void;
}

const POSInterface: React.FC<POSInterfaceProps> = ({ onSaleComplete }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'client' | 'services' | 'products' | 'payment' | 'receipt'>('client');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [allProductUsages, setAllProductUsages] = useState<ProductUsage[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saleReceipt, setSaleReceipt] = useState<any>(null);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // Function to refresh product data
  const refreshProducts = async () => {
    try {
      const productsData = await productService.getAll();
      setProducts(productsData);
      console.log('🔄 Products refreshed after sale');
    } catch (error) {
      console.error('Error refreshing products:', error);
      toast.error('Failed to refresh product data');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [clientsData, servicesData, productsData] = await Promise.all([
          clientService.getAll(),
          serviceService.getAll(),
          productService.getAll(),
        ]);
        
        setClients(clientsData);
        setServices(servicesData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching POS data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.phone.includes(clientSearch)
  );

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    service.category.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const calculateTotal = () => {
    return selectedServices.reduce((total, selectedService) => total + selectedService.service.price, 0);
  };

  const validateStock = () => {
    const stockErrors: string[] = [];
    
    for (const usage of allProductUsages) {
      const openBottleMl = usage.product.open_bottle_remaining_ml || 0;
      const sealedBottles = usage.product.sealed_bottles || 0;
      const bottleSize = usage.product.bottle_capacity_ml || 1000;
      const totalAvailableMl = (sealedBottles * bottleSize) + openBottleMl;
      
      if (usage.actualQuantity > totalAvailableMl) {
        const willUseFromOpen = Math.min(usage.actualQuantity, openBottleMl);
        const willNeedFromSealed = Math.max(0, usage.actualQuantity - openBottleMl);
        const bottlesNeeded = willNeedFromSealed > 0 ? Math.ceil(willNeedFromSealed / bottleSize) : 0;
        
        stockErrors.push(`${usage.product.name}: Need ${usage.actualQuantity}ml, Available ${totalAvailableMl}ml (Open: ${openBottleMl}ml, Sealed: ${sealedBottles} bottles)`);
      }
    }
    
    return stockErrors;
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setCurrentStep('services');
  };

  const handleServiceSelect = async (service: Service) => {
    // Check if service is already selected
    const isAlreadySelected = selectedServices.some(s => s.service.id === service.id);
    console.log('🔍 Service selection debug:', {
      serviceName: service.name,
      serviceId: service.id,
      isAlreadySelected,
      currentSelectedServices: selectedServices.map(s => ({ id: s.service.id, name: s.service.name }))
    });
    
    if (isAlreadySelected) {
      toast.error('Service already selected');
      return;
    }
    
    // Load required products for this service
    const requiredProducts = service.requiredProducts || [];
    const serviceProducts: ProductUsage[] = [];
    
    for (const reqProduct of requiredProducts) {
      const product = products.find(p => p.id === reqProduct.productId);
      if (product) {
        const openBottleMl = product.open_bottle_remaining_ml || 0;
        const sealedBottles = product.sealed_bottles || 0;
        const bottleSize = product.bottle_capacity_ml || 1000;
        const totalAvailableMl = (sealedBottles * bottleSize) + openBottleMl;
        const stockStatus = totalAvailableMl <= 0 ? 'empty' : 
                           totalAvailableMl <= 100 ? 'low' : 'ok'; // Consider low stock when less than 100ml available
        
        serviceProducts.push({
          productId: product.id,
          product,
          suggestedQuantity: reqProduct.defaultQuantity || 1,
          actualQuantity: reqProduct.defaultQuantity || 1,
          unit: reqProduct.unit || product.unit,
          stockStatus,
          serviceId: service.id
        });
      }
    }
    
    // Add service to selected services
    const newSelectedService: SelectedService = {
      service,
      products: serviceProducts
    };
    
    setSelectedServices(prev => [...prev, newSelectedService]);
    
    // Update all product usages
    setAllProductUsages(prev => [...prev, ...serviceProducts]);
    
    toast.success(`${service.name} added to sale`);
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.service.id !== serviceId));
    setAllProductUsages(prev => prev.filter(p => p.serviceId !== serviceId));
    toast.success('Service removed from sale');
  };

  const handleContinueToProducts = () => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }
    setCurrentStep('products');
  };

  const handleQuantityChange = (productId: string, serviceId: string, newQuantity: number) => {
    // Update in selected services
    setSelectedServices(prev => prev.map(selectedService => {
      if (selectedService.service.id === serviceId) {
        return {
          ...selectedService,
          products: selectedService.products.map(product => 
            product.productId === productId 
              ? { ...product, actualQuantity: Math.max(0, newQuantity) }
              : product
          )
        };
      }
      return selectedService;
    }));

    // Update in all product usages
    setAllProductUsages(prev => prev.map(usage => 
      usage.productId === productId && usage.serviceId === serviceId
        ? { ...usage, actualQuantity: Math.max(0, newQuantity) }
        : usage
    ));
  };

  const addExtraProduct = (serviceId: string, product: Product) => {
    const openBottleMl = product.open_bottle_remaining_ml || 0;
    const sealedBottles = product.sealed_bottles || 0;
    const bottleSize = product.bottle_capacity_ml || 1000;
    const totalAvailableMl = (sealedBottles * bottleSize) + openBottleMl;
    const stockStatus = totalAvailableMl <= 0 ? 'empty' : 
                       totalAvailableMl <= 100 ? 'low' : 'ok'; // Consider low stock when less than 100ml available
    
    const newProductUsage: ProductUsage = {
      productId: product.id,
      product,
      suggestedQuantity: 1,
      actualQuantity: 1,
      unit: product.unit,
      stockStatus,
      serviceId
    };

    // Add to selected service
    setSelectedServices(prev => prev.map(selectedService => {
      if (selectedService.service.id === serviceId) {
        return {
          ...selectedService,
          products: [...selectedService.products, newProductUsage]
        };
      }
      return selectedService;
    }));

    // Add to all product usages
    setAllProductUsages(prev => [...prev, newProductUsage]);
    toast.success(`${product.name} added to ${selectedServices.find(s => s.service.id === serviceId)?.service.name}`);
  };

  const removeProduct = (productId: string, serviceId: string) => {
    // Remove from selected service
    setSelectedServices(prev => prev.map(selectedService => {
      if (selectedService.service.id === serviceId) {
        return {
          ...selectedService,
          products: selectedService.products.filter(p => p.productId !== productId)
        };
      }
      return selectedService;
    }));

    // Remove from all product usages
    setAllProductUsages(prev => prev.filter(p => !(p.productId === productId && p.serviceId === serviceId)));
  };

  const calculateTotalAmount = () => {
    return selectedServices.reduce((total, selectedService) => total + selectedService.service.price, 0);
  };

  const calculateTotalCommission = () => {
    return selectedServices.reduce((total, selectedService) => {
      const commissionPercent = selectedService.service.commissionPercent || 0;
      return total + (selectedService.service.price * (commissionPercent / 100));
    }, 0);
  };

  const handleConfirmSale = async () => {
    // Enhanced validation with specific error messages
    if (!selectedClient) {
      toast.error('Please select a client first');
      return;
    }

    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    if (!user) {
      toast.error('User authentication required');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // Validate that all services have at least one product
    const servicesWithoutProducts = selectedServices.filter(ss => ss.products.length === 0);
    if (servicesWithoutProducts.length > 0) {
      toast.error(`Services missing products: ${servicesWithoutProducts.map(s => s.service.name).join(', ')}`);
      return;
    }

    // Validate stock
    const stockErrors = validateStock();
    if (stockErrors.length > 0) {
      toast.error(`Insufficient stock:\n${stockErrors.join('\n')}`);
      return;
    }

    // Check for zero quantities
    const zeroQuantityProducts = allProductUsages.filter(usage => usage.actualQuantity <= 0);
    if (zeroQuantityProducts.length > 0) {
      toast.error(`Products with zero quantity: ${zeroQuantityProducts.map(p => p.product.name).join(', ')}`);
      return;
    }

    // Validate total amount
    const totalAmount = calculateTotalAmount();
    if (totalAmount <= 0) {
      toast.error('Sale total must be greater than $0');
      return;
    }

    setIsProcessingSale(true);

    try {
      // Prepare sale data for the enhanced API
      const saleData = {
        clientId: selectedClient.id,
        services: selectedServices.map(selectedService => ({
          serviceId: selectedService.service.id,
          products: selectedService.products.map(product => ({
            productId: product.productId,
            quantity: product.actualQuantity,
            unit: product.unit,
          }))
        })),
        staffId: user.id,
        paymentMethod,
        notes: `Sale with ${selectedServices.length} service(s): ${selectedServices.map(s => s.service.name).join(', ')}`,
      };

      console.log('🛒 Submitting sale data:', saleData);

      // Validate sale data structure
      if (!saleData.clientId || !saleData.staffId || !saleData.services.length) {
        throw new Error('Invalid sale data structure');
      }

      // First create the sale record
      const result = await saleService.createCompleteSale(saleData);
      
      if (result) {
        const { sale, receipt, commission } = result;
        
        if (!sale || !sale.id) {
          throw new Error('Invalid sale result - missing sale ID');
        }

        // Process bottle consumption for each service
        let totalMlConsumed = 0;
        let totalBottlesOpened = 0;
        const consumptionErrors: string[] = [];

        for (const selectedService of selectedServices) {
          try {
            console.log(`🍾 Processing bottle consumption for service: ${selectedService.service.name}`);
            
            // Check service availability first
            const availability = await SimpleBottleConsumptionService.checkServiceAvailability(selectedService.service.id);
            
            if (!availability.available) {
              consumptionErrors.push(`${selectedService.service.name}: ${availability.missingProducts.join(', ')}`);
              continue;
            }

            // Process each product with the actual quantities selected by the user
            for (const productUsage of selectedService.products) {
              const consumptionResult = await SimpleBottleConsumptionService.consumeProduct({
                productId: productUsage.productId,
                requiredMl: productUsage.actualQuantity, // Use the actual quantity selected by the user
                saleId: sale.id,
                serviceId: selectedService.service.id,
                staffId: user?.id
              });

              if (!consumptionResult.success) {
                consumptionErrors.push(`${productUsage.product.name}: ${consumptionResult.error}`);
              } else {
                totalMlConsumed += consumptionResult.consumedMl;
                totalBottlesOpened += consumptionResult.bottlesOpened;
                
                console.log(`✅ Product ${productUsage.product.name}: ${consumptionResult.consumedMl}ml consumed (requested: ${productUsage.actualQuantity}ml), ${consumptionResult.bottlesOpened} bottles opened`);
              }
            }
          } catch (error: any) {
            console.error(`❌ Error processing consumption for service ${selectedService.service.name}:`, error);
            consumptionErrors.push(`${selectedService.service.name}: ${error.message}`);
          }
        }

        // Show consumption results
        if (consumptionErrors.length > 0) {
          toast.error(`Consumption errors: ${consumptionErrors.join('; ')}`);
        }

        // Refresh product data to show updated quantities
        await refreshProducts();
        
        // Set receipt and move to receipt step
        setSaleReceipt(receipt);
        setCurrentStep('receipt');
        
        // Enhanced success message with consumption details
        let successMessage = commission > 0 
          ? `Sale completed! Commission earned: ${formatPrice(commission)}` 
          : 'Sale completed successfully!';
        
        if (totalMlConsumed > 0) {
          successMessage += ` | Consumed ${totalMlConsumed}ml from ${totalBottlesOpened} bottles`;
        }
        
        toast.success(successMessage);
        
        if (onSaleComplete) {
          onSaleComplete(sale);
        }
      } else {
        throw new Error('No result returned from sale creation');
      }
    } catch (error: any) {
      console.error('❌ Error completing sale:', error);
      
      // Provide specific error messages based on error type
      if (error.message?.includes('stock') || error.message?.includes('quantity')) {
        toast.error('Stock validation failed. Please check product quantities and try again.');
      } else if (error.message?.includes('client')) {
        toast.error('Client validation failed. Please select a valid client.');
      } else if (error.message?.includes('service')) {
        toast.error('Service validation failed. Please check selected services.');
      } else if (error.message?.includes('payment')) {
        toast.error('Payment method validation failed. Please select a valid payment method.');
      } else if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('connection')) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (error.message?.includes('timeout')) {
        toast.error('Request timeout. Please try again.');
      } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
        toast.error('Permission denied. Please check your access rights.');
      } else {
        toast.error(`Failed to complete sale: ${error.message || 'Unknown error occurred'}`);
      }
    } finally {
      setIsProcessingSale(false);
    }
  };

  const handleNewSale = async () => {
    // Reset all state for new sale
    setSelectedClient(null);
    setSelectedServices([]);
    setAllProductUsages([]);
    setSaleReceipt(null);
    setPaymentMethod('cash');
    setCurrentStep('client');
    
    // Refresh product data for new sale
    await refreshProducts();
    
    toast.success('Ready for new sale');
  };

  const handleAddClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'totalVisits' | 'totalSpent'>) => {
    try {
      const newClient = await clientService.create(clientData);
      if (newClient) {
        setClients(prev => [newClient, ...prev]);
        setSelectedClient(newClient);
        setCurrentStep('service');
      }
    } catch (error) {
      console.error('Error adding client:', error);
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading POS system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-cream p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-4">
          <Logo size="xl" variant="light" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 text-elegant">New Sale</h1>
        </div>
        <p className="text-gray-600 text-base sm:text-lg px-4">Create a beautiful experience for your client</p>
      </motion.div>

      {/* Progress Steps */}
      <div className="flex justify-center mb-8 px-4">
        <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto pb-2">
          {[
            { key: 'client', label: 'Client', icon: User },
            { key: 'services', label: 'Services', icon: Scissors },
            { key: 'products', label: 'Products', icon: Package },
            { key: 'payment', label: 'Payment', icon: CreditCard },
            { key: 'receipt', label: 'Receipt', icon: Receipt }
          ].map((step, index) => {
            const steps = ['client', 'services', 'products', 'payment', 'receipt'];
            const currentIndex = steps.indexOf(currentStep);
            const isActive = currentStep === step.key;
            const isCompleted = index < currentIndex;
            const IconComponent = step.icon;
            
            return (
              <div key={step.key} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <motion.div 
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg scale-110'
                        : isCompleted
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
                    }`}
                    whileHover={{ scale: isActive ? 1.15 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </motion.div>
                  <span className={`text-xs sm:text-sm mt-2 font-medium transition-colors duration-300 text-center min-w-0 ${
                    isActive ? 'text-primary-600 font-semibold' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < 4 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-2 sm:mx-4 transition-colors duration-300 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-3 lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Client Selection */}
              {currentStep === 'client' && (
                <motion.div
                  key="client"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="card-elegant"
                >
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Client</h2>
                    <p className="text-gray-600">Choose an existing client or add a new one</p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search clients by name or phone..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg shadow-soft"
                    />
                  </div>

                  {/* Client List */}
                  <div className="space-y-3 mb-6">
                    {filteredClients.map((client) => (
                      <motion.button
                        key={client.id}
                        onClick={() => handleClientSelect(client)}
                        className="w-full p-4 bg-white hover:bg-primary-50 rounded-xl border border-gray-200 hover:border-primary-300 transition-all duration-200 text-left group shadow-soft hover:shadow-elegant"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {client.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                              {client.name}
                            </h3>
                            <p className="text-gray-600">{client.phone}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>{client.totalVisits} visits</span>
                              <span>{formatPrice(client.totalSpent)}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Add New Client Button */}
                  <button
                    onClick={() => setShowClientModal(true)}
                    className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-soft hover:shadow-elegant"
                  >
                    <Plus className="w-5 h-5" />
                    Add New Client
                  </button>
                </motion.div>
              )}

              {/* Step 2: Service Selection */}
              {currentStep === 'services' && (
                <motion.div
                  key="services"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="card-elegant"
                >
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Scissors className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Services</h2>
                    <p className="text-gray-600">Choose services for {selectedClient?.name}</p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search services..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg shadow-soft"
                    />
                  </div>

                  {/* Selected Services */}
                  {selectedServices.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Selected Services:</h3>
                      <div className="space-y-2">
                        {selectedServices.map((selectedService) => (
                          <div key={selectedService.service.id} className="flex items-center justify-between p-3 bg-primary-50 rounded-lg border border-primary-200">
                            <div>
                              <p className="font-medium text-gray-800">{selectedService.service.name}</p>
                              <p className="text-sm text-gray-600">{formatPrice(selectedService.service.price)}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveService(selectedService.service.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Service Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {filteredServices.map((service) => (
                      <motion.button
                        key={service.id}
                        onClick={() => handleServiceSelect(service)}
                        className="p-6 bg-white hover:bg-primary-50 rounded-xl border border-gray-200 hover:border-primary-300 transition-all duration-200 text-left group shadow-soft hover:shadow-elegant"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                            {service.name}
                          </h3>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary-500">{formatPrice(service.price)}</p>
                            <div className="flex items-center gap-1 text-gray-500 text-sm">
                              <Clock className="w-4 h-4" />
                              <span>{service.duration} min</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Package className="w-4 h-4" />
                          <span>{(service.requiredProducts || []).length} products required</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => setCurrentStep('client')}
                      className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors duration-200 border border-gray-200"
                    >
                      Back to Client
                    </button>
                    <button
                      onClick={handleContinueToProducts}
                      className="flex-1 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-soft hover:shadow-elegant"
                    >
                      Continue to Products
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Product Quantities */}
              {currentStep === 'products' && (
                <motion.div
                  key="products"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="card-elegant"
                >
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Quantities</h2>
                    <p className="text-gray-600">Adjust quantities for selected services</p>
                  </div>

                  {/* Products by Service */}
                  <div className="space-y-6 mb-8">
                    {selectedServices.map((selectedService) => (
                      <div key={selectedService.service.id} className="bg-gray-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">{selectedService.service.name}</h3>
                        
                        {/* Service Products */}
                        <div className="space-y-4">
                          {selectedService.products.map((usage) => (
                            <div key={`${selectedService.service.id}-${usage.productId}`} className="p-4 bg-white rounded-xl border border-gray-200 shadow-soft">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {usage.product.name.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-semibold text-gray-800">{usage.product.name}</h4>
                                    <div className="flex items-center gap-4 mt-2 text-sm">
                                      <span className="text-primary-500 font-medium">
                                        Required: {usage.suggestedQuantity} ml
                                      </span>
                                      <span className="text-gray-500">
                                        Available: {usage.product.open_bottle_remaining_ml || 0}ml (open) + {usage.product.sealed_bottles || 0} sealed bottles
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStockStatusColor(usage.stockStatus)}`}>
                                  {getStockStatusIcon(usage.stockStatus)}
                                  <span>
                                    {usage.stockStatus === 'ok' ? 'In Stock' : 
                                     usage.stockStatus === 'low' ? 'Low Stock' : 'Out of Stock'}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Quantity Input */}
                              <div className="flex items-center gap-4">
                                <label className="text-sm font-medium text-gray-700">Actual Amount Used (ml):</label>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleQuantityChange(usage.productId, selectedService.service.id, usage.actualQuantity - 1)}
                                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <input
                                    type="number"
                                    value={usage.actualQuantity}
                                    onChange={(e) => handleQuantityChange(usage.productId, selectedService.service.id, parseInt(e.target.value) || 0)}
                                    className="w-20 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    min="0"
                                    max={(usage.product.sealed_bottles || 0) * (usage.product.bottle_capacity_ml || 0) + (usage.product.open_bottle_remaining_ml || 0)}
                                  />
                                  <button
                                    onClick={() => handleQuantityChange(usage.productId, selectedService.service.id, usage.actualQuantity + 1)}
                                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                                <span className="text-sm text-gray-500">{usage.unit}</span>
                                <button
                                  onClick={() => removeProduct(usage.productId, selectedService.service.id)}
                                  className="ml-auto text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Add Extra Product */}
                        <div className="mt-4">
                          <select
                            onChange={(e) => {
                              const productId = e.target.value;
                              if (productId) {
                                const product = products.find(p => p.id === productId);
                                if (product) {
                                  addExtraProduct(selectedService.service.id, product);
                                }
                                e.target.value = '';
                              }
                            }}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Add extra product...</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} - Stock: {((product.sealed_bottles || 0) * (product.bottle_capacity_ml || 0) + (product.open_bottle_remaining_ml || 0))}ml
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => setCurrentStep('services')}
                      className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors duration-200 border border-gray-200"
                    >
                      Back to Services
                    </button>
                    <button
                      onClick={() => setCurrentStep('payment')}
                      className="flex-1 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-soft hover:shadow-elegant"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Payment */}
              {currentStep === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="card-elegant"
                >
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment & Confirmation</h2>
                    <p className="text-gray-600">Review details and select payment method</p>
                  </div>

                  {/* Sale Summary */}
                  <div className="bg-gray-50 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Sale Summary</h3>
                    
                    {/* Client Info */}
                    <div className="flex items-center gap-4 p-4 bg-white rounded-lg mb-4">
                      <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {selectedClient?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{selectedClient?.name}</p>
                        <p className="text-gray-600 text-sm">{selectedClient?.phone}</p>
                      </div>
                    </div>

                    {/* Services Summary */}
                    <div className="p-4 bg-white rounded-lg mb-4">
                      <p className="font-medium text-gray-800 mb-3">Services:</p>
                      <div className="space-y-3">
                        {selectedServices.map((selectedService) => (
                          <div key={selectedService.service.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-800">{selectedService.service.name}</p>
                              <p className="text-gray-600 text-sm">{selectedService.service.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary-500">{formatPrice(selectedService.service.price)}</p>
                              <p className="text-gray-500 text-sm">{selectedService.service.duration} min</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Products Summary */}
                    <div className="p-4 bg-white rounded-lg mb-4">
                      <p className="font-medium text-gray-800 mb-3">Products Used:</p>
                      <div className="space-y-2">
                        {allProductUsages.map((usage) => (
                          <div key={`${usage.serviceId}-${usage.productId}`} className="flex justify-between text-sm">
                            <span className="text-gray-600">{usage.product.name}</span>
                            <span className="text-gray-800 font-medium">{usage.actualQuantity} {usage.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="p-4 bg-white rounded-lg mb-4">
                      <p className="font-medium text-gray-800 mb-3">Payment Method:</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setPaymentMethod('cash')}
                          className={`flex-1 py-3 px-4 rounded-lg border transition-colors duration-200 ${
                            paymentMethod === 'cash'
                              ? 'border-primary-500 bg-primary-50 text-primary-600'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <DollarSign className="w-5 h-5 mx-auto mb-1" />
                          Cash
                        </button>
                        <button
                          onClick={() => setPaymentMethod('card')}
                          className={`flex-1 py-3 px-4 rounded-lg border transition-colors duration-200 ${
                            paymentMethod === 'card'
                              ? 'border-primary-500 bg-primary-50 text-primary-600'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <CreditCard className="w-5 h-5 mx-auto mb-1" />
                          Card
                        </button>
                        <button
                          onClick={() => setPaymentMethod('transfer')}
                          className={`flex-1 py-3 px-4 rounded-lg border transition-colors duration-200 ${
                            paymentMethod === 'transfer'
                              ? 'border-primary-500 bg-primary-50 text-primary-600'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <Send className="w-5 h-5 mx-auto mb-1" />
                          Transfer
                        </button>
                      </div>
                    </div>

                    {/* Commission Info */}
                    {calculateTotalCommission() > 0 && (
                      <div className="p-4 bg-green-50 rounded-lg mb-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-sm font-bold">💰</span>
                          </div>
                          <p className="font-medium text-green-800">Commission Eligible Services</p>
                        </div>
                        <p className="text-sm text-green-700">
                          You will earn <span className="font-semibold">{formatPrice(calculateTotalCommission())}</span> total commission
                        </p>
                      </div>
                    )}

                    {/* Total */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center text-xl font-bold">
                        <span className="text-gray-800">Total Amount</span>
                        <span className="text-primary-500">{formatPrice(calculateTotalAmount())}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => setCurrentStep('products')}
                      className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors duration-200 border border-gray-200"
                    >
                      Back to Products
                    </button>
                    <button
                      onClick={handleConfirmSale}
                      disabled={isProcessingSale}
                      className="flex-1 py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-soft hover:shadow-elegant"
                    >
                      {isProcessingSale ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      {isProcessingSale ? 'Processing...' : '💰 Confirm Sale'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Receipt */}
              {currentStep === 'receipt' && saleReceipt && (
                <motion.div
                  key="receipt"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="card-elegant"
                >
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Receipt className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Sale Complete!</h2>
                    <p className="text-gray-600">Receipt generated successfully</p>
                  </div>

                  {/* Receipt */}
                  <div className="bg-white rounded-xl p-6 mb-8 max-w-md mx-auto border border-gray-200 shadow-soft">
                    {/* Receipt Header */}
                    <div className="text-center border-b border-gray-200 pb-4 mb-4">
                      <Logo size="lg" className="mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Antilope Centre</p>
                      <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
                    </div>

                    {/* Client Info */}
                    <div className="border-b border-gray-200 pb-4 mb-4">
                      <p className="text-sm text-gray-500 mb-1">Client:</p>
                      <p className="font-medium text-gray-800">{saleReceipt.clientName}</p>
                    </div>

                    {/* Services */}
                    <div className="border-b border-gray-200 pb-4 mb-4">
                      <p className="text-sm text-gray-500 mb-2">Services:</p>
                      <div className="space-y-2">
                        {saleReceipt.services.map((service, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-700">{service.name}</span>
                            <span className="font-medium">{formatPrice(service.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Products */}
                    <div className="border-b border-gray-200 pb-4 mb-4">
                      <p className="text-sm text-gray-500 mb-2">Products Used:</p>
                      <div className="space-y-1">
                        {saleReceipt.products.map((product, index) => (
                          <div key={index} className="flex justify-between text-xs text-gray-600">
                            <span>{product.name}</span>
                            <span>{product.qtyUsed} {product.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="text-center">
                      <div className="flex justify-between items-center text-lg font-bold mb-2">
                        <span className="text-gray-800">Total:</span>
                        <span className="text-primary-500">{formatPrice(saleReceipt.totalAmount)}</span>
                      </div>
                      <p className="text-sm text-gray-500">Payment: {paymentMethod}</p>
                    </div>

                    {/* Thank you message */}
                    <div className="text-center text-sm text-gray-600 border-t border-gray-200 pt-4 mt-4">
                      <p>Thank you for your visit!</p>
                      <p>We look forward to seeing you again.</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 max-w-md mx-auto">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors duration-200 border border-gray-200 flex items-center justify-center gap-2"
                    >
                      <Receipt className="w-4 h-4" />
                      Print Receipt
                    </button>
                    <button
                      onClick={handleNewSale}
                      className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-soft hover:shadow-elegant"
                    >
                      <Plus className="w-4 h-4" />
                      New Sale
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Sidebar - Quick Actions & Info */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
            {/* Quick Actions */}
            <motion.div 
              className="card-elegant"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
              </div>
              <div className="space-y-3">
                <motion.button 
                  className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 shadow-soft hover:shadow-elegant"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Receipt className="w-4 h-4" />
                  View Sales History
                </motion.button>
                <motion.button 
                  className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all duration-200 flex items-center gap-2 border border-gray-200 hover:border-gray-300 shadow-soft hover:shadow-elegant"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <TrendingUp className="w-4 h-4" />
                  View Reports
                </motion.button>
                <motion.button 
                  className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all duration-200 flex items-center gap-2 border border-gray-200 hover:border-gray-300 shadow-soft hover:shadow-elegant"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Send className="w-4 h-4" />
                  Send Receipt
                </motion.button>
              </div>
            </motion.div>

            {/* Current Sale Info */}
            {selectedClient && (
              <motion.div 
                className="card-elegant"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Current Sale</h3>
                </div>
                <div className="space-y-4">
                  <motion.div 
                    className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="text-sm text-gray-500 mb-1 font-medium">Client</p>
                    <p className="font-semibold text-gray-800 text-lg">{selectedClient.name}</p>
                    <p className="text-gray-600 text-sm">{selectedClient.phone}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {selectedClient.totalVisits} visits
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatPrice(selectedClient.totalSpent)}
                      </span>
                    </div>
                  </motion.div>
                  
                  {selectedServices.length > 0 && (
                    <motion.div 
                      className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200"
                      whileHover={{ scale: 1.02 }}
                    >
                      <p className="text-sm text-blue-600 mb-2 font-medium flex items-center gap-1">
                        <Scissors className="w-3 h-3" />
                        Services ({selectedServices.length})
                      </p>
                      <div className="space-y-2">
                        {selectedServices.map((selectedService) => (
                          <div key={selectedService.service.id} className="flex justify-between items-center">
                            <p className="font-medium text-gray-800 text-sm">{selectedService.service.name}</p>
                            <p className="text-primary-600 font-bold text-sm">{formatPrice(selectedService.service.price)}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  
                  <motion.div 
                    className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="text-sm text-primary-600 mb-1 font-medium flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Total Amount
                    </p>
                    <p className="text-3xl font-bold text-primary-600">{formatPrice(calculateTotalAmount())}</p>
                    {calculateTotalCommission() > 0 && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        Commission: {formatPrice(calculateTotalCommission())}
                      </p>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Stock Alerts */}
            {allProductUsages.some(p => p.stockStatus !== 'ok') && (
              <motion.div 
                className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-6 shadow-soft"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-red-700">Stock Alerts</h3>
                </div>
                <div className="space-y-2">
                  {allProductUsages.map((usage) => {
                    if (usage.stockStatus === 'ok') return null;
                    return (
                      <div key={`${usage.serviceId}-${usage.productId}`} className="flex items-center justify-between p-2 bg-white rounded-lg border border-red-200">
                        <span className="text-sm font-medium text-red-700">{usage.product.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          usage.stockStatus === 'low' 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {usage.stockStatus === 'low' ? 'Low stock' : 'Out of stock'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Client Modal */}
      <ClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSave={handleAddClient}
      />
    </div>
  );
};

export default POSInterface;
