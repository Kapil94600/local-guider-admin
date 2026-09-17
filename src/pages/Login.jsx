// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaPhoneAlt, FaKey, FaArrowRight, FaShieldAlt } from 'react-icons/fa';
import {
  sendOtpThunk,
  verifyOtpThunk,
  clearError,
  resetOtpState,
} from '../redux/slices/authSlice';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, otpSent, phone, token, user } = useSelector(
    (state) => state.auth
  );
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (token && user) {
      console.log('✅ Logged in — redirecting to dashboard');
      navigate('/', { replace: true });
    }
    dispatch(clearError());
    return () => dispatch(resetOtpState());
  }, [dispatch, token, user, navigate]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (mobile.length < 10) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    const result = await dispatch(sendOtpThunk(mobile));
    if (sendOtpThunk.fulfilled.match(result)) {
      toast.success('OTP sent successfully');
    } else {
      toast.error(result.payload || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error('Enter 6-digit OTP');
      return;
    }

    const formattedPhone = mobile.startsWith('+') ? mobile : `+91${mobile}`;

    const result = await dispatch(
      verifyOtpThunk({ phone: formattedPhone, otp })
    );

    if (verifyOtpThunk.fulfilled.match(result)) {
      toast.success('Login successful');
    } else {
      toast.error(result.payload || 'Verification failed');
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-10 right-20 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl" />
        <div className="absolute bottom-10 left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-2xl" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md z-10">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="text-5xl font-extrabold text-white drop-shadow-lg mb-2">
                🌍 Local Guider
              </div>
              <h2 className="text-3xl font-bold text-white">Admin Login</h2>
              <p className="text-blue-200 mt-1 text-sm font-light">
                Secure access to your admin dashboard
              </p>
              <div className="flex justify-center mt-3">
                <FaShieldAlt className="text-emerald-400 text-xl" />
              </div>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-blue-200 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhoneAlt className="text-blue-300" />
                    </div>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 10-digit number"
                      maxLength="10"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-blue-300 outline-none"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold text-lg shadow-lg disabled:opacity-70"
                >
                  {isLoading ? (
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      Send OTP <FaArrowRight size={18} />
                    </>
                  )}
                </button>
                <p className="text-xs text-blue-300 mt-4 text-center">
                  We'll send a 6-digit OTP to verify your number.
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div className="mb-4">
                  <p className="text-sm text-blue-200">
                    OTP sent to{' '}
                    <span className="font-semibold text-white">{phone}</span>
                  </p>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-blue-200 mb-1">
                    Enter OTP
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaKey className="text-blue-300" />
                    </div>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit OTP"
                      maxLength="6"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-blue-300 outline-none"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-cyan-500 text-gray-900 py-3 rounded-xl font-semibold text-lg shadow-lg disabled:opacity-70"
                >
                  {isLoading ? (
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent" />
                  ) : (
                    <>
                      Verify & Login <FaArrowRight size={18} />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => dispatch(resetOtpState())}
                  className="w-full mt-3 text-sm text-blue-300 hover:text-white transition"
                >
                  Change Number
                </button>
              </form>
            )}

            {/* ⚡⚡ reCAPTCHA container — YE ZAROORI HAI ⚡⚡ */}
            <div
              id="recaptcha-container"
              style={{
                marginTop: '15px',
                minHeight: '80px',
                display: 'flex',
                justifyContent: 'center',
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;