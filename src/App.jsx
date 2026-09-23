// src/App.jsx
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import AppRoutes from "./routes";
import { logout } from "./redux/slices/authSlice";

/**
 * App Component
 *
 * ⚠️ IMPORTANT: Do NOT wrap with <Provider store={store}> here.
 *
 * The Redux Provider is already set up in `src/main.jsx`:
 *   <Provider store={store}>
 *     <ThemeProvider theme={theme}>
 *       <CssBaseline />
 *       <BrowserRouter ...>
 *         <App />
 *
 * Wrapping Provider again here would create a duplicate context
 * and cause inconsistent useSelector/useDispatch behavior.
 */
function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ═══════════════════════════════════════════════════════════════
  // ✅ FIX: Listen for `auth:logout` event from axios interceptor
  // When refresh token fails, axios dispatches this event instead
  // of doing a full page reload. This keeps SPA state alive.
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const handleLogout = () => {
      console.log("🔒 auth:logout event received — dispatching logout");
      dispatch(logout());
      navigate("/login", { replace: true });
    };

    window.addEventListener("auth:logout", handleLogout);

    return () => {
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, [dispatch, navigate]);

  return <AppRoutes />;
}

export default App;