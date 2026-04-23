import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEdit, 
  faSave, 
  faTimes, 
  faBuilding,
  faMapMarkerAlt,
  faIdCard,
  faMoneyBillWave,
  faEnvelope,
  faShieldAlt,
  faCalendar,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import '../../assets/css/profile.css';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { success, error } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (user) {
      setEditData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        department: user.department || '',
        location: user.location || '',
        employee_number: user.employee_number || '',
        cost_center_number: user.cost_center_number || ''
      });
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      department: user.department || '',
      location: user.location || '',
      employee_number: user.employee_number || '',
      cost_center_number: user.cost_center_number || ''
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('Saving profile data:', editData);
      const result = await updateProfile(editData);
      console.log('Update result:', result);
      
      if (result.success) {
        setIsEditing(false);
        success('Profile updated successfully');
      } else {
        console.error('Update failed:', result.error);
        error(result.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Update error:', err);
      error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const formatValue = (value) => {
    // Handle null, undefined, empty string, or just whitespace
    if (!value || !value.toString().trim()) return '—';
    return value;
  };

  const getRoleName = (role) => {
    const roleNames = {
      cat1: 'Category 1',
      cat2: 'Category 2', 
      cat3: 'Category 3',
      cat4: 'System Administrator',
      customer: 'Customer',
      manager: 'Manager',
      user: 'User',
      viewer: 'Viewer'
    };
    return roleNames[role] || role?.toUpperCase() || 'Unassigned';
  };

  if (!user) {
    return (
      <div className="profile-loading">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <FontAwesomeIcon icon={faUser} />
        </div>
        <div className="profile-info">
          <h1>{user.full_name || 'User'}</h1>
          <p className="profile-email">{user.email}</p>
          <span className="profile-role">{getRoleName(user.role)}</span>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Personal Information</h2>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Full Name</label>
              <span className="profile-value">{user.full_name || '—'}</span>
            </div>

            <div className="profile-field">
              <label>First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className="profile-input"
                  placeholder="Enter first name"
                />
              ) : (
                <span className="profile-value">{formatValue(user.first_name)}</span>
              )}
            </div>

            <div className="profile-field">
              <label>Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className="profile-input"
                  placeholder="Enter last name"
                />
              ) : (
                <span className="profile-value">{formatValue(user.last_name)}</span>
              )}
            </div>

            <div className="profile-field">
              <label>Email Address</label>
              <span className="profile-value">{user.email}</span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Work Information</h2>
          <div className="profile-grid">
            <div className="profile-field">
              <label><FontAwesomeIcon icon={faBuilding} /> Department</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="profile-input"
                  placeholder="Enter department"
                />
              ) : (
                <span className="profile-value">{formatValue(user.department)}</span>
              )}
            </div>

            <div className="profile-field">
              <label><FontAwesomeIcon icon={faMapMarkerAlt} /> Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="profile-input"
                  placeholder="Enter location"
                />
              ) : (
                <span className="profile-value">{formatValue(user.location)}</span>
              )}
            </div>

            <div className="profile-field">
              <label><FontAwesomeIcon icon={faIdCard} /> Employee Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.employee_number}
                  onChange={(e) => handleInputChange('employee_number', e.target.value)}
                  className="profile-input"
                  placeholder="Enter employee number"
                />
              ) : (
                <span className="profile-value">{formatValue(user.employee_number)}</span>
              )}
            </div>

            <div className="profile-field">
              <label><FontAwesomeIcon icon={faMoneyBillWave} /> Cost Center</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.cost_center_number}
                  onChange={(e) => handleInputChange('cost_center_number', e.target.value)}
                  className="profile-input"
                  placeholder="Enter cost center"
                />
              ) : (
                <span className="profile-value">{formatValue(user.cost_center_number)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Account Details</h2>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Access Level</label>
              <span className="profile-value profile-role-badge">{getRoleName(user.role)}</span>
            </div>

            <div className="profile-field">
              <label>Account Status</label>
              <span className={`profile-status ${user.status === 'active' ? 'active' : 'inactive'}`}>
                {user.status ? (user.status === 'active' ? 'Active' : user.status.charAt(0).toUpperCase() + user.status.slice(1)) : 'Unknown'}
              </span>
            </div>

            <div className="profile-field">
              <label><FontAwesomeIcon icon={faCalendar} /> Last Login</label>
              <span className="profile-value">{formatDate(user.last_login)}</span>
            </div>

            <div className="profile-field">
              <label><FontAwesomeIcon icon={faCalendar} /> Member Since</label>
              <span className="profile-value">{formatDate(user.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
