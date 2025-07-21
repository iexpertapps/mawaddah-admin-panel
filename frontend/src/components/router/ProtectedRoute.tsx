import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children: ReactNode;
}

interface AuthContextValue {
  user: any;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (...args: any[]) => Promise<any>;
  logout: () => Promise<void>;
  role?: string;
}

const ProtectedRoute = ({ allowedRoles = [], children }: ProtectedRouteProps) => {
  const context = useAuth();
  const { isAuthenticated, role } = (context || { isAuthenticated: false, role: '' }) as AuthContextValue;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role || '')) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute; 