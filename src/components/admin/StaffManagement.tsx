import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import StaffModal from './StaffModal';

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

const StaffManagement: React.FC = () => {
  const { t } = useLanguage();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch staff data from Supabase
  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching staff:', error);
        toast.error('Failed to load staff members');
        return;
      }

      // Transform user data to staff format
      const staffData: Staff[] = users.map(user => {
        // Load additional data from localStorage
        const additionalData = localStorage.getItem(`staff_additional_${user.id}`);
        const parsed = additionalData ? JSON.parse(additionalData) : {};
        
        return {
          id: user.id,
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          status: user.active !== false ? 'active' : 'inactive',
          address: parsed.address || '',
          dateOfBirth: parsed.dateOfBirth || '',
          hireDate: parsed.hireDate || user.created_at?.split('T')[0] || '',
          permissions: parsed.permissions || [],
          salary: parsed.salary || 0,
          emergencyContact: parsed.emergencyContact || {
            name: '',
            phone: '',
            relationship: ''
          }
        };
      });

      setStaff(staffData);
      setFilteredStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff members');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter staff based on search and filters
  useEffect(() => {
    let filtered = staff;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm)
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(member => member.role === filterRole);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(member => member.status === filterStatus);
    }

    setFilteredStaff(filtered);
  }, [staff, searchTerm, filterRole, filterStatus]);

  const handleAddStaff = () => {
    setSelectedStaff(null);
    setIsModalOpen(true);
  };

  const handleEditStaff = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsModalOpen(true);
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', staffId);

      if (error) {
        console.error('Error deleting staff:', error);
        toast.error('Failed to delete staff member');
        return;
      }

      setStaff(prev => prev.filter(member => member.id !== staffId));
      toast.success('Staff member deleted successfully');
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Failed to delete staff member');
    }
  };

  const handleSaveStaff = async (staffData: Omit<Staff, 'id'> | Staff) => {
    try {
      if ('id' in staffData) {
        // Update existing staff - only update fields that exist in the database
        const updateData: any = {
          name: `${staffData.firstName} ${staffData.lastName}`,
          phone: staffData.phone,
          role: staffData.role
        };

        // Store additional data in localStorage for UI purposes
        const additionalData = {
          address: staffData.address,
          dateOfBirth: staffData.dateOfBirth,
          hireDate: staffData.hireDate,
          permissions: staffData.permissions,
          salary: staffData.salary,
          emergencyContact: staffData.emergencyContact
        };
        
        localStorage.setItem(`staff_additional_${staffData.id}`, JSON.stringify(additionalData));

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', staffData.id);

        if (error) {
          console.error('Error updating staff:', error);
          toast.error(`Failed to update staff member: ${error.message}`);
          return;
        }

        setStaff(prev => prev.map(s => s.id === staffData.id ? staffData : s));
        toast.success('Staff member updated successfully');
      } else {
        // Add new staff - this will be handled by the authentication service in StaffModal
        // Just update the local state with the new staff data
        setStaff(prev => [...prev, staffData as Staff]);
      }
      
      setIsModalOpen(false);
      setSelectedStaff(null);
      
      // Refresh the staff list to get the latest data
      await fetchStaff();
    } catch (error) {
      console.error('Error saving staff:', error);
      toast.error('Failed to save staff member');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-green-100 text-green-800';
      case 'receptionist': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'active' 
      ? <CheckCircle className="w-4 h-4 text-green-500" />
      : <XCircle className="w-4 h-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <p className="text-gray-600">Manage your team members and their permissions</p>
        </div>
        <button
          onClick={handleAddStaff}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search staff by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input min-w-[120px]"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="receptionist">Receptionist</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input min-w-[120px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card hover:shadow-elegant transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {member.firstName[0]}{member.lastName[0]}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {member.firstName} {member.lastName}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                    {getStatusIcon(member.status)}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEditStaff(member)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteStaff(member.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="truncate">{member.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{member.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Hired: {new Date(member.hireDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>{member.permissions.length} permissions</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first staff member'
            }
          </p>
          {!searchTerm && filterRole === 'all' && filterStatus === 'all' && (
            <button onClick={handleAddStaff} className="btn-primary">
              Add Staff Member
            </button>
          )}
        </div>
      )}

      {/* Staff Modal */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveStaff}
        staff={selectedStaff}
      />
    </div>
  );
};

export default StaffManagement;