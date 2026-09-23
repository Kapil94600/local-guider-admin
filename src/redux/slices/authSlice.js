// src/redux/slices/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../../config/firebase";
import apiClient from "../../api/axios";

// ═══════════════════════════════════════════
// ✅ FIX A-2: Session storage instead of module-level
// (Multi-tab safe, survives HMR)
// ═══════════════════════════════════════════
const SESSION_KEYS = {
  PHONE: "otp_phone",
  SENT_AT: "otp_sent_at",
};

// ✅ Only ADMIN allowed (matches backend)
const ALLOWED_ADMIN_ROLES = ["ADMIN"];

// ═══════════════════════════════════════════
// Send OTP — Firebase Phone Auth
// ═══════════════════════════════════════════
export const sendOtpThunk = createAsyncThunk(
  "auth/sendOtp",
  async (phone, { rejectWithValue }) => {
    try {
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      console.log("📱 Firebase OTP to:", formattedPhone);

      // ═══════════════════════════════════════════
      // ✅ FIX A-2: Cleanup any existing verifier
      // ═══════════════════════════════════════════
      const existingVerifier = window.__recaptchaVerifier;
      if (existingVerifier) {
        try {
          existingVerifier.clear();
          console.log("🧹 Old verifier cleared");
        } catch (e) {
          // ignore
        }
        window.__recaptchaVerifier = null;
      }

      // Container recreate
      const oldContainer = document.getElementById("recaptcha-container");
      if (oldContainer) {
        const parent = oldContainer.parentNode;
        const newContainer = document.createElement("div");
        newContainer.id = "recaptcha-container";
        parent.replaceChild(newContainer, oldContainer);
        console.log("🧹 Container recreated");
      }

      // DOM settle hone do
      await new Promise((resolve) => setTimeout(resolve, 500));

      // ✅ Visible reCAPTCHA
      const verifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "normal",
          callback: () => {
            console.log("✅ reCAPTCHA solved by user");
          },
          "expired-callback": () => {
            console.log("⚠️ reCAPTCHA expired");
            if (window.__recaptchaVerifier) {
              try {
                window.__recaptchaVerifier.clear();
              } catch (e) {
                // ignore
              }
              window.__recaptchaVerifier = null;
            }
          },
        }
      );

      await verifier.render();
      console.log("🎨 reCAPTCHA rendered");

      // ✅ Send OTP
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        verifier
      );

      // ✅ Store verifier in window (per-tab, per-session)
      window.__recaptchaVerifier = verifier;
      window.__confirmationResult = confirmationResult;

      // ✅ Save phone + timestamp in sessionStorage (per-tab)
      sessionStorage.setItem(SESSION_KEYS.PHONE, formattedPhone);
      sessionStorage.setItem(SESSION_KEYS.SENT_AT, Date.now().toString());

      console.log("✅ Firebase OTP sent");
      return { phone: formattedPhone };
    } catch (error) {
      console.error("❌ Send OTP error:", error);

      // Cleanup on error
      if (window.__recaptchaVerifier) {
        try {
          window.__recaptchaVerifier.clear();
        } catch (e) {
          // ignore
        }
        window.__recaptchaVerifier = null;
      }

      let msg = error.message || "Failed to send OTP";
      if (error.code === "auth/invalid-app-credential") {
        msg = "reCAPTCHA verification failed. Refresh page and try again.";
      } else if (error.code === "auth/too-many-requests") {
        msg = "Too many attempts. Please wait 1 hour and try again.";
      } else if (error.code === "auth/captcha-check-failed") {
        msg = "reCAPTCHA failed. Please refresh page and try again.";
      } else if (error.code === "auth/invalid-phone-number") {
        msg = "Invalid phone number format.";
      }

      return rejectWithValue(msg);
    }
  }
);

// ═══════════════════════════════════════════
// Verify OTP — Firebase + Backend
// ═══════════════════════════════════════════
export const verifyOtpThunk = createAsyncThunk(
  "auth/verifyOtp",
  async ({ phone, otp }, { rejectWithValue }) => {
    try {
      // ✅ Get confirmationResult from window
      const confirmationResult = window.__confirmationResult;
      if (!confirmationResult) {
        throw new Error("Please request OTP first");
      }

      // Firebase confirm
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();
      console.log("✅ Firebase ID Token received");

      // Backend
      const res = await apiClient.post("/auth/firebase-login", { idToken });
      const data = res.data;

      const accessToken = data.data?.accessToken || data.accessToken;
      const refreshToken = data.data?.refreshToken || data.refreshToken;
      const user = data.data?.user || data.user;

      if (!accessToken || !user) {
        throw new Error("Missing accessToken or user");
      }

      // ═══════════════════════════════════════════
      // ✅ Admin role check
      // ═══════════════════════════════════════════
      if (!ALLOWED_ADMIN_ROLES.includes(user.role)) {
        throw new Error("Access denied. Admin only.");
      }

      // Tokens save karo
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      // ✅ Cleanup
      window.__confirmationResult = null;
      if (window.__recaptchaVerifier) {
        try {
          window.__recaptchaVerifier.clear();
        } catch (e) {
          // ignore
        }
        window.__recaptchaVerifier = null;
      }

      // Session storage cleanup
      sessionStorage.removeItem(SESSION_KEYS.PHONE);
      sessionStorage.removeItem(SESSION_KEYS.SENT_AT);

      console.log("✅ Admin login successful:", user.id);
      return { user, accessToken, refreshToken };
    } catch (error) {
      console.error("❌ Verify OTP error:", error);

      let msg = error.message || "Invalid OTP";
      if (error.code === "auth/invalid-verification-code") {
        msg = "Invalid OTP. Please check and try again.";
      } else if (error.code === "auth/code-expired") {
        msg = "OTP expired. Please request a new one.";
      } else if (error.response?.data?.message) {
        msg = error.response.data.message;
      }

      return rejectWithValue(msg);
    }
  }
);

// ═══════════════════════════════════════════
// Slice
// ═══════════════════════════════════════════
const initialState = {
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("accessToken") || null,
  refreshToken: localStorage.getItem("refreshToken") || null,
  isLoading: false,
  error: null,
  otpSent: false,
  phone: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetOtpState: (state) => {
      state.otpSent = false;
      state.phone = "";
      state.error = null;

      // ✅ FIX A-2: Cleanup window-level state
      window.__confirmationResult = null;
      if (window.__recaptchaVerifier) {
        try {
          window.__recaptchaVerifier.clear();
        } catch (e) {
          // ignore
        }
        window.__recaptchaVerifier = null;
      }

      // Session storage cleanup
      sessionStorage.removeItem(SESSION_KEYS.PHONE);
      sessionStorage.removeItem(SESSION_KEYS.SENT_AT);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.otpSent = false;
      state.phone = "";
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      // ✅ Cleanup
      window.__confirmationResult = null;
      if (window.__recaptchaVerifier) {
        try {
          window.__recaptchaVerifier.clear();
        } catch (e) {
          // ignore
        }
        window.__recaptchaVerifier = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Send OTP
      .addCase(sendOtpThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOtpThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpSent = true;
        state.phone = action.payload.phone;
      })
      .addCase(sendOtpThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Verify OTP
      .addCase(verifyOtpThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtpThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.otpSent = false;
      })
      .addCase(verifyOtpThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, resetOtpState, logout } = authSlice.actions;
export default authSlice.reducer;