import { createBrowserRouter } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import Login from "../../pages/auth/Login";
import Dashboard from "../../pages/admin/Dashboard";
import Users from "../../pages/admin/Users";
import Appeals from "../../pages/admin/Appeals";
import Donations from "../../pages/admin/Donations";
import Settings from "../../pages/admin/Settings";
import Profile from "../../pages/admin/Profile";
import NotFound from "../../pages/NotFound";
import ErrorBoundary from "../ErrorBoundary";
import WalletPage from '../../pages/admin/wallet';
import ProtectedRoute from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "users",
        element: <Users />,
      },
      {
        path: "appeals",
        element: <Appeals />,
      },
      {
        path: "donations",
        element: <Donations />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: 'wallet',
        element: <WalletPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
    errorElement: <ErrorBoundary />,
  },
]); 