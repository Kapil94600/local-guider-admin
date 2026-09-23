// src/hooks/useSocket.js
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setReviewPopup } from "../redux/slices/reviewSlice";
import { fetchWallet } from "../redux/slices/walletSlice";
import { fetchNotifications } from "../redux/slices/notificationsSlice";
import { getSocket } from "../socket/socket"; // ✅ SHARED socket

/**
 * ✅ useSocket — uses SHARED socket from socketService
 *
 * ✅ FIX A-4: Does NOT create a new socket (would cause duplicate connections)
 * Instead, uses the singleton from socketService.js
 *
 * Attaches listeners for:
 *   - booking:completed → triggers review popup
 *   - booking:paid → refreshes wallet
 *   - booking:updated → refreshes notifications
 *
 * Usage:
 *   useSocket(); // in any screen or component
 */
export const useSocket = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    // ✅ Use SHARED socket (do not create new)
    const socket = getSocket();
    if (!socket) {
      console.warn("⚠️ useSocket: shared socket not available");
      return;
    }

    // Named handlers for proper cleanup
    const handleBookingCompleted = (data) => {
      console.log("📩 useSocket: booking:completed", data);
      if (data?.bookingId) {
        dispatch(setReviewPopup({ bookingId: data.bookingId, open: true }));
      }
    };

    const handleBookingPaid = (data) => {
      console.log("💰 useSocket: booking:paid", data);
      dispatch(fetchWallet());
      dispatch(fetchNotifications());
    };

    const handleBookingUpdated = (data) => {
      console.log("🔄 useSocket: booking:updated", data);
      dispatch(fetchNotifications());
    };

    socket.on("booking:completed", handleBookingCompleted);
    socket.on("booking:paid", handleBookingPaid);
    socket.on("booking:updated", handleBookingUpdated);

    return () => {
      // ✅ Only remove OUR listeners — do not disconnect
      socket.off("booking:completed", handleBookingCompleted);
      socket.off("booking:paid", handleBookingPaid);
      socket.off("booking:updated", handleBookingUpdated);
    };
  }, [isAuthenticated, user?.id, dispatch]);
};

export default useSocket;