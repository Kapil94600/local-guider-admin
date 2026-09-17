import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';

const ProtectedRoute = ({ children }) => {
  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  console.log('🔒 ProtectedRoute - token:', token, 'user:', user);

  if (!token) {
    console.log('❌ No token, redirect to login');
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    console.log('❌ Token exists but user missing, logout and redirect');
    dispatch(logout());
    return <Navigate to="/login" replace />;
  }

  // ✅ ADMIN role check enabled
  const allowedRoles = ['ADMIN', 'admin'];
  if (!allowedRoles.includes(user.role)) {
    console.log('❌ Role not allowed:', user.role);
    return <Navigate to="/login?error=unauthorized" replace />;
  }

  console.log('✅ ProtectedRoute: access granted');
  return children;
};

export default ProtectedRoute;