import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UserManagement from './UserManagement';
import EditDataPage from './EditDataPage';
import '../../assets/css/admin.css';

const AdminDashboard = () => {
  const { user, canManageUsers } = useAuth();
  const location = useLocation();

  if (!canManageUsers()) {
    return (
      <div className="admin-access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to access the admin panel.</p>
      </div>
    );
  }

  const adminSections = [
    {
      path: '/admin/users',
      name: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      permission: 'user.management',
      icon: '�'
    },
    {
      path: '/admin/edit-data', 
      name: 'Edit Data',
      description: 'Modify and manage build or system data',
      permission: 'edit.data',
      icon: '✏️'
    }
  ];

  const availableSections = adminSections.filter(section => 
    canManageUsers()
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Administration Panel</h1>
        <p>Welcome back, {user.full_name}. Manage your AMD PDQD settings.</p>
      </div>

      <Routes>
        <Route path="/" element={
          <div className="admin-overview">
            <div className="admin-grid">
              {availableSections.map(section => (
                <Link 
                  key={section.path} 
                  to={section.path} 
                  className="admin-card"
                >
                  <div className="admin-card-icon">{section.icon}</div>
                  <h3>{section.name}</h3>
                  <p>{section.description}</p>
                </Link>
              ))}
            </div>
            
            {availableSections.length === 0 && (
              <div className="no-sections">
                <h3>No Admin Sections Available</h3>
                <p>You don't have permission to access any admin sections.</p>
              </div>
            )}
          </div>
        } />
        
        <Route path="/users" element={<UserManagement />} />
        <Route path="edit-data" element={<EditDataPage />} />
        
        <Route path="/system" element={
          <div className="admin-placeholder">
            <h2>System Settings</h2>
            <p>System configuration interface coming soon...</p>
          </div>
        } />
        
        <Route path="/logs" element={
          <div className="admin-placeholder">
            <h2>System Logs</h2>
            <p>Log viewer interface coming soon...</p>
          </div>
        } />
        
        <Route path="/permissions" element={
          <div className="admin-placeholder">
            <h2>Permission Management</h2>
            <p>Permission configuration interface coming soon...</p>
          </div>
        } />
        
        {/* Redirect any unknown admin routes to admin home */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  );
};

export default AdminDashboard;
