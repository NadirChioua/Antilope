import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MoreHorizontal,
  RefreshCw,
  CreditCard,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { commissionService, staffService } from '@/services/database';
import { Commission } from '@/types';
import toast from 'react-hot-toast';

interface CommissionWithDetails extends Commission {
  users?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  sales?: {
    id: string;
    total_amount: number;
    created_at: string;
    payment_method: string;
    status: string;
  };
  services?: {
    id: string;
    name: string;
    price: number;
    commission_percent: number;
  };
}

interface CommissionStats {
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  thisMonthCommissions: number;
  thisMonthAmount: number;
  averageCommissionRate: number;
}

const Commissions: React.FC = () => {
  const [commissions, setCommissions] = useState<CommissionWithDetails[]>([]);
  const [filteredCommissions, setFilteredCommissions] = useState<CommissionWithDetails[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [stats, setStats] = useState<CommissionStats>({
    totalCommissions: 0,
    paidCommissions: 0,
    pendingCommissions: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    thisMonthCommissions: 0,
    thisMonthAmount: 0,
    averageCommissionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<CommissionWithDetails | null>(null);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    fetchCommissionData();
  }, []);

  useEffect(() => {
    filterCommissions();
  }, [commissions, searchTerm, statusFilter, staffFilter, dateRange]);

  const fetchCommissionData = async () => {
    setLoading(true);
    try {
      const [commissionsData, staffData] = await Promise.all([
        commissionService.getAll(),
        staffService.getAll()
      ]);

      setCommissions(commissionsData);
      setStaff(staffData);
      calculateStats(commissionsData);
    } catch (error) {
      toast.error('Failed to load commission data');
      console.error('Error fetching commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (commissionsData: CommissionWithDetails[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthCommissions = commissionsData.filter(c => {
      const commissionDate = new Date(c.createdAt);
      return commissionDate.getMonth() === currentMonth && 
             commissionDate.getFullYear() === currentYear;
    });

    const paidCommissions = commissionsData.filter(c => c.status === 'paid');
    const pendingCommissions = commissionsData.filter(c => c.status === 'pending');

    const totalAmount = commissionsData.reduce((sum, c) => sum + c.commissionAmount, 0);
    const paidAmount = paidCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const pendingAmount = pendingCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const thisMonthAmount = thisMonthCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    
    const averageCommissionRate = commissionsData.length > 0 
      ? commissionsData.reduce((sum, c) => sum + c.commissionPercentage, 0) / commissionsData.length
      : 0;

    setStats({
      totalCommissions: commissionsData.length,
      paidCommissions: paidCommissions.length,
      pendingCommissions: pendingCommissions.length,
      totalAmount,
      paidAmount,
      pendingAmount,
      thisMonthCommissions: thisMonthCommissions.length,
      thisMonthAmount,
      averageCommissionRate
    });
  };

  const filterCommissions = () => {
    let filtered = [...commissions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(commission =>
        commission.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commission.services?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commission.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(commission => commission.status === statusFilter);
    }

    // Staff filter
    if (staffFilter !== 'all') {
      filtered = filtered.filter(commission => commission.staffId === staffFilter);
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      filtered = filtered.filter(commission => {
        const commissionDate = new Date(commission.createdAt);
        return commissionDate >= startDate && commissionDate <= endDate;
      });
    }

    setFilteredCommissions(filtered);
    setCurrentPage(1);
  };

  const handleBulkAction = async (action: 'markPaid' | 'cancel') => {
    if (selectedCommissions.length === 0) {
      toast.error('Please select commissions first');
      return;
    }

    try {
      if (action === 'markPaid') {
        await commissionService.markMultipleAsPaid(selectedCommissions);
        toast.success(`${selectedCommissions.length} commissions marked as paid`);
      } else if (action === 'cancel') {
        for (const id of selectedCommissions) {
          await commissionService.cancelCommission(id);
        }
        toast.success(`${selectedCommissions.length} commissions cancelled`);
      }
      
      setSelectedCommissions([]);
      fetchCommissionData();
    } catch (error) {
      toast.error(`Failed to ${action} commissions`);
      console.error(`Error ${action} commissions:`, error);
    }
  };

  const exportCommissions = () => {
    const csvData = filteredCommissions.map(commission => ({
      'Commission ID': commission.id,
      'Staff Name': commission.users?.name || 'Unknown',
      'Service': commission.services?.name || 'Unknown',
      'Sale Amount': commission.sales?.total_amount || 0,
      'Commission Rate': commission.commissionPercentage + '%',
      'Commission Amount': commission.commissionAmount,
      'Status': commission.status,
      'Created Date': new Date(commission.createdAt).toLocaleDateString(),
      'Paid Date': commission.paidAt ? new Date(commission.paidAt).toLocaleDateString() : 'N/A'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Pagination
  const totalPages = Math.ceil(filteredCommissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCommissions = filteredCommissions.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Commission Management</h1>
            <p className="text-gray-600 mt-2">Manage staff commissions and payments</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </button>
            <button
              onClick={exportCommissions}
              className="flex items-center px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={fetchCommissionData}
              className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCommissions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">${(stats.totalAmount || 0).toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-yellow-600">${(stats.pendingAmount || 0).toFixed(2)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-blue-600">${(stats.thisMonthAmount || 0).toFixed(2)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by staff, service, or ID..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Staff Member</label>
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Staff</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedCommissions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">
                {selectedCommissions.length} commission(s) selected
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleBulkAction('markPaid')}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Mark as Paid
              </button>
              <button
                onClick={() => handleBulkAction('cancel')}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setSelectedCommissions([])}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commission Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Commission History</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {filteredCommissions.length} of {commissions.length} commissions
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCommissions.length === currentCommissions.length && currentCommissions.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCommissions(currentCommissions.map(c => c.id));
                      } else {
                        setSelectedCommissions([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sale Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentCommissions.map((commission) => (
                <tr key={commission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCommissions.includes(commission.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCommissions([...selectedCommissions, commission.id]);
                        } else {
                          setSelectedCommissions(selectedCommissions.filter(id => id !== commission.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-gray-600">
                          {commission.users?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {commission.users?.name || 'Unknown Staff'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {commission.users?.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {commission.services?.name || 'Unknown Service'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Base price: ${commission.services?.price?.toFixed(2) || '0.00'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      ${commission.sales?.total_amount?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {commission.sales?.payment_method || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      ${(commission.commissionAmount || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(commission.commissionPercentage || 0)}% rate
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(commission.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(commission.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(commission.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCommission(commission);
                          setShowCommissionModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {commission.status === 'pending' && (
                        <button
                          onClick={() => handleBulkAction('markPaid')}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Mark as Paid"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredCommissions.length)}</span> of{' '}
                  <span className="font-medium">{filteredCommissions.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Commission Details Modal */}
      {showCommissionModal && selectedCommission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Commission Details</h3>
                <button
                  onClick={() => setShowCommissionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commission ID</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedCommission.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    {getStatusBadge(selectedCommission.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                    <p className="text-sm text-gray-900">{selectedCommission.users?.name}</p>
                    <p className="text-xs text-gray-500">{selectedCommission.users?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                    <p className="text-sm text-gray-900">{selectedCommission.services?.name}</p>
                    <p className="text-xs text-gray-500">Base price: ${selectedCommission.services?.price?.toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Amount</label>
                    <p className="text-sm text-gray-900">${selectedCommission.sales?.total_amount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate</label>
                    <p className="text-sm text-gray-900">{(selectedCommission.commissionPercentage || 0)}%</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commission Amount</label>
                    <p className="text-lg font-bold text-green-600">${(selectedCommission.commissionAmount || 0).toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date</label>
                    <p className="text-sm text-gray-900">{new Date(selectedCommission.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <p className="text-sm text-gray-900">{selectedCommission.sales?.payment_method || 'N/A'}</p>
                  </div>
                </div>

                {selectedCommission.paidAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paid Date</label>
                    <p className="text-sm text-gray-900">{new Date(selectedCommission.paidAt).toLocaleString()}</p>
                  </div>
                )}

                {selectedCommission.status === 'pending' && (
                  <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        handleBulkAction('markPaid');
                        setShowCommissionModal(false);
                      }}
                      className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Mark as Paid
                    </button>
                    <button
                      onClick={() => {
                        handleBulkAction('cancel');
                        setShowCommissionModal(false);
                      }}
                      className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Cancel Commission
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Commissions;
