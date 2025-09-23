import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, MapPin, Star, Scissors, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { serviceService, clientService, bookingService } from '@/services/database';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import Logo from '@/components/Logo';
import { useLanguage } from '../contexts/LanguageContext';
import { normalizePhoneNumber } from '../utils/phone';

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category: string;
  assigned_staff: string[];
  isActive: boolean;
}

interface BookingForm {
  serviceId: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
}

const PublicBooking: React.FC = () => {
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<BookingForm>({
    serviceId: '',
    date: '',
    time: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: ''
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const servicesData = await serviceService.getAll();
      console.log('Loaded services:', servicesData); // Debug log
      setServices(servicesData.filter(service => service.isActive));
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // More specific validation with detailed error messages
    const missingFields = [];
    if (!formData.serviceId) missingFields.push('Service');
    if (!formData.date) missingFields.push('Date');
    if (!formData.time) missingFields.push('Time');
    if (!formData.customerName.trim()) missingFields.push('Full Name');
    if (!formData.customerPhone.trim()) missingFields.push('Phone Number');
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    setSubmitting(true);
    
    try {
      // First, create or find the client
      let clientId = null;
      
      // Normalize phone number (remove spaces, dashes, and other formatting)
      const normalizedPhone = normalizePhoneNumber(formData.customerPhone);
      
      // Function to find existing client by phone
      const findExistingClient = async (phone: string) => {
        const { data: existingClients } = await supabase
          .from('clients')
          .select('id')
          .eq('phone', phone)
          .limit(1);
        return existingClients && existingClients.length > 0 ? existingClients[0].id : null;
      };

      // Check if client exists by normalized phone
      clientId = await findExistingClient(normalizedPhone);
      
      if (!clientId) {
        // Also check with original phone format in case it was already stored differently
        if (normalizedPhone !== formData.customerPhone) {
          clientId = await findExistingClient(formData.customerPhone);
        }
      }

      if (!clientId) {
        // Create new client with normalized phone
        try {
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
              name: formData.customerName.trim(),
              phone: normalizedPhone,
              email: formData.customerEmail?.trim() || null,
              notes: formData.notes?.trim() || null,
              total_visits: 0,
              total_spent: 0
            })
            .select()
            .single();

          if (clientError) {
            // Check if it's a unique constraint violation (duplicate phone)
            if (clientError.code === '23505' && clientError.message.includes('phone')) {
              console.log('Phone number already exists, attempting to find existing client...');
              // Try to find the existing client again (race condition handling)
              clientId = await findExistingClient(normalizedPhone);
              if (!clientId) {
                clientId = await findExistingClient(formData.customerPhone);
              }
              if (!clientId) {
                throw new Error('Unable to create or find client with this phone number');
              }
            } else {
              throw clientError;
            }
          } else {
            clientId = newClient.id;
          }
        } catch (error: any) {
          // Additional safety check for unique constraint violations
          if (error.code === '23505' && error.message.includes('phone')) {
            console.log('Duplicate phone detected, searching for existing client...');
            clientId = await findExistingClient(normalizedPhone);
            if (!clientId) {
              clientId = await findExistingClient(formData.customerPhone);
            }
            if (!clientId) {
              throw new Error('Unable to create or find client with this phone number');
            }
          } else {
            throw error;
          }
        }
      }

      // Get the selected service details
      const selectedService = services.find(s => s.id === formData.serviceId);
      if (!selectedService) throw new Error('Service not found');

      // Get available staff for this service (use first available staff member)
      let staffId = null;
      if (selectedService.assigned_staff && selectedService.assigned_staff.length > 0) {
        staffId = selectedService.assigned_staff[0];
      } else {
        // Get any staff member if no specific assignment
        const { data: staffData } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'staff')
          .limit(1);
        
        if (staffData && staffData.length > 0) {
          staffId = staffData[0].id;
        }
      }

      if (!staffId) {
        // If no staff found, use a default staff ID or create a booking without staff assignment
        toast.error('No staff available for this service. Please contact us directly.');
        return;
      }

      // Create the booking
      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = new Date(startDateTime.getTime() + selectedService.duration * 60000);

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          client_id: clientId,
          service_id: formData.serviceId,
          staff_id: staffId,
          date: formData.date,
          time: formData.time,
          duration: selectedService.duration,
          start_at: startDateTime.toISOString(),
          end_at: endDateTime.toISOString(),
          status: 'pending',
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      setSuccess(true);
      toast.success(t('publicBooking.bookingSuccess'));
      
      // Reset form
      setFormData({
        serviceId: '',
        date: '',
        time: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error(t('publicBooking.bookingError'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = services.find(s => s.id === formData.serviceId);

  // Generate time slots (9 AM to 6 PM)
  const timeSlots = [];
  for (let hour = 9; hour <= 18; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 18) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md mx-auto bg-white rounded-2xl shadow-elegant p-8 text-center"
        >
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('publicBooking.successTitle')}</h2>
          <p className="text-gray-600 mb-6">
            {t('publicBooking.successMessage')}
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="btn-primary w-full"
          >
            {t('publicBooking.backToBooking')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-white shadow-soft border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Logo size="lg" variant="light" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('publicBooking.salonName')}</h1>
            <p className="text-gray-600">{t('publicBooking.salonDescription')}</p>
            <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{t('publicBooking.location')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card-elegant"
        >
          {/* Hero Section */}
          <div className="gradient-primary text-white p-8 text-center rounded-t-2xl">
            <h2 className="text-4xl font-bold mb-4">{t('publicBooking.bookAppointment')}</h2>
            <p className="text-xl opacity-90">{t('publicBooking.heroSubtitle')}</p>
            <div className="flex items-center justify-center mt-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-5 w-5 text-yellow-300 fill-current" />
              ))}
              <span className="ml-2 text-sm">{t('publicBooking.rating')}</span>
            </div>
          </div>

          {/* Booking Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Service Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                {t('publicBooking.chooseService')} <span className="text-red-500">{t('publicBooking.required')}</span>
              </label>
              
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <span className="ml-3 text-gray-600">{t('publicBooking.loadingServices')}</span>
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">{t('publicBooking.noServicesAvailable')}</p>
                  <p className="text-sm text-gray-500 mt-2">{t('publicBooking.contactDirectly')}</p>
                </div>
              ) : (
                <>
                  {/* Group services by category */}
                  {Array.from(new Set(services.map(s => s.category))).map(category => (
                    <div key={category} className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                        {category}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {services
                          .filter(service => service.category === category)
                          .map((service) => (
                            <motion.div
                              key={service.id}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 group ${
                                formData.serviceId === service.id
                                  ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 shadow-lg ring-2 ring-primary-200'
                                  : 'border-gray-200 hover:border-primary-300 hover:shadow-md bg-white'
                              }`}
                              onClick={() => setFormData({ ...formData, serviceId: service.id })}
                            >
                              {/* Selection indicator */}
                              {formData.serviceId === service.id && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
                                >
                                  <CheckCircle className="h-4 w-4 text-white" />
                                </motion.div>
                              )}
                              
                              {/* Service icon */}
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${
                                formData.serviceId === service.id 
                                  ? 'bg-primary-500' 
                                  : 'bg-gray-100 group-hover:bg-primary-100'
                              }`}>
                                <Scissors className={`h-6 w-6 transition-colors ${
                                  formData.serviceId === service.id 
                                    ? 'text-white' 
                                    : 'text-gray-600 group-hover:text-primary-600'
                                }`} />
                              </div>
                              
                              {/* Service details */}
                              <div className="space-y-3">
                                <h4 className="font-bold text-gray-900 text-lg leading-tight">
                                  {service.name}
                                </h4>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-gray-600">
                                    <Clock className="h-4 w-4 mr-2" />
                                    <span className="text-sm font-medium">{service.duration} {t('publicBooking.minutes')}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-2xl font-bold text-primary-600">
                                      {service.price}
                                    </span>
                                    <span className="text-sm text-gray-500 ml-1">{t('publicBooking.mad')}</span>
                                  </div>
                                </div>
                                
                                {/* Service description if available */}
                                {service.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {service.description}
                                  </p>
                                )}
                              </div>
                              
                              {/* Hover effect overlay */}
                              <div className={`absolute inset-0 rounded-2xl transition-opacity ${
                                formData.serviceId === service.id 
                                  ? 'bg-primary-500/5' 
                                  : 'bg-primary-500/0 group-hover:bg-primary-500/5'
                              }`}></div>
                            </motion.div>
                          ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  {t('publicBooking.selectDate')} <span className="text-red-500">{t('publicBooking.required')}</span>
                </label>
                <input
                  type="date"
                  min={today}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  {t('publicBooking.selectTime')} <span className="text-red-500">{t('publicBooking.required')}</span>
                </label>
                <select
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="input-field w-full"
                  required
                >
                  <option value="">{t('publicBooking.chooseTime')}</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('publicBooking.yourInformation')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    {t('publicBooking.fullName')} <span className="text-red-500">{t('publicBooking.required')}</span>
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="input-field w-full"
                    placeholder={t('publicBooking.enterFullName')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-1" />
                    {t('publicBooking.phoneNumber')} <span className="text-red-500">{t('publicBooking.required')}</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="input-field w-full"
                    placeholder={t('publicBooking.enterPhoneNumber')}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  {t('publicBooking.emailAddress')}
                </label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="input-field w-full"
                  placeholder={t('publicBooking.enterEmailAddress')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('publicBooking.specialRequests')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field w-full"
                  rows={3}
                  placeholder={t('publicBooking.specialRequestsPlaceholder')}
                />
              </div>
            </div>

            {/* Booking Summary */}
            {selectedService && (
              <div className="bg-cream-50 rounded-xl p-6 border border-cream-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('publicBooking.bookingSummary')}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t('publicBooking.service')}:</span>
                    <span className="font-semibold">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('publicBooking.duration')}:</span>
                    <span>{selectedService.duration} {t('publicBooking.minutes')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('publicBooking.price')}:</span>
                    <span className="font-bold text-primary-600">{selectedService.price} {t('publicBooking.mad')}</span>
                  </div>
                  {formData.date && (
                    <div className="flex justify-between">
                      <span>{t('publicBooking.date')}:</span>
                      <span>{new Date(formData.date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {formData.time && (
                    <div className="flex justify-between">
                      <span>{t('publicBooking.time')}:</span>
                      <span>{formData.time}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('publicBooking.submitting') : t('publicBooking.bookAppointmentButton')}
            </motion.button>
          </form>
        </motion.div>

        {/* Contact Information */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 card text-center"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">{t('publicBooking.contactUs')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <Phone className="h-5 w-5 mx-auto mb-2 text-primary-600" />
              <p className="font-semibold">{t('publicBooking.phone')}</p>
              <p>+212 123 456 789</p>
            </div>
            <div>
              <Mail className="h-5 w-5 mx-auto mb-2 text-primary-600" />
              <p className="font-semibold">{t('publicBooking.email')}</p>
              <p>info@salontanger.ma</p>
            </div>
            <div>
              <MapPin className="h-5 w-5 mx-auto mb-2 text-primary-600" />
              <p className="font-semibold">{t('publicBooking.address')}</p>
              <p>{t('publicBooking.location')}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PublicBooking;