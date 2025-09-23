import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Calendar,
  Check,
  Clock,
  AlertCircle,
  Download,
  Plus,
  Filter,
  Search,
  CreditCard,
  Landmark,
  Wallet,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/utils/currency';

interface CommissionPayment {
  id: string;
  staffId: string;
  staffName: string;
  period: string;
  totalCommissions: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'pending' | 'processing' | 'paid' | 'overdue';
  paymentMethod: 'bank_transfer' | 'cash' | 'check' | 'digital_wallet';
  paymentDate?: string;
  dueDate: string;
  notes?: string;
  createdAt: string;
}

const CommissionPayments: React.FC = () => {
  const { t } = useLanguage();
  const [payments, setPayments] = useState<CommissionPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<CommissionPayment | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'bank_transfer' as CommissionPayment['paymentMethod'],
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - in real implementation, this would come from the database
      const mockPayments: CommissionPayment[] = [
        {
          id: '1',
          staffId: '1',
          staffName: 'Sarah Johnson',
          period: 'December 2024',
          totalCommissions: 1250.00,
          paidAmount: 1250.00,
          remainingAmount: 0,
          status: 'paid',
          paymentMethod: 'bank_transfer',
          paymentDate: '2024-01-05',
          dueDate: '2024-01-15',
          notes: 'Paid via direct deposit',
          createdAt: '2024-01-01'
        },
        {
          id: '2',
          staffId: '2',
          staffName: 'Mike Chen',
          period: 'December 2024',
          totalCommissions: 980.50,
          paidAmount: 500.00,
          remainingAmount: 480.50,
          status: 'processing',
          paymentMethod: 'bank_transfer',
          dueDate: '2024-01-15',
          notes: 'Partial payment made',
          createdAt: '2024-01-01'
        },
        {
          id: '3',
          staffId: '3',
          staffName: 'Emma Wilson',
          period: 'December 2024',
          totalCommissions: 1150.75,
          paidAmount: 0,
          remainingAmount: 1150.75,
          status: 'pending',
          paymentMethod: 'bank_transfer',
          dueDate: '2024-01-15',
          createdAt: '2024-01-01'
        },
        {
          id: '4',
          staffId: '4',
          staffName: 'David Brown',
          period: 'November 2024',
          totalCommissions: 850.25,
          paidAmount: 0,
          remainingAmount: 850.25,
          status: 'overdue',
          paymentMethod: 'cash',
          dueDate: '2023-12-15',
          notes: 'Payment overdue - follow up required',
          createdAt: '2023-12-01'
        }
      ];

      setPayments(mockPayments);
    } catch (error) {
      console.error('Error loading commission payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.period.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: CommissionPayment['status']) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: CommissionPayment['status']) => {
    switch (status) {
      case 'paid': return <Check className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'pending': return <Calendar className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPaymentMethodIcon = (method: CommissionPayment['paymentMethod']) => {
    switch (method) {
      case 'bank_transfer': return <Landmark className="w-4 h-4" />;
      case 'cash': return <DollarSign className="w-4 h-4" />;
      case 'check': return <CreditCard className="w-4 h-4" />;
      case 'digital_wallet': return <Wallet className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const handleProcessPayment = (payment: CommissionPayment) => {
    setSelectedPayment(payment);
    setPaymentForm({
      amount: payment.remainingAmount.toString(),
      method: payment.paymentMethod,
      notes: '',
      paymentDate: new Date().toISOString().split('T')[0]
    });
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    if (!selectedPayment) return;

    try {
      const amount = parseFloat(paymentForm.amount);
      const updatedPayment = {
        ...selectedPayment,
        paidAmount: selectedPayment.paidAmount + amount,
        remainingAmount: selectedPayment.remainingAmount - amount,
        status: (selectedPayment.remainingAmount - amount <= 0) ? 'paid' as const : 'processing' as const,
        paymentMethod: paymentForm.method,
        paymentDate: paymentForm.paymentDate,
        notes: paymentForm.notes
      };

      setPayments(prev => prev.map(p => p.id === selectedPayment.id ? updatedPayment : p));
      setShowPaymentModal(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const exportPayments = () => {
    const csvContent = [
      ['Commission Payments Report'],
      ['Generated:', new Date().toLocaleDateString()],
      [''],
      ['Staff Name', 'Period', 'Total Commissions', 'Paid Amount', 'Remaining', 'Status', 'Payment Method', 'Due Date', 'Payment Date'],
      ...filteredPayments.map(payment => [
        payment.staffName,
        payment.period,
        `$${payment.totalCommissions.toFixed(2)}`,
        `$${payment.paidAmount.toFixed(2)}`,
        `$${payment.remainingAmount.toFixed(2)}`,
        payment.status,
        payment.paymentMethod.replace('_', ' '),
        payment.dueDate,
        payment.paymentDate || 'Not paid'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission-payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Commission Payments</h2>
          <p className="text-gray-600">Track and manage commission payments to staff</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportPayments}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Payment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            ${payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.paidAmount, 0).toLocaleString()}
          </p>
          <p className="text-gray-600 text-sm">Total Paid</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card text-center"
        >
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            ${payments.filter(p => p.status === 'pending' || p.status === 'processing').reduce((sum, p) => sum + p.remainingAmount, 0).toLocaleString()}
          </p>
          <p className="text-gray-600 text-sm">Pending</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card text-center"
        >
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            ${payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.remainingAmount, 0).toLocaleString()}
          </p>
          <p className="text-gray-600 text-sm">Overdue</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card text-center"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {formatPrice(payments.reduce((sum, p) => sum + p.totalCommissions, 0))}
          </p>
          <p className="text-gray-600 text-sm">Total Commissions</p>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by staff name or period..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Payments Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Staff</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Period</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Total</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Paid</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Remaining</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Method</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Due Date</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment, index) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-800">{payment.staffName}</p>
                      {payment.notes && (
                        <p className="text-xs text-gray-500 mt-1">{payment.notes}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{payment.period}</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-800">
                    ${payment.totalCommissions.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-green-600 font-medium">
                    ${payment.paidAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-red-600 font-medium">
                    ${payment.remainingAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600">
                      {getPaymentMethodIcon(payment.paymentMethod)}
                      <span className="text-xs">{payment.paymentMethod.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-600">
                    {new Date(payment.dueDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {payment.remainingAmount > 0 && (
                        <button
                          onClick={() => handleProcessPayment(payment)}
                          className="p-1 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                          title="Process Payment"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {selectedPayment ? `Process Payment - ${selectedPayment.staffName}` : 'New Payment'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value as CommissionPayment['paymentMethod'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="digital_wallet">Digital Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Optional notes about this payment..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPayment(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitPayment}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Process Payment
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CommissionPayments;