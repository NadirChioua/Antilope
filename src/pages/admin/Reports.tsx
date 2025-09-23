import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, DollarSign, Users, Package, Calendar, 
  Search, Filter, Download, Eye, ChevronLeft, ChevronRight,
  SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import Logo from '@/components/Logo';
import { dashboardService, bookingService, saleService, clientService, serviceService, staffService } from '@/services/database';
import { DashboardStats, Sale, Client, Service } from '@/types';
import { formatPrice } from '@/utils/currency';
import toast from 'react-hot-toast';

interface SaleWithDetails extends Sale {
  clientName?: string;
  serviceName?: string;
  staffName?: string;
}

const Reports: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [filteredSales, setFilteredSales] = useState<SaleWithDetails[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof SaleWithDetails>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [dashboardStats, bookingsData, salesData, clientsData, servicesData, staffData] = await Promise.all([
        dashboardService.getStats(),
        bookingService.getAll(),
        saleService.getAll(),
        clientService.getAll(),
        serviceService.getAll(),
        staffService.getAll()
      ]);
      
      setStats(dashboardStats);
      setClients(clientsData);
      setServices(servicesData);
      setStaff(staffData);
      
      // Count pending bookings
      const pending = bookingsData.filter(booking => 
        booking.status === 'pending' || booking.status === 'confirmed'
      ).length;
      setPendingBookings(pending);
      
      // Enhance sales data with related information
      const enhancedSales = salesData.map(sale => {
        const client = clientsData.find(c => c.id === sale.clientId);
        const service = servicesData.find(s => s.id === sale.serviceId);
        const staffMember = staffData.find(s => s.id === sale.staffId);
        
        return {
          ...sale,
          clientName: client?.name || 'Unknown Client',
          serviceName: service?.name || 'Unknown Service',
          staffName: staffMember?.name || 'Unknown Staff'
        };
      });
      
      setSales(enhancedSales);
      setFilteredSales(enhancedSales);
      
    } catch (err) {
      console.error('Error fetching reports data:', err);
      setError('Failed to load reports data');
      toast.error('Failed to load reports data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter and sort sales
  useEffect(() => {
    let filtered = [...sales];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.staffName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(sale => 
        new Date(sale.createdAt) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(sale => 
        new Date(sale.createdAt) <= new Date(dateTo + 'T23:59:59')
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sale => sale.status === statusFilter);
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(sale => sale.paymentMethod === paymentMethodFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'createdAt') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredSales(filtered);
    setCurrentPage(1);
  }, [sales, searchTerm, dateFrom, dateTo, statusFilter, paymentMethodFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = filteredSales.slice(startIndex, startIndex + itemsPerPage);

  // Export functionality
  const exportToCSV = () => {
    const headers = ['Date', 'Client', 'Service', 'Staff', 'Amount', 'Payment Method', 'Status', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredSales.map(sale => [
        new Date(sale.createdAt).toLocaleDateString(),
        sale.clientName,
        sale.serviceName,
        sale.staffName,
        sale.totalAmount,
        sale.paymentMethod,
        sale.status,
        sale.notes?.replace(/,/g, ';') || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Sales report exported successfully');
  };

  // Sort handler
  const handleSort = (field: keyof SaleWithDetails) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Calculate analytics
  const analytics = {
    totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    averageOrderValue: filteredSales.length > 0 ? filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0) / filteredSales.length : 0,
    totalTransactions: filteredSales.length,
    cashSales: filteredSales.filter(sale => sale.paymentMethod === 'cash').length,
    cardSales: filteredSales.filter(sale => sale.paymentMethod === 'card').length,
    transferSales: filteredSales.filter(sale => sale.paymentMethod === 'transfer').length,
    completedSales: filteredSales.filter(sale => sale.status === 'completed').length,
    refundedSales: filteredSales.filter(sale => sale.status === 'refunded').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => fetchAllData()} 
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Logo size="lg" variant="light" />
          <h1 className="text-3xl font-bold text-gray-800 text-elegant">Sales Reports & Analytics</h1>
        </div>
        <p className="text-gray-600 mt-1">Comprehensive sales insights and performance metrics</p>
      </motion.div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center hover:shadow-elegant transition-all duration-200"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatPrice(analytics.totalRevenue)}</p>
          <p className="text-gray-600 text-sm">Total Revenue</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card text-center hover:shadow-elegant transition-all duration-200"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatPrice(analytics.averageOrderValue)}</p>
          <p className="text-gray-600 text-sm">Average Order Value</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card text-center hover:shadow-elegant transition-all duration-200"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{analytics.totalTransactions}</p>
          <p className="text-gray-600 text-sm">Total Transactions</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card text-center hover:shadow-elegant transition-all duration-200"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats?.totalClients || 0}</p>
          <p className="text-gray-600 text-sm">Total Clients</p>
        </motion.div>
      </div>

      {/* Payment Method Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{analytics.cashSales}</p>
            <p className="text-gray-600 text-sm">Cash Payments</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{analytics.cardSales}</p>
            <p className="text-gray-600 text-sm">Card Payments</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{analytics.transferSales}</p>
            <p className="text-gray-600 text-sm">Bank Transfers</p>
          </div>
        </div>
      </motion.div>

      {/* Filters and Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Sales Transactions</h3>
          <div className="flex gap-2">
            <button
              onClick={fetchAllData}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input"
            placeholder="From Date"
          />
          
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input"
            placeholder="To Date"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
          </select>
          
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="transfer">Transfer</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setDateFrom('');
              setDateTo('');
              setStatusFilter('all');
              setPaymentMethodFilter('all');
            }}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        </div>

        {/* Sales Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {sortField === 'createdAt' && (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('clientName')}
                >
                  <div className="flex items-center gap-1">
                    Client
                    {sortField === 'clientName' && (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('serviceName')}
                >
                  <div className="flex items-center gap-1">
                    Service
                    {sortField === 'serviceName' && (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('staffName')}
                >
                  <div className="flex items-center gap-1">
                    Staff
                    {sortField === 'staffName' && (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalAmount')}
                >
                  <div className="flex items-center gap-1">
                    Amount
                    {sortField === 'totalAmount' && (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('paymentMethod')}
                >
                  <div className="flex items-center gap-1">
                    Payment
                    {sortField === 'paymentMethod' && (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSales.map((sale, index) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.clientName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.serviceName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.staffName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatPrice(sale.totalAmount)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                      sale.paymentMethod === 'card' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      sale.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => setSelectedSale(sale)}
                      className="text-primary-600 hover:text-primary-900 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredSales.length)} of {filteredSales.length} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === page
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Sale Details</h3>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">{new Date(selectedSale.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sale ID</p>
                <p className="font-medium">{selectedSale.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Client</p>
                <p className="font-medium">{selectedSale.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Service</p>
                <p className="font-medium">{selectedSale.serviceName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Staff Member</p>
                <p className="font-medium">{selectedSale.staffName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-medium text-lg">{formatPrice(selectedSale.totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium">{selectedSale.paymentMethod.charAt(0).toUpperCase() + selectedSale.paymentMethod.slice(1)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedSale.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedSale.status.charAt(0).toUpperCase() + selectedSale.status.slice(1)}
                </span>
              </div>
            </div>
            
            {selectedSale.notes && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">Notes</p>
                <p className="font-medium">{selectedSale.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
