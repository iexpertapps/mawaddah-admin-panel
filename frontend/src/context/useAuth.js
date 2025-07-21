import { useContext } from 'react';
import AuthContext from './AuthContext';

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.trace('useAuth called outside AuthProvider');
    throw new Error(
      'useAuth must be used within an AuthProvider.\n' +
      'This error usually occurs when a component calls useAuth() outside the <AuthProvider> tree.\n' +
      'To fix: Wrap your application in <AuthProvider> at the root (e.g., in main.jsx or App.jsx).'
    );
  }
  return context;
};

export default useAuth; 