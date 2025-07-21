import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext'; // Import the new provider
import { router } from './components/router/routes';

function App() {
  return (
    // Wrap the entire app in AuthProvider to make auth state available everywhere
    <AuthProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App; 