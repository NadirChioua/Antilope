import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  DollarSign,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  UserPlus
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { authService } from '../../services/database';
import toast from 'react-hot-toast';

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'staff' | 'receptionist';
  status: 'active' | 'inactive';
  avatar?: string;
  address: string;
  dateOfBirth: string;
  hireDate: string;
  permissions: string[];
  salary?: number;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staff: Omit<Staff, 'id'>) => void;
  staff?: Staff | null;
}

const StaffModal: React.FC<StaffModalProps> = ({ isOpen, onClose, onSave, staff }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('personal');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'staff' as const,
    status: 'active' as const,
    address: '',
    dateOfBirth: '',
    hireDate: '',
    permissions: [] as string[],
    salary: 0,
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const availablePermissions = [
    { id: 'bookings', label: 'Manage Bookings', description: 'Create, edit, and cancel appointments' },
    { id: 'clients', label: 'Manage Clients', description: 'Add, edit, and view client information' },
    { id: 'services', label: 'Manage Services', description: 'Create and modify service offerings' },
    { id: 'products', label: 'Manage Products', description: 'Handle inventory and product catalog' },
    { id: 'reports', label: 'View Reports', description: 'Access business analytics and reports' },
    { id: 'settings', label: 'System Settings', description: 'Configure system preferences' },
    { id: 'staff', label: 'Manage Staff', description: 'Add and manage team members' },
    { id: 'payments', label: 'Handle Payments', description: 'Process transactions and refunds' }
  ];

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'role', label: 'Role & Permissions', icon: Shield },
    { id: 'employment', label: 'Employment', icon: Calendar },
    { id: 'emergency', label: 'Emergency Contact', icon: AlertTriangle }
  ];

  useEffect(() => {
    if (staff) {
      setFormData({
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        status: staff.status,
        address: staff.address,
        dateOfBirth: staff.dateOfBirth,
        hireDate: staff.hireDate,
        permissions: staff.permissions,
        salary: staff.salary || 0,
        emergencyContact: staff.emergencyContact,
        password: '',
        confirmPassword: ''
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'staff',
        status: 'active',
        address: '',
        dateOfBirth: '',
        hireDate: new Date().toISOString().split('T')[0],
        permissions: [],
        salary: 0,
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        password: '',
        confirmPassword: ''
      });
    }
    setActiveTab('personal');
    setErrors({});
  }, [staff, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Only require name for updates
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // For new staff, require more fields
    if (!staff) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }

      if (!formData.role) {
        newErrors.role = 'Role is required';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else {
      // For updates, validate email only if provided
      if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (staff) {
        // Update existing staff
        const { password, confirmPassword, ...staffData } = formData;
        onSave(staffData);
      } else {
        // Create new staff with authentication
        const { password, confirmPassword, ...staffData } = formData;
        
        // Create user account with authentication
        const newUser = await authService.signUp(
          formData.email,
          formData.password,
          `${formData.firstName} ${formData.lastName}`,
          formData.role
        );

        if (newUser) {
          // Pass the staff data to parent component
          onSave({
            ...staffData,
            id: newUser.id // Use the ID from the created user
          });
          toast.success('Staff member created successfully!');
        }
      }
    } catch (error) {
      console.error('Error creating staff member:', error);
      toast.error('Failed to create staff member. Please try again.');
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const renderPersonalInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            className={`input w-full ${errors.firstName ? 'border-red-500' : ''}`}
            placeholder="Enter first name"
          />
          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            className={`input w-full ${errors.lastName ? 'border-red-500' : ''}`}
            placeholder="Enter last name"
          />
          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
        </div>
      </div>

      {/* Show additional fields only for new staff */}
      {!staff && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth *
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
            className={`input w-full ${errors.dateOfBirth ? 'border-red-500' : ''}`}
          />
          {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
        </div>
      )}

      {!staff && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className={`input w-full pr-10 ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className={`input w-full ${errors.confirmPassword ? 'border-red-500' : ''}`}
              placeholder="Confirm password"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>
        </div>
      )}
    </div>
  );

  const renderContactInfo = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address {!staff ? '*' : '(Optional)'}
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className={`input w-full ${errors.email ? 'border-red-500' : ''}`}
          placeholder="Enter email address"
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number (Optional)
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className={`input w-full ${errors.phone ? 'border-red-500' : ''}`}
          placeholder="Enter phone number"
        />
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
      </div>
      {!staff && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className={`input w-full ${errors.address ? 'border-red-500' : ''}`}
            rows={3}
            placeholder="Enter full address"
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>
      )}
    </div>
  );

  const renderRolePermissions = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role {!staff ? '*' : '(Optional)'}
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
            className={`input w-full ${errors.role ? 'border-red-500' : ''}`}
          >
            <option value="staff">Staff</option>
            <option value="receptionist">Receptionist</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
            className="input w-full"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Permissions {!staff ? '*' : '(Optional)'}
        </label>
        <div className="space-y-3">
          {availablePermissions.map((permission) => (
            <div key={permission.id} className="flex items-start gap-3">
              <input
                type="checkbox"
                id={permission.id}
                checked={formData.permissions.includes(permission.id)}
                onChange={() => handlePermissionToggle(permission.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor={permission.id} className="font-medium text-gray-900 cursor-pointer">
                  {permission.label}
                </label>
                <p className="text-sm text-gray-600">{permission.description}</p>
              </div>
            </div>
          ))}
        </div>
        {errors.permissions && <p className="text-red-500 text-xs mt-1">{errors.permissions}</p>}
      </div>
    </div>
  );

  const renderEmploymentInfo = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hire Date *
        </label>
        <input
          type="date"
          value={formData.hireDate}
          onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
          className={`input w-full ${errors.hireDate ? 'border-red-500' : ''}`}
        />
        {errors.hireDate && <p className="text-red-500 text-xs mt-1">{errors.hireDate}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Salary (Optional)
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="number"
            value={formData.salary}
            onChange={(e) => setFormData(prev => ({ ...prev, salary: Number(e.target.value) }))}
            className="input w-full pl-10"
            placeholder="Enter annual salary"
            min="0"
          />
        </div>
      </div>
    </div>
  );

  const renderEmergencyContact = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contact Name *
        </label>
        <input
          type="text"
          value={formData.emergencyContact.name}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            emergencyContact: { ...prev.emergencyContact, name: e.target.value }
          }))}
          className={`input w-full ${errors.emergencyContactName ? 'border-red-500' : ''}`}
          placeholder="Enter emergency contact name"
        />
        {errors.emergencyContactName && <p className="text-red-500 text-xs mt-1">{errors.emergencyContactName}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contact Phone *
        </label>
        <input
          type="tel"
          value={formData.emergencyContact.phone}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
          }))}
          className={`input w-full ${errors.emergencyContactPhone ? 'border-red-500' : ''}`}
          placeholder="Enter emergency contact phone"
        />
        {errors.emergencyContactPhone && <p className="text-red-500 text-xs mt-1">{errors.emergencyContactPhone}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Relationship *
        </label>
        <input
          type="text"
          value={formData.emergencyContact.relationship}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
          }))}
          className={`input w-full ${errors.emergencyContactRelationship ? 'border-red-500' : ''}`}
          placeholder="e.g., Spouse, Parent, Sibling"
        />
        {errors.emergencyContactRelationship && <p className="text-red-500 text-xs mt-1">{errors.emergencyContactRelationship}</p>}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal': return renderPersonalInfo();
      case 'contact': return renderContactInfo();
      case 'role': return renderRolePermissions();
      case 'employment': return renderEmploymentInfo();
      case 'emergency': return renderEmergencyContact();
      default: return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  {staff ? <User className="w-5 h-5 text-primary-600" /> : <UserPlus className="w-5 h-5 text-primary-600" />}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {staff ? 'Update staff information and permissions' : 'Create a new team member account'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="flex-1 p-6 overflow-y-auto">
                {renderTabContent()}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {staff ? 'Update Staff' : 'Create Staff'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StaffModal;