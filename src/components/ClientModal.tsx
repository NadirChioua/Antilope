import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Mail, FileText, Save, AlertCircle } from 'lucide-react';
import { Client } from '@/types';
import { z } from 'zod';
import toast from 'react-hot-toast';

// Validation schema for client data
const clientSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets'),
  phone: z.string()
    .min(10, 'Le numéro de téléphone doit contenir au moins 10 chiffres')
    .max(15, 'Le numéro de téléphone ne peut pas dépasser 15 chiffres')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Format de téléphone invalide'),
  email: z.string()
    .email('Adresse email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères')
    .optional()
    .or(z.literal('')),
  notes: z.string()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
    .optional()
    .or(z.literal(''))
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'totalVisits' | 'totalSpent'>) => void;
  editingClient?: Client | null;
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSave, editingClient }) => {
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when editing
  React.useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name || '',
        phone: editingClient.phone || '',
        email: editingClient.email || '',
        notes: editingClient.notes || '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        notes: '',
      });
    }
    setErrors({});
  }, [editingClient, isOpen]);

  const validateField = (field: keyof ClientFormData, value: string) => {
    try {
      clientSchema.pick({ [field]: true }).parse({ [field]: value });
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0]?.message }));
      }
      return false;
    }
  };

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate all fields
      const validatedData = clientSchema.parse(formData);
      
      // Create new client object
      const newClient: Omit<Client, 'id'> = {
        name: validatedData.name.trim(),
        phone: validatedData.phone.trim(),
        email: validatedData.email?.trim() || '',
        notes: validatedData.notes?.trim() || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await onSave(newClient);
      
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        notes: ''
      });
      setErrors({});
      
      toast.success(editingClient ? 'Client mis à jour avec succès' : 'Client ajouté avec succès');
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof ClientFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof ClientFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error('Veuillez corriger les erreurs dans le formulaire');
      } else {
        toast.error('Une erreur est survenue lors de la sauvegarde');
        console.error('Error saving client:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    handleInputChange(field as keyof ClientFormData, value);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-elegant"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={(e) => validateField('name', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                    errors.name 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 focus:ring-primary-500'
                  }`}
                  placeholder="Enter client's full name"
                  required
                />
              </div>
              {errors.name && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.name}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Numéro de téléphone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    onBlur={(e) => validateField('phone', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                      errors.phone 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-200 focus:ring-primary-500'
                    }`}
                    placeholder="Entrez le numéro de téléphone"
                    required
                  />
                </div>
                {errors.phone && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.phone}
                  </div>
                )}
              </div>

            {/* Email */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={(e) => validateField('email', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                      errors.email 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-200 focus:ring-primary-500'
                    }`}
                    placeholder="Entrez l'adresse email (optionnel)"
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </div>
                )}
              </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Notes
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  onBlur={(e) => validateField('notes', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-white border rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent resize-none ${
                    errors.notes 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 focus:ring-primary-500'
                  }`}
                  placeholder="Notes additionnelles (optionnel)"
                  rows={3}
                />
              </div>
              {errors.notes && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.notes}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingClient ? 'Update Client' : 'Add Client'}
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ClientModal;
