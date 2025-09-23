import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  MoreVertical,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { Client } from '@/types';
import Logo from '@/components/Logo';
import ClientModal from '@/components/ClientModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { clientService } from '@/services/database';
import { formatPrice } from '@/utils/currency';
import toast from 'react-hot-toast';

const Clients: React.FC = () => {
  const { t } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const clientsData = await clientService.getAll();
        setClients(clientsData);
        setFilteredClients(clientsData);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load clients');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const handleAddClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newClient = await clientService.create(clientData);
      if (newClient) {
        setClients([newClient, ...clients]);
        setFilteredClients([newClient, ...filteredClients]);
        setShowAddModal(false);
      }
    } catch (err) {
      console.error('Error adding client:', err);
    }
  };

  const handleEditClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'totalVisits' | 'totalSpent'>) => {
    if (!editingClient) return;
    
    try {
      const updatedClient = await clientService.update(editingClient.id, {
        ...clientData,
        id: editingClient.id,
        createdAt: editingClient.createdAt,
        updatedAt: new Date().toISOString(),
        totalVisits: editingClient.totalVisits,
        totalSpent: editingClient.totalSpent,
      });
      if (updatedClient) {
        setClients(clients.map(c => c.id === editingClient.id ? updatedClient : c));
        setFilteredClients(filteredClients.map(c => c.id === editingClient.id ? updatedClient : c));
        setEditingClient(null);
      }
    } catch (err) {
      console.error('Error updating client:', err);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const success = await clientService.delete(clientId);
      if (success) {
        setClients(clients.filter(c => c.id !== clientId));
        setFilteredClients(filteredClients.filter(c => c.id !== clientId));
      }
    } catch (err) {
      console.error('Error deleting client:', err);
    }
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
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Logo size="lg" variant="light" />
          <h1 className="text-3xl font-bold text-gray-800 text-elegant">{t('clients.title')}</h1>
        </div>
        <p className="text-gray-600 mt-1">{t('clients.subtitle')}</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center hover:shadow-elegant transition-all duration-200"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{clients.length}</p>
          <p className="text-gray-600 text-sm">{t('clients.totalClients')}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card text-center hover:shadow-elegant transition-all duration-200"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {clients.filter(c => c.lastVisit && new Date(c.lastVisit) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
          </p>
          <p className="text-gray-600 text-sm">{t('clients.activeThisMonth')}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card text-center hover:shadow-elegant transition-all duration-200"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {formatPrice(clients.reduce((sum, c) => sum + c.totalSpent, 0))}
          </p>
          <p className="text-gray-600 text-sm">{t('clients.totalRevenue')}</p>
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
          <p className="text-2xl font-bold text-gray-800">
            {Math.round(clients.reduce((sum, c) => sum + c.totalVisits, 0) / clients.length)}
          </p>
          <p className="text-gray-600 text-sm">{t('clients.avgVisitsPerClient')}</p>
        </motion.div>
      </div>

      {/* Search and Add */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('clients.searchClients')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('clients.addClient')}
          </button>
        </div>
      </motion.div>

      {/* Clients List */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card text-center py-12"
          >
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">{t('clients.noClientsFound')}</h3>
            <p className="text-gray-500">{t('clients.tryAdjustingSearch')}</p>
          </motion.div>
        ) : (
          filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:shadow-elegant transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{client.name}</h3>
                  <div className="flex items-center gap-6 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {client.phone}
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {client.email}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {t('clients.lastVisit')}: {client.lastVisit}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {client.totalVisits} {t('common.visits')}
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-primary-600">
                      {t('clients.totalSpent')}: {formatPrice(client.totalSpent)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    <div className="font-medium text-gray-800">{client.totalVisits} {t('common.visits')}</div>
                    <div>{formatPrice(client.totalSpent)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingClient(client)}
                    className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClient(client.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('clients.quickActions')}</h2>
        <div className="flex gap-3">
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t('clients.addNewClient')}
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t('clients.viewAllClients')}
          </button>
        </div>
      </motion.div>

      {/* Add/Edit Client Modal */}
      <ClientModal
        isOpen={showAddModal || !!editingClient}
        onClose={() => {
          setShowAddModal(false);
          setEditingClient(null);
        }}
        onSave={editingClient ? handleEditClient : handleAddClient}
        editingClient={editingClient}
      />
    </div>
  );
};

export default Clients;
