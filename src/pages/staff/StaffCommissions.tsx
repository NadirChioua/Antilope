import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  CheckCircle,
  Clock,
  Eye,
  BarChart3,
  PieChart,
  FileText,
  CreditCard,
  Target,
  Award
} from 'lucide-react';
import { commissionService } from '@/services/database';
import { Commission } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/utils/currency';
import toast from 'react-hot-toast';

interface CommissionWithDetails extends Commission {
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

interface MonthlyData {
  month: string;
  totalCommissions: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

const StaffCommissions: React.FC = () => {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<CommissionWithDetails[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [yearlyTotal, setYearlyTotal] = useState({
    totalCommissions: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCommission, setSelectedCommission] = useState<CommissionWithDetails | null>(null);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    if (user?.id) {
      fetchCommissionData();
    }
  }, [user?.id, selectedYear]);

  const fetchCommissionData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [commissionsData, summaryData] = await Promise.all([
        commissionService.getByStaffId(user.id),
        commissionService.getStaffCommissionSummary(user.id, selectedYear)
      ]);

      setCommissions(commissionsData);
      setMonthlyData(summaryData.monthlyData);
      setYearlyTotal(summaryData.yearlyTotal);
    } catch (error) {
      toast.error('Failed to load commission data');
      console.error('Error fetching commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCommissionStatement = () => {
    const csvData = commissions.map(commission => ({
      'Date': new Date(commission.createdAt).toLocaleDateString(),
      'Service': commission.services?.name || 'N/A',
      'Sale Amount': commission.sales?.total_amount || 0,
      'Commission Rate': commission.commissionPercentage + '%',
      'Commission Amount': commission.commissionAmount,
      'Status': commission.status,
      'Payment Method': commission.sales?.payment_method || 'N/A',
      'Paid Date': commission.paidAt ? new Date(commission.paidAt).toLocaleDateString() : 'Pending'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission-statement-${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: Clock }
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

  // Calculate current month stats
  const currentMonth = new Date().getMonth();
  const currentMonthData = monthlyData[currentMonth] || {
    totalCommissions: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0
  };

  // Pagination
  const totalPages = Math.ceil(commissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCommissions = commissions.slice(startIndex, endIndex);

  // Get top performing months
  const topMonths = [...monthlyData]
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 3);

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
            <h1 className="text-3xl font-bold text-gray-900">My Commissions</h1>
            <p className="text-gray-600 mt-2">Track your earnings and commission history</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
            <button
              onClick={exportCommissionStatement}
              className="flex items-center px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Statement
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earned ({selectedYear})</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(yearlyTotal.totalAmount || 0)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">{formatPrice(yearlyTotal.paidAmount || 0)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-yellow-600">{formatPrice(yearlyTotal.pendingAmount || 0)}</p>
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
              <p className="text-2xl font-bold text-blue-600">{formatPrice(currentMonthData.totalAmount || 0)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Earnings Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Earnings</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {monthlyData.slice(0, 6).map((month, index) => (
              <div key={month.month} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700">{month.month}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatPrice(month.totalAmount || 0)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {month.totalCommissions} commissions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Months */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Months</h3>
            <Award className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {topMonths.map((month, index) => (
              <div key={month.month} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{month.month}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatPrice(month.totalAmount || 0)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {month.totalCommissions} commissions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commission History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Commission History</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {commissions.length} total commissions
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentCommissions.map((commission) => (
                <tr key={commission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(commission.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(commission.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {commission.services?.name || 'Unknown Service'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Base price: {formatPrice(commission.services?.price || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(commission.sales?.total_amount || 0)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {commission.sales?.payment_method || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(commission.commissionAmount || 0)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(commission.commissionPercentage || 0)}% rate
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(commission.status)}
                  </td>
                  <td className="px-6 py-4">
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
                  <span className="font-medium">{Math.min(endIndex, commissions.length)}</span> of{' '}
                  <span className="font-medium">{commissions.length}</span> results
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                  <p className="text-sm text-gray-900">{selectedCommission.services?.name}</p>
                  <p className="text-xs text-gray-500">Base price: {formatPrice(selectedCommission.services?.price || 0)}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Amount</label>
                    <p className="text-sm text-gray-900">{formatPrice(selectedCommission.sales?.total_amount || 0)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate</label>
                    <p className="text-sm text-gray-900">{(selectedCommission.commissionPercentage || 0)}%</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commission Amount</label>
                    <p className="text-lg font-bold text-green-600">{formatPrice(selectedCommission.commissionAmount || 0)}</p>
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffCommissions;
