import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import AuthProvider from './context/AuthProvider';
import { router } from './components/router/routes';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App; 