import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../assets/css/admin.css';

const UserManagement = () => {
  const { canManageUsers } = useAuth();
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [showPermissionsInfo, setShowPermissionsInfo] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  useEffect(() => {
    // Only fetch data if user can manage users
    if (canManageUsers()) {
      fetchUsers();
      fetchPermissions();
      fetchRoles();
    } else {
      setLoading(false);
    }
  }, [canManageUsers]);

  // Check if user can manage users
  if (!canManageUsers()) {
    return (
      <div className="admin-access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to access user management.</p>
      </div>
    );
  }

  const fetchUsers = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/profile/admin/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data?.users || data.users || []);
      } else {
        const errorText = await response.text();
        setError('Failed to fetch users. Please check your permissions.');
        console.error('Failed to fetch users:', response.status, errorText);
      }
    } catch (err) {
      setError('Error fetching users: ' + err.message);
      console.error('Error fetching users:', err);
    }
  };

  const fetchPermissions = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/profile/permissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch permissions:', response.status, errorText);
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  };

  const fetchRoles = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/profile/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data.data?.roles || []);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch roles:', response.status, errorText);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/profile/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        setSuccess('User role updated successfully');
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update user role');
      }
    } catch (err) {
      setError('Error updating user role: ' + err.message);
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      const response = await fetch(`/api/profile/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setSuccess(`User ${status} successfully`);
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${status} user`);
      }
    } catch (err) {
      setError(`Error ${status} user: ` + err.message);
    }
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setShowModal(false);
    setEditUser(null);
    setEditFormData({});
    setShowSaveConfirmation(false);
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setEditFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      department: user.department || '',
      location: user.location || '',
      employee_number: user.employee_number || '',
      cost_center_number: user.cost_center_number || ''
    });
    setShowModal('editUser');
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateUserDetails = async () => {
    try {
      // Filter out empty string values but keep meaningful values
      const filteredData = {};
      Object.keys(editFormData).forEach(key => {
        const value = editFormData[key];
        if (value !== undefined && value !== null) {
          // Keep non-empty strings and empty strings for optional fields (but not undefined/null)
          filteredData[key] = value;
        }
      });

      console.log('Sending user data:', filteredData);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/profile/admin/users/${editUser.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(filteredData)
      });

      if (response.ok) {
        setSuccess('User details updated successfully');
        fetchUsers();
        closeModal();
      } else {
        const errorData = await response.json();
        console.error('Validation error details:', errorData);
        setError(errorData.error || 'Failed to update user details');
        if (errorData.details) {
          console.error('Validation details:', errorData.details);
        }
      }
    } catch (err) {
      setError('Error updating user details: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const statusClass = status === 'active' ? 'status-active' : 'status-inactive';
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : roleId;
  };

  if (loading) {
    return <div className="loading">Loading user management...</div>;
  }

  return (
    <div className="admin-user-management" style={{ maxWidth: '2200px', margin: '0 auto', width: '100%' }}>
      <div className="admin-header">
        <h1>User Management</h1>
        <p>Manage user accounts, roles, and permissions</p>
      </div>


      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess('')} className="alert-close">×</button>
        </div>
      )}

      <div className="admin-stats">
        <div className="stat-card">
          <h3>{users.length}</h3>
          <p>Total Users</p>
        </div>
        <div className="stat-card">
          <h3>{users.filter(u => ['cat1', 'cat2', 'cat3', 'cat4'].includes(u.role) || ['viewer', 'user', 'manager', 'admin'].includes(u.role)).length}</h3>
          <p>Assigned Users</p>
        </div>
        <div className="stat-card">
          <h3>{users.filter(u => !['cat1', 'cat2', 'cat3', 'cat4', 'viewer', 'user', 'manager', 'admin'].includes(u.role)).length}</h3>
          <p>Unassigned Users</p>
        </div>
      </div>

      <div className="users-table-container" style={{ width: '100%', overflowX: 'auto', maxWidth: '2200px', overflowY: 'visible' }}>
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Department</th>
              <th>
                Role 
                <span 
                  onClick={() => setShowPermissionsInfo(true)}
                  style={{ 
                    marginLeft: '8px', 
                    cursor: 'pointer', 
                    fontSize: '14px',
                    color: '#007bff',
                    border: '1px solid #007bff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    textTransform: 'none'
                  }}
                  title="Click to view category permissions"
                >
                  i
                </span>
              </th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.user_id}>
                <td>
                  <div className="user-info">
                    <div className="user-name">{user.full_name}</div>
                    <div className="user-id">ID: {user.employee_number || user.user_id}</div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.department || 'N/A'}</td>
                <td>
                  <select
                    value={user.category || user.role}
                    onChange={e => {
                      // Prevent system admin from changing own role or another system admin's role
                      if (user.category === 'cat4' || user.role === 'admin' || user.email === selectedUser?.email) return;
                      setSelectedUser(user);
                      setShowModal('confirmRoleChange');
                      setSuccess('');
                      setError('');
                      window.confirmationNewRole = e.target.value;
                    }}
                    className="role-select"
                    disabled={user.category === 'cat4' || user.role === 'admin' || user.email === selectedUser?.email}
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{getStatusBadge(user.status)}</td>
                <td>{formatDate(user.last_login)}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => openUserModal(user)}
                      className="btn btn-sm btn-primary"
                      title="View Details"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openEditModal(user)}
                      className="btn btn-sm btn-info"
                      title="Edit User Details"
                    >
                      Edit
                    </button>
                    {user.status === 'active' ? (
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal('confirmStatusChange');
                          setSuccess('');
                          setError('');
                          window.confirmationNewStatus = 'deactivated';
                        }}
                        className="btn btn-sm btn-warning"
                        title="Deactivate User"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal('confirmStatusChange');
                          setSuccess('');
                          setError('');
                          window.confirmationNewStatus = 'active';
                        }}
                        className="btn btn-sm btn-success"
                        title="Activate User"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {showModal === 'confirmRoleChange' && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Role Change</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to change the role for <strong>{selectedUser.full_name}</strong> (ID: {selectedUser.user_id}) to <strong>{getRoleName(window.confirmationNewRole)}</strong>?</p>
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button className="btn btn-sm btn-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn btn-sm btn-primary" style={{ marginLeft: '10px' }} onClick={() => {
                  updateUserRole(selectedUser.user_id, window.confirmationNewRole);
                  closeModal();
                }}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showModal === 'confirmStatusChange' && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Status Change</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to change the status for <strong>{selectedUser.full_name}</strong> (ID: {selectedUser.user_id}) to <strong>{window.confirmationNewStatus}</strong>?</p>
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button className="btn btn-sm btn-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn btn-sm btn-primary" style={{ marginLeft: '10px' }} onClick={() => {
                  updateUserStatus(selectedUser.user_id, window.confirmationNewStatus);
                  closeModal();
                }}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showModal === true && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="user-detail-grid">
                <div className="detail-group">
                  <label>Full Name</label>
                  <p>{selectedUser.full_name}</p>
                </div>
                <div className="detail-group">
                  <label>Email</label>
                  <p>{selectedUser.email}</p>
                </div>
                <div className="detail-group">
                  <label>Employee Number</label>
                  <p>{selectedUser.employee_number || 'N/A'}</p>
                </div>
                <div className="detail-group">
                  <label>Department</label>
                  <p>{selectedUser.department || 'N/A'}</p>
                </div>
                <div className="detail-group">
                  <label>Location</label>
                  <p>{selectedUser.location || 'N/A'}</p>
                </div>
                <div className="detail-group">
                  <label>Cost Center</label>
                  <p>{selectedUser.cost_center_number || 'N/A'}</p>
                </div>
                <div className="detail-group">
                  <label>Role</label>
                  <p>{getRoleName(selectedUser.role)}</p>
                </div>
                <div className="detail-group">
                  <label>Status</label>
                  <p>{getStatusBadge(selectedUser.status)}</p>
                </div>
                <div className="detail-group">
                  <label>Created Date</label>
                  <p>{formatDate(selectedUser.created_at)}</p>
                </div>
                <div className="detail-group">
                  <label>Last Login</label>
                  <p>{formatDate(selectedUser.last_login)}</p>
                </div>
                <div className="detail-group">
                  <label>Last Updated</label>
                  <p>{formatDate(selectedUser.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showModal === 'editUser' && editUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Edit User Details</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="edit-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="first_name">First Name *</label>
                    <input
                      type="text"
                      id="first_name"
                      value={editFormData.first_name}
                      onChange={(e) => handleEditFormChange('first_name', e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="last_name">Last Name *</label>
                    <input
                      type="text"
                      id="last_name"
                      value={editFormData.last_name}
                      onChange={(e) => handleEditFormChange('last_name', e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      value={editFormData.email}
                      onChange={(e) => handleEditFormChange('email', e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="first_name">First Name</label>
                    <input
                      type="text"
                      id="first_name"
                      value={editFormData.first_name}
                      onChange={(e) => handleEditFormChange('first_name', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="last_name">Last Name</label>
                    <input
                      type="text"
                      id="last_name"
                      value={editFormData.last_name}
                      onChange={(e) => handleEditFormChange('last_name', e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="department">Department</label>
                    <input
                      type="text"
                      id="department"
                      value={editFormData.department}
                      onChange={(e) => handleEditFormChange('department', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <select
                      id="location"
                      value={editFormData.location}
                      onChange={(e) => handleEditFormChange('location', e.target.value)}
                      className="form-input"
                    >
                      <option value="">Select Location</option>
                      <option value="MY.PNG">MY.PNG</option>
                      <option value="US.ATX">US.ATX</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="employee_number">Employee Number</label>
                    <input
                      type="text"
                      id="employee_number"
                      value={editFormData.employee_number}
                      onChange={(e) => handleEditFormChange('employee_number', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cost_center_number">Cost Center</label>
                    <input
                      type="text"
                      id="cost_center_number"
                      value={editFormData.cost_center_number}
                      onChange={(e) => handleEditFormChange('cost_center_number', e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    onClick={closeModal} 
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setShowSaveConfirmation(true)} 
                    className="btn btn-primary"
                    disabled={!editFormData.first_name || !editFormData.last_name || !editFormData.email}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Permissions Info Modal */}
      {showPermissionsInfo && (
        <div className="modal-overlay" onClick={() => setShowPermissionsInfo(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Category</h2>
              <button onClick={() => setShowPermissionsInfo(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="permissions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div className="permission-card" style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                  <h3 style={{ color: '#007bff', marginBottom: '10px', fontSize: '1.1rem' }}>Category 1 (Normal User)</h3>
                  <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '10px' }}>Basic viewing access</p>
                  <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '0.9rem' }}>
                    <li>Dashboard - View system overview</li>
                    <li>Search Records - View and search historical data</li>
                    <li>CLF - View customer escalation data</li>
                  </ul>
                </div>

                <div className="permission-card" style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                  <h3 style={{ color: '#28a745', marginBottom: '10px', fontSize: '1.1rem' }}>Category 2 (SH Technicians)</h3>
                  <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '10px' }}>Build operations access</p>
                  <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '0.9rem' }}>
                    <li>Search Records - View and search historical data</li>
                    <li>CLF - View customer escalation data</li>
                    <li>Start Build - Initiate new build processes</li>
                    <li>Continue Build - Resume existing builds</li>
                  </ul>
                </div>

                <div className="permission-card" style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                  <h3 style={{ color: '#ffc107', marginBottom: '10px', fontSize: '1.1rem' }}>Category 3 (Super User)</h3>
                  <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '10px' }}>Full operational access</p>
                  <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '0.9rem' }}>
                    <li>Dashboard - View system overview</li>
                    <li>Search Records - View and search historical data</li>
                    <li>CLF - View customer escalation data</li>
                    <li>Start Build - Initiate new build processes</li>
                    <li>Continue Build - Resume existing builds</li>
                    <li>Edit Build - Edit build details</li>
                    <li>Build Allocation - View build assignments</li>
                  </ul>
                </div>

                <div className="permission-card" style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                  <h3 style={{ color: '#dc3545', marginBottom: '10px', fontSize: '1.1rem' }}>Category 4 (System Admin)</h3>
                  <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '10px' }}>Full system administration</p>
                  <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '0.9rem' }}>
                    <li>Dashboard - View system overview</li>
                    <li>Search Records - View and search historical data</li>
                    <li>CLF - View customer escalation data</li>
                    <li>Start Build - Initiate new build processes</li>
                    <li>Continue Build - Resume existing builds</li>
                    <li>Build Allocation - View build assignments</li>
                    <li>User Management - Manage users and permissions</li>
                  </ul>
                </div>

                <div className="permission-card" style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                  <h3 style={{ color: '#6c757d', marginBottom: '10px', fontSize: '1.1rem' }}>Customer</h3>
                  <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '10px' }}>Customer portal access only</p>
                  <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '0.9rem' }}>
                    <li>Customer Portal - Access customer-specific features</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {showSaveConfirmation && (
        <div className="modal-overlay" onClick={() => setShowSaveConfirmation(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Save Changes</h2>
              <button onClick={() => setShowSaveConfirmation(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to save changes for <strong>{editUser?.full_name}</strong>?</p>
              <div className="changes-summary" style={{ margin: '15px 0', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <h4>Changes to be saved:</h4>
                <ul style={{ marginLeft: '20px' }}>
                  {editFormData.first_name !== editUser?.first_name && (
                    <li>First Name: {editUser?.first_name || 'N/A'} → {editFormData.first_name || 'N/A'}</li>
                  )}
                  {editFormData.last_name !== editUser?.last_name && (
                    <li>Last Name: {editUser?.last_name || 'N/A'} → {editFormData.last_name || 'N/A'}</li>
                  )}
                  {editFormData.email !== editUser?.email && (
                    <li>Email: {editUser?.email || 'N/A'} → {editFormData.email || 'N/A'}</li>
                  )}
                  {editFormData.department !== editUser?.department && (
                    <li>Department: {editUser?.department || 'N/A'} → {editFormData.department || 'N/A'}</li>
                  )}
                  {editFormData.location !== editUser?.location && (
                    <li>Location: {editUser?.location || 'N/A'} → {editFormData.location || 'N/A'}</li>
                  )}
                  {editFormData.employee_number !== editUser?.employee_number && (
                    <li>Employee Number: {editUser?.employee_number || 'N/A'} → {editFormData.employee_number || 'N/A'}</li>
                  )}
                  {editFormData.cost_center_number !== editUser?.cost_center_number && (
                    <li>Cost Center: {editUser?.cost_center_number || 'N/A'} → {editFormData.cost_center_number || 'N/A'}</li>
                  )}
                </ul>
              </div>
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowSaveConfirmation(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ marginLeft: '10px' }} 
                  onClick={() => {
                    setShowSaveConfirmation(false);
                    updateUserDetails();
                  }}
                >
                  Yes, Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
