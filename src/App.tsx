import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/Login';
import PublicBooking from '@/pages/PublicBooking';
import AdminLayout from '@/layouts/AdminLayout';
import StaffLayout from '@/layouts/StaffLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { supabase } from '@/lib/supabaseClient';
import { AlertTriangle, RefreshCw } from 'lucide-react';


const App: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [forceLogin, setForceLogin] = useState(false);
  
  // Force login screen after 3 seconds if still loading (reduced from 10 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setForceLogin(true);
        console.log("Forcing login screen after timeout");
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isLoading]);
  
  // Reset forceLogin when loading state changes
  useEffect(() => {
    if (!isLoading && forceLogin) {
      console.log("Loading completed, resetting forceLogin");
      setForceLogin(false);
    }
  }, [isLoading, forceLogin]);

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public route - no authentication required */}
        <Route path="/booking" element={<PublicBooking />} />
        
        {/* Protected routes */}
        <Route path="/*" element={
          <>
            {/* Show loading spinner with faster timeout */}
            {isLoading && !forceLogin ? (
              <LoadingSpinner />
            ) : !isAuthenticated || forceLogin ? (
              <Login />
            ) : (
              <Routes>
                {user?.role === 'admin' ? (
                  <Route path="/*" element={<AdminLayout />} />
                ) : (
                  <Route path="/*" element={<StaffLayout />} />
                )}
                <Route path="*" element={<Navigate to={user?.role === 'admin' ? "/admin/dashboard" : "/"} replace />} />
              </Routes>
            )}
          </>
        } />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
