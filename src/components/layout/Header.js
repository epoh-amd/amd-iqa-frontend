import React, { useState } from 'react';    
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import api from '../../services/api';    
import { 
  faBars, 
  faUserCircle, 
  faSignOutAlt, 
  faUser,
  faChevronDown,
  faSpinner,
  faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';    
import '../../assets/css/header.css';    
    
const Header = ({ toggleSidebar }) => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    navigate('/profile');
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const toggleUserGuide = () => {
    setShowUserGuide(!showUserGuide);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  return (    
    <header>    
      <nav className="navbar">    
        <div className="navbar-left">  
          <button type="button" className="btn sidebar-toggle" onClick={toggleSidebar}>    
            <FontAwesomeIcon icon={faBars} />    
          </button>  
        </div>  
          
        <div className="navbar-center">    
          <h3 className="app-title">Platform Delivery and Quality Dashboard</h3>     
        </div>    
          
        <div className="navbar-right">
          {loading ? (
            <div className="auth-loading">
              <FontAwesomeIcon icon={faSpinner} spin />
              <span>Loading...</span>
            </div>
          ) : user ? (
            <>
              <button
                className="help-icon-btn"
                onClick={toggleUserGuide}
                title="Help"
              >
                <FontAwesomeIcon icon={faQuestionCircle} />
                <span className="help-button-text">HELP</span>
              </button>
              <div className="user-menu-container">
              <button 
                className="user-info-button" 
                onClick={toggleUserMenu}
                disabled={loggingOut}
              >
                <FontAwesomeIcon icon={faUserCircle} />    
                <span className="username">{user.full_name || user.email}</span>
                <FontAwesomeIcon icon={faChevronDown} className={`dropdown-arrow ${showUserMenu ? 'open' : ''}`} />
              </button>
              
              {showUserMenu && (
                <div className="user-dropdown-menu">
                  <div className="user-info-section">
                    <div className="user-avatar">
                      <FontAwesomeIcon icon={faUserCircle} size="2x" />
                    </div>
                    <div className="user-details">
                      <div className="user-name">{user.full_name}</div>
                      <div className="user-email">{user.email}</div>
                      <div className="user-role">
                        <span className={`role-badge role-${user.role}`}>
                          {user.role?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="menu-divider"></div>
                  
                  <div className="menu-actions">
                    <button 
                      className="menu-item"
                      onClick={handleProfileClick}
                    >
                      <FontAwesomeIcon icon={faUser} />
                      <span>My Profile</span>
                    </button>
                    
                    <button 
                      className="menu-item logout-item"
                      onClick={handleLogout}
                      disabled={loggingOut}
                    >
                      <FontAwesomeIcon icon={loggingOut ? faSpinner : faSignOutAlt} spin={loggingOut} />
                      <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              )}
              
              {showUserGuide && (
                <div className="user-guide-modal-overlay corporate-overlay" onClick={toggleUserGuide}>
                  <div className="user-guide-modal corporate-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="user-guide-header corporate-header" style={{ background: '#1a237e', padding: '32px 24px 16px 24px', borderRadius: '8px 8px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <h2 style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '2em', letterSpacing: '1px' }}>Welcome to Platform Delivery and Quality Dashboard</h2>
                      <button className="close-btn" onClick={toggleUserGuide} style={{ color: '#fff', position: 'absolute', top: '24px', right: '32px', background: 'none', border: 'none', fontSize: '2em', cursor: 'pointer' }}>×</button>
                    </div>
                    <div className="user-guide-content corporate-content">
                      <div className="intro-section" style={{ marginBottom: '24px', color: '#263238' }}>
                        <p>
                          Powered by SCM
                        </p>
                      </div>
                      <div className="guide-section">
                        <h3 style={{ color: '#1565c0' }}>Dashboard</h3>
                        <p>Monitor real-time build delivery chart and quality dashboard</p>
                        <a href="https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/ES9jsG27wFxGvcmqzAum_LoBEJezaO2QkrQW_U7Ulx77jA?e=0oTCdw" target="_blank" rel="noopener noreferrer" className="guide-link">
                          <span style={{ background: '#1565c0', color: '#fff', padding: '6px 18px', borderRadius: '4px', fontWeight: 500, textDecoration: 'none', display: 'inline-block', boxShadow: '0 1px 4px rgba(21,101,192,0.08)' }}>View Dashboard Guide</span>
                        </a>
                      </div>
                      <div className="guide-section">
                        <h3 style={{ color: '#1565c0' }}>Start Build</h3>
                        <p>Smart Hand Technician to start a new build entry</p>
                        <a href="https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/EYYhZyl_onJJkdOT6qvcIUgBHPfy-Im142noMoi5xzU5vg?e=28epwP" target="_blank" rel="noopener noreferrer" className="guide-link">
                          <span style={{ background: '#1565c0', color: '#fff', padding: '6px 18px', borderRadius: '4px', fontWeight: 500, textDecoration: 'none', display: 'inline-block', boxShadow: '0 1px 4px rgba(21,101,192,0.08)' }}>View Start Build Guide</span>
                        </a>
                      </div>
                      <div className="guide-section">
                        <h3 style={{ color: '#1565c0' }}>Continue Build</h3>
                        <p>Smart Hand Technician to resume unfinished build entry</p>
                        <a href="https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/ESxLlFi43pVDqRzRQ1ydl5kBT1lXjledY9ZncVhu9_4Y2A?e=rgyywG" target="_blank" rel="noopener noreferrer" className="guide-link">
                          <span style={{ background: '#1565c0', color: '#fff', padding: '6px 18px', borderRadius: '4px', fontWeight: 500, textDecoration: 'none', display: 'inline-block', boxShadow: '0 1px 4px rgba(21,101,192,0.08)' }}>View Continue Build Guide</span>
                        </a>
                      </div>
                      <div className="guide-section">
                        <h3 style={{ color: '#1565c0' }}>Edit Build</h3>
                        <p>Edit the build details</p>
                        <a href="https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/EQxxWjpmGU1ImTagHNLuc6oBgd6cGvmHu7QMQzYx5jLAsg?e=RLyaxe" target="_blank" rel="noopener noreferrer" className="guide-link">
                          <span style={{ background: '#1565c0', color: '#fff', padding: '6px 18px', borderRadius: '4px', fontWeight: 500, textDecoration: 'none', display: 'inline-block', boxShadow: '0 1px 4px rgba(21,101,192,0.08)' }}>View Edit Build Guide</span>
                        </a>
                      </div>
                      <div className="guide-section">
                        <h3 style={{ color: '#1565c0' }}>Build Allocation</h3>
                        <p>Smart Hand Team to allocate the builds for delivery</p>
                        <a href="https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/EXXM_is9hUFMt8hijDmKUKsBMh71pwnzgrT6sqDtc28qcw?e=SEKpcl" target="_blank" rel="noopener noreferrer" className="guide-link">
                          <span style={{ background: '#1565c0', color: '#fff', padding: '6px 18px', borderRadius: '4px', fontWeight: 500, textDecoration: 'none', display: 'inline-block', boxShadow: '0 1px 4px rgba(21,101,192,0.08)' }}>View Build Allocation Guide</span>
                        </a>
                      </div>
                      <div className="guide-section">
                        <h3 style={{ color: '#1565c0' }}>Search Records</h3>
                        <p>Find and review the Smart Hand's historical build data</p>
                        <a href="https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/Eb1T5NHz1rdPloWMnLgRGMYBOH4zGjjCPxj_7JHnYCp5ew?e=hX60JS" target="_blank" rel="noopener noreferrer" className="guide-link">
                          <span style={{ background: '#1565c0', color: '#fff', padding: '6px 18px', borderRadius: '4px', fontWeight: 500, textDecoration: 'none', display: 'inline-block', boxShadow: '0 1px 4px rgba(21,101,192,0.08)' }}>View Search Records Guide</span>
                        </a>
                      </div>
                      <div className="guide-section">
                        <h3 style={{ color: '#1565c0' }}>CLF</h3>
                        <p>Customer Line Fallout</p>
                        <a href="https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/EfqFDzhnaJdAjqYnUPFHlQ0Boj14KIBZGQtrGuPYhW-g8Q?e=YC71qg" target="_blank" rel="noopener noreferrer" className="guide-link">
                          <span style={{ background: '#1565c0', color: '#fff', padding: '6px 18px', borderRadius: '4px', fontWeight: 500, textDecoration: 'none', display: 'inline-block', boxShadow: '0 1px 4px rgba(21,101,192,0.08)' }}>View CLF Guide</span>
                        </a>
                      </div>
                      <div className="guide-section">
                        <h3 style={{ color: '#1565c0' }}>User Role</h3>
                        <p>Expore User Role and it's permission</p>
                        <a href="https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/EWteCI6cuKhCvT8iITSbS3gBohDC8xo-06PxHvf9fr01uQ?e=x7Hku5" target="_blank" rel="noopener noreferrer" className="guide-link">
                          <span style={{ background: '#1565c0', color: '#fff', padding: '6px 18px', borderRadius: '4px', fontWeight: 500, textDecoration: 'none', display: 'inline-block', boxShadow: '0 1px 4px rgba(21,101,192,0.08)' }}>View User Role Guide</span>
                        </a>
                      </div>
                      <div className="guide-divider" style={{ borderTop: '1px solid #e0e0e0', margin: '32px 0' }}></div>
                      <div className="faq-section">
                        <h3 style={{ color: '#1565c0', textAlign: 'left' }}>Frequently Asked Questions</h3>
                        <a href="https://amdcloud.sharepoint.com/:p:/s/ServerPlatEngOps-PG_SPEO/EY6OvjBPNz9Fiu6YllwbCv8BKjsWM-PribTHgp9vDfXSnw?e=v2XaUh" target="_blank" rel="noopener noreferrer" className="guide-link">
                          <span style={{ background: '#1565c0', color: '#fff', padding: '6px 18px', borderRadius: '4px', fontWeight: 500, textDecoration: 'none', display: 'inline-block', boxShadow: '0 1px 4px rgba(21,101,192,0.08)' }}>View FAQ</span>
                        </a>
                        
                        <h3 style={{ color: '#1565c0', marginTop: '32px', textAlign: 'left' }}>Offline Build Entry Template</h3>
                        <p style={{ marginBottom: '16px', color: '#6c757d', fontSize: '14px', lineHeight: '1.5' }}>
                          Download the standardized Excel template for offline build data entry. Template includes validation rules, sample data, and comprehensive instructions.
                        </p>
                        <a 
                          href={api.getOfflineTemplateUrl()} 
                          className="guide-link"
                          style={{ display: 'inline-block', textDecoration: 'none' }}
                        >
                          <div style={{ 
                            background: '#28a745', 
                            color: '#fff', 
                            padding: '10px 20px', 
                            borderRadius: '5px', 
                            fontWeight: '500', 
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 4px rgba(40,167,69,0.2)',
                            transition: 'all 0.2s ease'
                          }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Download Template
                          </div>
                        </a>
                        <p style={{ fontSize: '12px', color: '#868e96', marginTop: '12px', fontStyle: 'italic' }}>
                          Note: Upload completed templates via the Build Allocation page when the system is operational.
                        </p>
                        
                        <div className="contact-section" style={{ marginTop: '32px' }}>
                          <h4 style={{ color: '#1565c0' }}>Contact Us</h4>
                          <a href="mailto:iqadashboard.support@amd.com" className="contact-email" style={{ color: '#1565c0', fontWeight: 500 }}>
                            iqadashboard.support@amd.com
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </>
          ) : (
            <div className="auth-required">
              <span>Not authenticated</span>
            </div>
          )}
          
        </div>    
      </nav>
    </header>    
  );    
};    
    
export default Header;  