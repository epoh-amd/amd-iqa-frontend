import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider, ToastContainer } from './components/Toast';
import { AuthProvider } from './contexts/AuthContext';

// Lazy load route components for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const StartBuild = React.lazy(() => import('./pages/StartBuild'));
const ContinueBuild = React.lazy(() => import('./pages/ContinueBuild'));
const EditBuildData = React.lazy(() => import('./pages/EditBuildData'));
const MasterBuild = React.lazy(() => import('./pages/MasterBuild'));
const SearchRecords = React.lazy(() => import('./pages/SearchRecords'));
const CustomerEscalation = React.lazy(() => import('./pages/CustomerEscalation'));
const CustomerPortal = React.lazy(() => import('./pages/CustomerPortal'));
const WaiverForm = React.lazy(() => import('./pages/WaiverForm'));
const Login = React.lazy(() => import('./pages/Login'));
const AuthCallback = React.lazy(() => import('./pages/AuthCallback'));
const Profile = React.lazy(() => import('./pages/Profile'));
const AdminDashboard = React.lazy(() => import('./pages/Admin'));

// Loading component
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '16px',
    color: '#666'
  }}>
    Loading...
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ErrorBoundary>
          <Router>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Protected Main Application Routes - With Layout */}
                <Route path="/*" element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={
                          <ProtectedRoute requiredPermissions={['dashboard']}>
                            <Dashboard />
                          </ProtectedRoute>
                        } />

                        <Route path="/profile" element={<Profile />} />

                        <Route path="/start-build" element={
                          <ProtectedRoute requiredPermissions={['start_build']}>
                            <StartBuild />
                          </ProtectedRoute>
                        } />

                        <Route path="/continue-build" element={
                          <ProtectedRoute requiredPermissions={['continue_build']}>
                            <ContinueBuild />
                          </ProtectedRoute>
                        } />

                        <Route path="/edit-build-data" element={
                          <ProtectedRoute requiredPermissions={['allocation']}>
                            <EditBuildData />
                          </ProtectedRoute>
                        } />

                        <Route path="/master-build" element={
                          <ProtectedRoute requiredPermissions={['allocation']}>
                            <MasterBuild />
                          </ProtectedRoute>
                        } />

                        <Route path="/search-records" element={
                          <ProtectedRoute requiredPermissions={['search']}>
                            <SearchRecords />
                          </ProtectedRoute>
                        } />

                        <Route path="/customer-escalation" element={
                          <ProtectedRoute requiredPermissions={['clf']}>
                            <CustomerEscalation />
                          </ProtectedRoute>
                        } />

                        <Route path="/customer-portal" element={
                          <ProtectedRoute requiredPermissions={['customer_portal']}>
                            <CustomerPortal />
                          </ProtectedRoute>
                        } />

                        <Route
                          path="/waiver-form"
                          element={
                            <ProtectedRoute requiredPermissions={['customer_portal']}>
                              <WaiverForm />
                            </ProtectedRoute>
                          }
                        />

                        {/* Admin Routes */}
                        <Route path="/admin/*" element={
                          <ProtectedRoute requiredPermissions={['user_management']}>
                            <AdminDashboard />
                          </ProtectedRoute>
                        } />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
            <ToastContainer />
          </Router>
        </ErrorBoundary>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;