import React, { useState, useEffect } from 'react';  
import Sidebar from './Sidebar';  
import Header from './Header';  
import '../../assets/css/layout.css';  
  
const Layout = ({ children }) => {  
  const [sidebarActive, setSidebarActive] = useState(window.innerWidth >= 768);  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);  
  
  useEffect(() => {  
    const handleResize = () => {  
      const mobile = window.innerWidth < 768;  
      setIsMobile(mobile);  
          
      if (mobile && sidebarActive) {  
        setSidebarActive(false);  
      }  
    };  
  
    window.addEventListener('resize', handleResize);  
    handleResize();  
        
    return () => window.removeEventListener('resize', handleResize);  
  }, [sidebarActive]);  
  
  const toggleSidebar = () => {  
    setSidebarActive(!sidebarActive);  
  };  
  
  return (  
    <div className="wrapper">  
      <div className="header-container">  
        <Header toggleSidebar={toggleSidebar} />  
      </div>  
      <div className="main-container">  
        <div className={`sidebar-wrapper ${sidebarActive ? 'active' : 'collapsed'}`}>  
          <Sidebar collapsed={!sidebarActive} />  
        </div>  
        <div className={`content-wrapper ${sidebarActive ? '' : 'expanded'}`}>  
          <main className="main-content">  
            {children}  
          </main>  
        </div>  
      </div>  
    </div>  
  );  
};  
  
export default Layout;
