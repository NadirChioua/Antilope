import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Clock,
  User,
  Scissors,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Booking, Client, Service } from '@/types';
import Logo from '@/components/Logo';
import { useLanguage } from '@/contexts/LanguageContext';
import { clientService, serviceService, staffService } from '@/services/database';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { formatPrice } from '@/utils/currency';

const Bookings: React.FC = () => {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    clientId: '',
    serviceId: '',
    staffId: '',
    date: '',
    time: '',
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch bookings from Supabase
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .order('start_at', { ascending: false });

        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
          toast.error('Failed to fetch bookings');
        } else {
          const formattedBookings: Booking[] = bookingsData.map(booking => {
            // Handle both old and new field names for backward compatibility
            const startAt = booking.startAt || booking.start_at;
            const clientId = booking.clientId || booking.client_id;
            const serviceId = booking.serviceId || booking.service_id;
            const staffId = booking.staffId || booking.staff_id;
            const createdAt = booking.createdAt || booking.created_at;
            const updatedAt = booking.updatedAt || booking.updated_at;
            
            return {
              id: booking.id,
              clientId: clientId,
              serviceId: serviceId,
              staffId: staffId,
              date: startAt ? startAt.split('T')[0] : booking.date,
              time: startAt ? startAt.split('T')[1].substring(0, 5) : booking.time,
              duration: booking.duration || 60,
              status: booking.status,
              notes: booking.notes || '',
              createdAt: createdAt,
              updatedAt: updatedAt,
            };
          });
          setBookings(formattedBookings);
          setFilteredBookings(formattedBookings);
        }

        // Fetch clients, services, and staff
        const [clientsData, servicesData, staffData] = await Promise.all([
          clientService.getAll(),
          serviceService.getAll(),
          staffService.getAll()
        ]);

        setClients(clientsData);
        setServices(servicesData);
        setStaff(staffData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [t]);

  useEffect(() => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking => {
        const client = clients.find(c => c.id === booking.clientId);
        const service = services.find(s => s.id === booking.serviceId);
        return (
          client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.date.includes(searchTerm) ||
          booking.time.includes(searchTerm)
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  }, [searchTerm, statusFilter, bookings, clients, services]);

  const handleCreateBooking = async () => {
    if (!formData.clientId || !formData.serviceId || !formData.staffId || !formData.date || !formData.time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const selectedService = services.find(s => s.id === formData.serviceId);
      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = new Date(startDateTime.getTime() + (selectedService?.duration || 60) * 60000);

      const bookingData = {
        clientId: formData.clientId,
        serviceId: formData.serviceId,
        staffId: formData.staffId,
        date: formData.date,
        time: formData.time,
        duration: selectedService?.duration || 60,
        startAt: startDateTime.toISOString(),
        endAt: endDateTime.toISOString(),
        status: 'pending',
        notes: formData.notes
      };

      // Debug logging
      console.log('🔍 Admin Booking Creation - Staff ID being saved:', bookingData.staffId);
      console.log('🔍 Admin Booking Creation - Available staff:', staff);
      console.log('🔍 Admin Booking Creation - Selected staff member:', staff.find(s => s.id === formData.staffId));

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          client_id: bookingData.clientId,
          service_id: bookingData.serviceId,
          staff_id: bookingData.staffId,
          date: bookingData.date,
          time: bookingData.time,
          duration: bookingData.duration,
          start_at: bookingData.startAt,
          end_at: bookingData.endAt,
          status: bookingData.status,
          notes: bookingData.notes,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        toast.error('Failed to create booking');
        return;
      }

      // Add the new booking to the local state
      const newBooking: Booking = {
        id: data.id,
        clientId: data.client_id,
        serviceId: data.service_id,
        staffId: data.staff_id,
        date: data.start_at.split('T')[0],
        time: data.start_at.split('T')[1].substring(0, 5),
        duration: selectedService?.duration || 60,
        status: data.status,
        notes: data.notes || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setBookings(prev => [newBooking, ...prev]);
      setFilteredBookings(prev => [newBooking, ...prev]);
      
      // Reset form and close modal
      setFormData({
        clientId: '',
        serviceId: '',
        staffId: '',
        date: '',
        time: '',
        notes: ''
      });
      setShowAddModal(false);
      toast.success('Booking created successfully');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking');
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setFormData({
      clientId: booking.clientId,
      serviceId: booking.serviceId,
      staffId: booking.staffId,
      date: booking.date,
      time: booking.time,
      notes: booking.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateBooking = async () => {
    if (!editingBooking) return;

    try {
      const selectedService = services.find(s => s.id === formData.serviceId);
      if (!selectedService) {
        toast.error('Please select a service');
        return;
      }

      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = new Date(startDateTime.getTime() + (selectedService.duration * 60000));

      const { error } = await supabase
        .from('bookings')
        .update({
          client_id: formData.clientId,
          service_id: formData.serviceId,
          staff_id: formData.staffId,
          date: formData.date,
          time: formData.time,
          duration: selectedService.duration,
          start_at: startDateTime.toISOString(),
          end_at: endDateTime.toISOString(),
          notes: formData.notes,
        })
        .eq('id', editingBooking.id);

      if (error) {
        console.error('Error updating booking:', error);
        toast.error('Failed to update booking');
        return;
      }

      // Update local state
      const updatedBooking: Booking = {
        ...editingBooking,
        clientId: formData.clientId,
        serviceId: formData.serviceId,
        staffId: formData.staffId,
        date: formData.date,
        time: formData.time,
        duration: selectedService.duration,
        notes: formData.notes,
        updatedAt: new Date().toISOString(),
      };

      setBookings(prev => prev.map(b => b.id === editingBooking.id ? updatedBooking : b));
      setFilteredBookings(prev => prev.map(b => b.id === editingBooking.id ? updatedBooking : b));
      
      setShowEditModal(false);
      setEditingBooking(null);
      setFormData({
        clientId: '',
        serviceId: '',
        staffId: '',
        date: '',
        time: '',
        notes: ''
      });
      toast.success('Booking updated successfully');
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) {
        console.error('Error deleting booking:', error);
        toast.error('Failed to delete booking');
        return;
      }

      setBookings(prev => prev.filter(b => b.id !== bookingId));
      setFilteredBookings(prev => prev.filter(b => b.id !== bookingId));
      toast.success('Booking deleted successfully');
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Failed to delete booking');
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
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
          <h1 className="text-3xl font-bold text-gray-800 text-elegant">{t('bookings.title')}</h1>
        </div>
        <p className="text-gray-600 mt-1">{t('bookings.subtitle')}</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center hover:shadow-elegant transition-all duration-200"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{bookings.length}</p>
          <p className="text-gray-600 text-sm">{t('bookings.totalBookings')}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card text-center hover:shadow-elegant transition-all duration-200"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {bookings.filter(b => b.status === 'confirmed').length}
          </p>
          <p className="text-gray-600 text-sm">{t('bookings.confirmed')}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card text-center hover:shadow-elegant transition-all duration-200"
        >
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {bookings.filter(b => b.status === 'pending').length}
          </p>
          <p className="text-gray-600 text-sm">{t('bookings.pending')}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card text-center hover:shadow-elegant transition-all duration-200"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {bookings.filter(b => b.status === 'completed').length}
          </p>
          <p className="text-gray-600 text-sm">{t('bookings.completed')}</p>
        </motion.div>
      </div>

      {/* Search and Filters */}
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
              placeholder={t('bookings.searchBookings')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">{t('bookings.allStatus')}</option>
            <option value="pending">{t('bookings.pending')}</option>
            <option value="confirmed">{t('bookings.confirmed')}</option>
            <option value="completed">{t('bookings.completed')}</option>
            <option value="cancelled">{t('bookings.cancelled')}</option>
          </select>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('bookings.newBooking')}
          </button>
        </div>
      </motion.div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card text-center py-12"
          >
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">{t('bookings.noBookingsFound')}</h3>
            <p className="text-gray-500">{t('bookings.tryAdjustingFilters')}</p>
          </motion.div>
        ) : (
          filteredBookings.map((booking, index) => {
            const client = clients.find(c => c.id === booking.clientId);
            const service = services.find(s => s.id === booking.serviceId);
            
            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card hover:shadow-elegant transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gray-800">{client?.name}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-600">{service?.name}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-600">{booking.time}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {booking.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {t('bookings.staff')} ID: {booking.staffId}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      {t(`bookings.${booking.status}`)}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditBooking(booking)}
                        className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit booking"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleViewDetails(booking)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete booking"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Booking Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{t('bookings.newBooking')}</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('bookings.client')} *
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">{t('bookings.selectClient')}</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('bookings.service')} *
                  </label>
                  <select
                    value={formData.serviceId}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">{t('bookings.selectService')}</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {service.duration}min - {formatPrice(service.price)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Staff Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('bookings.staff')} *
                  </label>
                  <select
                    value={formData.staffId}
                    onChange={(e) => setFormData(prev => ({ ...prev, staffId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">{t('bookings.selectStaff')}</option>
                    {staff.map(staffMember => (
                      <option key={staffMember.id} value={staffMember.id}>
                        {staffMember.name} - {staffMember.role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('bookings.date')} *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('bookings.time')} *
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('bookings.notes')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={t('bookings.notesPlaceholder')}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateBooking}
                  className="btn-primary flex-1"
                >
                  {t('bookings.createBooking')}
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary flex-1"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditModal && editingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit Booking</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('bookings.client')} *
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">{t('bookings.selectClient')}</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('bookings.service')} *
                  </label>
                  <select
                    value={formData.serviceId}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">{t('bookings.selectService')}</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {service.duration}min - ${service.price}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Staff Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('bookings.staff')} *
                  </label>
                  <select
                    value={formData.staffId}
                    onChange={(e) => setFormData(prev => ({ ...prev, staffId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">{t('bookings.selectStaff')}</option>
                    {staff.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('bookings.date')} *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('bookings.time')} *
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('bookings.notes')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={t('bookings.notesPlaceholder')}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateBooking}
                  className="btn-primary flex-1"
                >
                  Update Booking
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary flex-1"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Client Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Client Information
                  </h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {clients.find(c => c.id === selectedBooking.clientId)?.name || 'Unknown'}</p>
                    <p><span className="font-medium">Phone:</span> {clients.find(c => c.id === selectedBooking.clientId)?.phone || 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {clients.find(c => c.id === selectedBooking.clientId)?.email || 'N/A'}</p>
                  </div>
                </div>

                {/* Service Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Scissors className="w-5 h-5 mr-2" />
                    Service Information
                  </h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Service:</span> {services.find(s => s.id === selectedBooking.serviceId)?.name || 'Unknown'}</p>
                    <p><span className="font-medium">Duration:</span> {selectedBooking.duration} minutes</p>
                    <p><span className="font-medium">Price:</span> ${services.find(s => s.id === selectedBooking.serviceId)?.price || 'N/A'}</p>
                  </div>
                </div>

                {/* Appointment Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Appointment Information
                  </h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Date:</span> {new Date(selectedBooking.date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Time:</span> {selectedBooking.time}</p>
                    <p><span className="font-medium">Staff:</span> {staff.find(s => s.id === selectedBooking.staffId)?.name || 'Unknown'}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedBooking.status)}`}>
                        {getStatusIcon(selectedBooking.status)}
                        <span className="ml-1">{t(`bookings.status.${selectedBooking.status}`)}</span>
                      </span>
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {selectedBooking.notes && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
                    <p className="text-gray-700">{selectedBooking.notes}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Timestamps</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">Created:</span> {new Date(selectedBooking.createdAt).toLocaleString()}</p>
                    <p><span className="font-medium">Updated:</span> {new Date(selectedBooking.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEditBooking(selectedBooking);
                  }}
                  className="btn-primary flex-1"
                >
                  Edit Booking
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
