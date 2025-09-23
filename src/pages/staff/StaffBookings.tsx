import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  Scissors,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Timer,
  DollarSign,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { formatPrice } from '@/utils/currency';

interface Booking {
  id: string;
  clientId: string;
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  clients?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  services?: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
}

const StaffBookings: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchBookings = async () => {
    console.log('🚀 fetchBookings called');
    console.log('🔍 User state:', user);
    console.log('🔍 User ID:', user?.id);
    
    if (!user?.id) {
      console.log('❌ No user ID found, returning early');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('⏳ Setting loading to true');
      
      // Debug logging
      console.log('🔍 Staff Dashboard - Current user ID:', user.id);
      console.log('🔍 Staff Dashboard - User object:', user);
      console.log('🔍 About to query bookings with staff_id:', user.id);
      
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          clients:client_id (id, name, phone, email),
          services:service_id (id, name, price, duration)
        `)
        .eq('staff_id', user.id)
        .order('start_at', { ascending: true });
      
      console.log('🔍 Staff Dashboard - Raw bookings query result:', bookingsData);
      console.log('🔍 Staff Dashboard - Query error:', error);
      console.log('🔍 Staff Dashboard - Number of bookings found:', bookingsData?.length || 0);

      if (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Failed to fetch your bookings');
        return;
      }

      const formattedBookings: Booking[] = bookingsData.map(booking => ({
        id: booking.id,
        clientId: booking.client_id,
        serviceId: booking.service_id,
        staffId: booking.staff_id,
        date: booking.start_at ? new Date(booking.start_at).toISOString().split('T')[0] : '',
        time: booking.start_at ? new Date(booking.start_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }) : '',
        status: booking.status,
        notes: booking.notes,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
        clients: booking.clients ? {
          id: booking.clients.id,
          name: booking.clients.name,
          phone: booking.clients.phone,
          email: booking.clients.email,
        } : undefined,
        services: booking.services ? {
          id: booking.services.id,
          name: booking.services.name,
          price: booking.services.price,
          duration: booking.services.duration,
        } : undefined,
      }));

      console.log('📋 Formatted bookings:', formattedBookings);
      console.log('📊 Setting bookings state with', formattedBookings.length, 'items');
      
      setBookings(formattedBookings);
      setFilteredBookings(formattedBookings);
      
      console.log('✅ Bookings state updated successfully');
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      console.log('🏁 Setting loading to false');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect triggered - user?.id changed:', user?.id);
    fetchBookings();
  }, [user?.id]);

  useEffect(() => {
    console.log('🔍 Filtering bookings - Initial count:', bookings.length);
    console.log('🔍 Filter settings:', { dateFilter, statusFilter, searchTerm });
    console.log('🔍 Raw bookings:', bookings);
    
    let filtered = bookings;

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      console.log('📅 Date filtering - Today:', todayStr, 'Filter:', dateFilter);
      
      const beforeDateFilter = filtered.length;
      filtered = filtered.filter(booking => {
        const bookingDate = booking.date;
        console.log('📅 Checking booking date:', bookingDate, 'vs today:', todayStr);
        
        switch (dateFilter) {
          case 'today':
            return bookingDate === todayStr;
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return bookingDate === tomorrow.toISOString().split('T')[0];
          case 'week':
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return new Date(booking.date) >= today && new Date(booking.date) <= weekFromNow;
          case 'past':
            return new Date(booking.date) < today;
          default:
            return true;
        }
      });
      console.log('📅 After date filter:', beforeDateFilter, '->', filtered.length);
    }

    // Status filter
    if (statusFilter !== 'all') {
      const beforeStatusFilter = filtered.length;
      console.log('📊 Status filtering:', statusFilter);
      filtered = filtered.filter(booking => {
        console.log('📊 Checking booking status:', booking.status, 'vs filter:', statusFilter);
        return booking.status === statusFilter;
      });
      console.log('📊 After status filter:', beforeStatusFilter, '->', filtered.length);
    }

    // Search filter
    if (searchTerm) {
      const beforeSearchFilter = filtered.length;
      console.log('🔎 Search filtering:', searchTerm);
      filtered = filtered.filter(booking => {
        const matches = booking.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.services?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.notes?.toLowerCase().includes(searchTerm.toLowerCase());
        console.log('🔎 Checking booking:', booking.clients?.name, 'matches:', matches);
        return matches;
      });
      console.log('🔎 After search filter:', beforeSearchFilter, '->', filtered.length);
    }

    console.log('✅ Final filtered bookings:', filtered.length, filtered);
    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, dateFilter]);

  const updateBookingStatus = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking status:', error);
        toast.error('Failed to update booking status');
        return;
      }

      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus, updatedAt: new Date().toISOString() }
          : booking
      ));

      toast.success('Booking status updated successfully');
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'confirmed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'no_show':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'scheduled':
        return <Calendar className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Timer className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'no_show':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUpcomingBookingsCount = () => {
    const now = new Date();
    return bookings.filter(booking => 
      new Date(booking.date + 'T' + booking.time) > now && 
      ['scheduled', 'confirmed'].includes(booking.status)
    ).length;
  };

  const getTodayBookingsCount = () => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(booking => 
      booking.date === today
    ).length;
  };

  const getCompletedBookingsCount = () => {
    return bookings.filter(booking => booking.status === 'completed').length;
  };

  const getStatusText = (status: Booking['status']) => {
    switch (status) {
      case 'scheduled':
        return t('staffBookings.scheduled');
      case 'confirmed':
        return t('staffBookings.confirmed');
      case 'in_progress':
        return t('staffBookings.inProgress');
      case 'completed':
        return t('staffBookings.completed');
      case 'cancelled':
        return t('staffBookings.cancelled');
      case 'no_show':
        return t('staffBookings.noShow');
      default:
        return status;
    }
  };

  const todayCount = getTodayBookingsCount();
  const upcomingCount = getUpcomingBookingsCount();
  const completedCount = getCompletedBookingsCount();
  const loading = isLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('staffBookings.title')}</h1>
        <p className="text-gray-600 mt-2">{t('staffBookings.subtitle')}</p>
        </div>
        <button
          onClick={fetchBookings}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t('staffBookings.refresh')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('staffBookings.todayAppointments')}</p>
              <p className="text-2xl font-bold text-gray-900">{todayCount}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('staffBookings.upcomingAppointments')}</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingCount}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('staffBookings.completedServices')}</p>
              <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('staffBookings.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field min-w-[140px]"
            >
              <option value="all">{t('staffBookings.allDates')}</option>
              <option value="today">{t('staffBookings.today')}</option>
              <option value="tomorrow">{t('staffBookings.tomorrow')}</option>
              <option value="week">{t('staffBookings.thisWeek')}</option>
              <option value="past">{t('staffBookings.past')}</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field min-w-[140px]"
            >
              <option value="all">{t('staffBookings.allStatus')}</option>
              <option value="scheduled">{t('staffBookings.scheduled')}</option>
              <option value="confirmed">{t('staffBookings.confirmed')}</option>
              <option value="in_progress">{t('staffBookings.inProgress')}</option>
              <option value="completed">{t('staffBookings.completed')}</option>
              <option value="cancelled">{t('staffBookings.cancelled')}</option>
              <option value="no_show">{t('staffBookings.noShow')}</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('staffBookings.noAppointments')}</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? t('staffBookings.tryAdjustingFilters')
                : t('staffBookings.noAppointmentsMessage')
              }
            </p>
          </motion.div>
        ) : (
          filteredBookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card hover:shadow-elegant transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {booking.clients?.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Scissors className="w-4 h-4" />
                        <span>{booking.services?.name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="font-medium">{formatPrice(booking.services?.price || 0)}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      {getStatusText(booking.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(booking.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{booking.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      <span>{booking.services?.duration || 60} min</span>
                    </div>
                    {booking.clients?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{booking.clients.phone}</span>
                      </div>
                    )}
                  </div>

                  {booking.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{booking.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 lg:min-w-[200px]">
                  <button
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowDetailsModal(true);
                    }}
                    className="btn-secondary flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {t('staffBookings.viewDetails')}
                  </button>

                  {booking.status === 'scheduled' && (
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                      className="btn-primary flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t('staffBookings.confirm')}
                    </button>
                  )}

                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'in_progress')}
                      className="btn-primary flex items-center justify-center gap-2"
                    >
                      <Timer className="w-4 h-4" />
                      {t('staffBookings.startService')}
                    </button>
                  )}

                  {booking.status === 'in_progress' && (
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'completed')}
                      className="btn-success flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t('staffBookings.complete')}
                    </button>
                  )}

                  {['scheduled', 'confirmed'].includes(booking.status) && (
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                      className="btn-danger flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      {t('staffBookings.cancel')}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

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
                <h2 className="text-xl font-bold text-gray-900">{t('staffBookings.appointmentDetails')}</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Client Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{t('staffBookings.clientInformation')}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">{selectedBooking.clients?.name}</span>
                    </div>
                    {selectedBooking.clients?.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <span>{selectedBooking.clients.phone}</span>
                      </div>
                    )}
                    {selectedBooking.clients?.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span>{selectedBooking.clients.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{t('staffBookings.serviceInformation')}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Scissors className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">{selectedBooking.services?.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <span>{formatPrice(selectedBooking.services?.price || 0)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Timer className="w-5 h-5 text-gray-400" />
                      <span>{selectedBooking.services?.duration || 60} {t('staffBookings.minutes')}</span>
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{t('staffBookings.appointmentDetails')}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span>{formatDate(selectedBooking.date)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span>{selectedBooking.time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center gap-1 ${getStatusColor(selectedBooking.status)}`}>
                        {getStatusIcon(selectedBooking.status)}
                        {getStatusText(selectedBooking.status)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedBooking.notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">{t('staffBookings.notes')}</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700">{selectedBooking.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn-secondary flex-1"
                >
                  {t('staffBookings.close')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StaffBookings;