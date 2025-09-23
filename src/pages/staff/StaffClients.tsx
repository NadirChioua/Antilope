import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Phone, Calendar, Search, Plus } from 'lucide-react';
import Logo from '@/components/Logo';
import { clientService } from '@/services/database';
import { Client } from '@/types';
import toast from 'react-hot-toast';
import { formatPrice } from '@/utils/currency';

const StaffClients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true);
        const clientsData = await clientService.getAll();
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast.error('Failed to load clients');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Logo size="lg" variant="light" />
          <h1 className="text-3xl font-bold text-gray-800 text-elegant">Client History</h1>
        </div>
        <p className="text-gray-600 mt-1">View your client interactions and history</p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search clients by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-soft"
          />
        </div>
      </motion.div>
      
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredClients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-12"
          >
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No clients found</h3>
            <p className="text-gray-500">Try adjusting your search terms</p>
          </motion.div>
        ) : (
          filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:shadow-elegant transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{client.name}</h3>
                  <div className="flex items-center gap-6 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {client.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Last: {client.lastVisit}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {client.totalVisits} visits
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-primary-600">
                      Total Spent: {formatPrice(client.totalSpent)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    <div className="font-medium text-gray-800">{client.totalVisits} visits</div>
                    <div>{formatPrice(client.totalSpent)}</div>
                  </div>
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
        transition={{ delay: 0.3 }}
        className="card"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex gap-3">
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Client
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Users className="w-4 h-4" />
            View All Clients
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default StaffClients;
