// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { logout } from "../redux/slices/authSlice";
import { isAdminRole } from "../constants/roles"; // ✅ FIX C-5

const ProtectedRoute = ({ children }) => {
  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (token && !user) {
      dispatch(logout());
    }
  }, [token, user, dispatch]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ FIX C-5: Use shared constant
  if (!isAdminRole(user.role)) {
    return <Navigate to="/login?error=unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;