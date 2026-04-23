import React from 'react';  
import { Link, useLocation } from 'react-router-dom';  
import { useAuth } from '../../contexts/AuthContext';
import '../../assets/css/sidebar.css';  
import {
  LayoutDashboard,
  PlayCircle,
  Forward,
  Search,
  FileText,
  AlertTriangle,
  Clipboard,
  Users,
  Headphones,
  Edit,
  RotateCcw 
} from 'lucide-react';  
  
const Sidebar = ({ collapsed }) => {  
  const location = useLocation();  
  const { 
    canAccessDashboard, 
    canAccessSearch, 
    canAccessCLF, 
    canStartBuild, 
    canContinueBuild, 
    canViewBuilds, 
    canManageUsers,
    canAccessCustomerPortal,
    user 
  } = useAuth();
  
  // Main menu items based on permissions
  const mainMenu = [
    { 
      path: '/', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      show: canAccessDashboard() 
    },
    { 
      path: '/search-records', 
      label: 'Search', 
      icon: Search, 
      show: canAccessSearch() 
    },
  ].filter(item => item.show);
  
  // SH (Smart Hand) menu items based on permissions
  const shMenu = [
    {
      path: '/start-build',
      label: 'Start Build',
      icon: PlayCircle,
      show: canStartBuild()
    },
    {
      path: '/continue-build',
      label: 'Continue',
      icon: Forward,
      show: canContinueBuild()
    },
    {
      path: '/edit-build-data',
      label: 'Edit Build',
      icon: Edit,
      show: canViewBuilds()
    },
    {
      path: '/master-build',
      label: 'Allocation',
      icon: Clipboard,
      show: canViewBuilds()
    },
    {
      path: '/rma',
      label: 'RMA',
      icon: RotateCcw,
      show: canStartBuild() // or create canAccessRMA()
    },
  ].filter(item => item.show);

  // Customer menu items based on permissions
  const customerMenu = [
    { 
      path: '/customer-portal', 
      label: 'Customer Portal', 
      icon: Headphones, 
      show: canAccessCustomerPortal() 
    },
    { 
      path: '/customer-escalation', 
      label: 'CLF', 
      icon: AlertTriangle, 
      show: canAccessCLF() 
    },
    { 
      path: '/waiver-form', 
      label: 'Waiver Form', 
      icon: FileText, 
      show: canAccessCustomerPortal()   // or create a new permission if needed
    },
  ].filter(item => item.show);

  // Admin menu if user can manage users
  const adminMenu = canManageUsers() ? [
    { path: '/admin/users', label: 'User Management', icon: Users },
  ] : [];

  return (
    <nav className="sidebar">
      <ul className="sidebar-menu">

        {/* Main menu */}
        {mainMenu.map((item) => (
          <li key={item.path} className={location.pathname === item.path ? 'active' : ''}>
            <Link to={item.path} title={item.label}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
        
        {/* SH Menu - only show header if there are items */}
        {shMenu.length > 0 && (
          <>
            <li className="sidebar-section-header">
              <span>SH USE</span>
            </li>
            {shMenu.map((item) => (
              <li key={item.path} className={location.pathname === item.path ? 'active' : ''}>
                <Link to={item.path} title={item.label}>
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </>
        )}
        
        {/* Customer menu */}
        {customerMenu.length > 0 && (
          <>
            <li className="sidebar-section-header">
              <span>Customer USE</span>
            </li>
            {customerMenu.map((item) => (
              <li key={item.path} className={location.pathname === item.path ? 'active' : ''}>
                <Link to={item.path} title={item.label}>
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </>
        )}
        
        {/* Admin menu */}
        {adminMenu.length > 0 && (
          <>
            <li className="sidebar-section-header">
              <span>Admin USE</span>
            </li>
            {adminMenu.map((item) => (
              <li key={item.path} className={location.pathname === item.path ? 'active' : ''}>
                <Link to={item.path} title={item.label}>
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </>
        )}

        {/* Show message if user has no permissions */}
        {mainMenu.length === 0 && shMenu.length === 0 && customerMenu.length === 0 && adminMenu.length === 0 && (
          <li className="sidebar-no-access">
            <span>No access assigned. Contact iqadashboard.support@amd.com.</span>
          </li>
        )}
      </ul>
      <div className="sidebar-footer">
      </div>
    </nav>
  );
};  
  
export default Sidebar;
