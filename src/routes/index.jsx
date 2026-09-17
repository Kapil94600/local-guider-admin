// src/routes/index.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import MainLayout from '../layouts/MainLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Reports from '../pages/Reports';
import Users from '../pages/Users';
import UserDetails from '../pages/UserDetails';
import Guiders from '../pages/Guiders';
import GuiderDetails from '../pages/GuiderDetails';
import GuiderCreate from '../pages/GuiderCreate';
import Photographers from '../pages/Photographers';
import PhotographerDetails from '../pages/PhotographerDetails';
import PhotographerCreate from '../pages/PhotographerCreate';
import Places from '../pages/Places';
import PlaceDetails from '../pages/PlaceDetails';
import PlaceCreate from '../pages/PlaceCreate';
import Sliders from '../pages/Sliders';
import Offers from '../pages/Offers';
import IdCards from '../pages/IdCards';
import Reviews from '../pages/Reviews';
import Bookings from '../pages/Bookings';
import BookingDetails from '../pages/BookingDetails';
import Payments from '../pages/Payments';
import RoleRequests from '../pages/RoleRequests';
import Notifications from '../pages/Notifications';
import Settings from '../pages/Settings';
import ChatManagement from '../pages/ChatManagement';
import WalletManagement from '../pages/WalletManagement';
import WithdrawalRequests from '../pages/WithdrawalRequests';
// ✅ Favorites import removed

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:id" element={<UserDetails />} />
        <Route path="guiders" element={<Guiders />} />
        <Route path="guiders/create" element={<GuiderCreate />} />
        <Route path="guiders/:id" element={<GuiderDetails />} />
        <Route path="photographers" element={<Photographers />} />
        <Route path="photographers/create" element={<PhotographerCreate />} />
        <Route path="photographers/:id" element={<PhotographerDetails />} />
        <Route path="places" element={<Places />} />
        <Route path="places/create" element={<PlaceCreate />} />
        <Route path="places/:id" element={<PlaceDetails />} />
        <Route path="sliders" element={<Sliders />} />
        <Route path="offers" element={<Offers />} />
        <Route path="id-cards" element={<IdCards />} />
        <Route path="reviews" element={<Reviews />} />
        {/* ✅ Favorites route removed */}
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/:id" element={<BookingDetails />} />
        <Route path="payments" element={<Payments />} />
        <Route path="wallets" element={<WalletManagement />} />
        <Route path="withdrawals" element={<WithdrawalRequests />} />
        <Route path="role-requests" element={<RoleRequests />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="chat" element={<ChatManagement />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;