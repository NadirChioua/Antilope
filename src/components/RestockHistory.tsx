import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  Package,
  Calendar,
  DollarSign,
  User,
  FileText,
  Filter,
  Download,
  X
} from 'lucide-react';
import { productService } from '@/services/database';
import { formatPrice } from '@/utils/currency';
import toast from 'react-hot-toast';

interface RestockRecord {
  id: string;
  productId: string;
  productName: string;
  bottlesAdded: number;
  costPerBottle: number;
  totalCost: number;
  supplier?: string;
  invoiceNumber?: string;
  notes?: string;
  restockDate: string;
  createdAt: string;
}

interface RestockHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
  productName?: string;
}

const RestockHistory: React.FC<RestockHistoryProps> = ({
  isOpen,
  onClose,
  productId,
  productName
}) => {
  const [records, setRecords] = useState<RestockRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadRestockHistory();
    }
  }, [isOpen, productId]);

  const loadRestockHistory = async () => {
    try {
      setLoading(true);
      const data = await productService.getRestockHistory(productId);
      setRecords(data);
    } catch (error) {
      console.error('Error loading restock history:', error);
      toast.error('Failed to load restock history');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSupplier = !filterSupplier || 
      (record.supplier && record.supplier.toLowerCase().includes(filterSupplier.toLowerCase()));
    
    const recordDate = new Date(record.restockDate);
    const matchesDateFrom = !filterDateFrom || recordDate >= new Date(filterDateFrom);
    const matchesDateTo = !filterDateTo || recordDate <= new Date(filterDateTo);
    
    return matchesSupplier && matchesDateFrom && matchesDateTo;
  });

  const totalBottlesAdded = filteredRecords.reduce((sum, record) => sum + record.bottlesAdded, 0);
  const totalCost = filteredRecords.reduce((sum, record) => sum + record.totalCost, 0);
  const uniqueSuppliers = [...new Set(filteredRecords.map(r => r.supplier).filter(Boolean))];

  const exportToCSV = () => {
    const headers = ['Date', 'Product', 'Bottles Added', 'Cost Per Bottle', 'Total Cost', 'Supplier', 'Invoice', 'Notes'];
    const csvData = filteredRecords.map(record => [
      new Date(record.restockDate).toLocaleDateString(),
      record.productName,
      record.bottlesAdded,
      formatPrice(record.costPerBottle),
      formatPrice(record.totalCost),
      record.supplier || '',
      record.invoiceNumber || '',
      record.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restock-history-${productName || 'all-products'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <History className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Restock History
                {productName && (
                  <span className="text-blue-600"> - {productName}</span>
                )}
              </h2>
              <p className="text-sm text-gray-600">
                Track all restocking activities and costs
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

        {/* Summary Stats */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredRecords.length}</div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalBottlesAdded}</div>
              <div className="text-sm text-gray-600">Bottles Added</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatPrice(totalCost)}</div>
              <div className="text-sm text-gray-600">Total Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{uniqueSuppliers.length}</div>
              <div className="text-sm text-gray-600">Suppliers</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                <input
                  type="text"
                  value={filterSupplier}
                  onChange={(e) => setFilterSupplier(e.target.value)}
                  placeholder="Filter by supplier..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilterSupplier('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Clear
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Records List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No restock records found</h3>
              <p className="text-gray-500">
                {records.length === 0 
                  ? 'No restocking activities have been recorded yet.'
                  : 'Try adjusting your filters to see more records.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Package className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{record.productName}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(record.restockDate).toLocaleDateString()}
                            </span>
                            {record.supplier && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {record.supplier}
                              </span>
                            )}
                            {record.invoiceNumber && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {record.invoiceNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-blue-600">{record.bottlesAdded}</div>
                          <div className="text-xs text-gray-600">Bottles Added</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-green-600">{formatPrice(record.costPerBottle)}</div>
                          <div className="text-xs text-gray-600">Cost per Bottle</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-purple-600">{formatPrice(record.totalCost)}</div>
                          <div className="text-xs text-gray-600">Total Cost</div>
                        </div>
                      </div>

                      {record.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-700">{record.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RestockHistory;