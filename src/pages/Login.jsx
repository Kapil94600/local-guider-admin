// src/pages/Login.jsx
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaPhoneAlt,
  FaArrowRight,
  FaShieldAlt,
  FaLock,
  FaCheckCircle,
  FaMapMarkedAlt,
  FaCamera,
  FaUsers,
  FaStar,
} from 'react-icons/fa';
import {
  sendOtpThunk,
  verifyOtpThunk,
  clearError,
  resetOtpState,
} from '../redux/slices/authSlice';

const OTP_LENGTH = 6;

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, otpSent, phone, token, user } = useSelector(
    (state) => state.auth
  );
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const otpRefs = useRef([]);

  useEffect(() => {
    if (token && user) {
      navigate('/', { replace: true });
    }
    dispatch(clearError());
    return () => dispatch(resetOtpState());
  }, [dispatch, token, user, navigate]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (otpSent && otpRefs.current[0]) {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [otpSent]);

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
    const otpString = otp.join('');
    if (otpString.length < OTP_LENGTH) {
      toast.error(`Enter ${OTP_LENGTH}-digit OTP`);
      return;
    }
    const formattedPhone = mobile.startsWith('+') ? mobile : `+91${mobile}`;
    const result = await dispatch(
      verifyOtpThunk({ phone: formattedPhone, otp: otpString })
    );
    if (verifyOtpThunk.fulfilled.match(result)) {
      toast.success('Login successful');
    } else {
      toast.error(result.payload || 'Verification failed');
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newOtp = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => (newOtp[i] = ch));
    setOtp(newOtp);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#070a1c]">
      {/* ═══════ BACKGROUND ═══════ */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e27] via-[#141033] to-[#070a1c]" />
        <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/25 rounded-full blur-[140px] animate-blob" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-purple-500/20 rounded-full blur-[150px] animate-blob-delay" />
        <div className="absolute top-[35%] right-[15%] w-[450px] h-[450px] bg-blue-500/15 rounded-full blur-[120px] animate-blob-slow" />
        <div className="absolute bottom-[15%] left-[10%] w-[400px] h-[400px] bg-pink-500/12 rounded-full blur-[110px] animate-blob-delay" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      {/* ═══════ MAIN ═══════ */}
      <div className="relative z-10 h-full overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">

            {/* ───── LEFT BRAND PANEL ───── */}
            <div className="hidden lg:flex flex-col justify-center text-white pr-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.12] w-fit mb-6 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-medium text-emerald-200 tracking-wide">
                  Admin Panel · v2.0
                </span>
              </div>

              <h1 className="text-5xl xl:text-6xl font-bold tracking-tight leading-[1.05] mb-5">
                Manage your
                <br />
                <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                  Local Guider
                </span>
                <br />
                empire.
              </h1>

              <p className="text-indigo-200/70 text-base leading-relaxed max-w-md mb-10">
                One dashboard for users, guides, photographers, bookings,
                payments, and everything in between — built for scale.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  { icon: FaUsers, label: 'User Management', desc: 'Roles, KYC, wallets' },
                  { icon: FaMapMarkedAlt, label: 'Live Bookings', desc: 'Track trips in real-time' },
                  { icon: FaCamera, label: 'Content Control', desc: 'Curate guides & galleries' },
                ].map((f, i) => (
                  <div
                    key={i}
                    className="group flex items-start gap-4 p-3 -ml-3 rounded-2xl hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/25 to-purple-500/25 border border-white/10 flex items-center justify-center">
                      <f.icon className="text-indigo-200 text-base" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/90">{f.label}</div>
                      <div className="text-xs text-white/50 mt-0.5">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-6 border-t border-white/[0.08]">
                <div className="flex -space-x-2">
                  {['#6366f1', '#8b5cf6', '#ec4899', '#10b981'].map((c, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full border-2 border-[#0a0e27] flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: c }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className="text-amber-400 text-[10px]" />
                    ))}
                  </div>
                  <div className="text-xs text-white/50">
                    Trusted by <span className="text-white/80 font-semibold">10,000+</span> travelers
                  </div>
                </div>
              </div>
            </div>

            {/* ───── RIGHT LOGIN CARD ───── */}
            <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
              {/* Logo — WHITE circle + WHITE rings */}
              <div className="flex justify-center mb-7">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-full blur-2xl opacity-60 animate-pulse" />
                  <div className="absolute inset-[-12px] rounded-full border-2 border-white/25" />
                  <div className="absolute inset-[-12px] rounded-full border-2 border-transparent border-t-white/80 border-r-white/40 animate-spin-slow" />
                  <div className="relative w-[96px] h-[96px] rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.18),0_14px_45px_-5px_rgba(139,92,246,0.7)] flex items-center justify-center">
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white">
                      <img
                        src="/assets/images/logo21.jpg"
                        alt="Local Guider"
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 hidden items-center justify-center text-3xl">
                        🌍
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glass card */}
              <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-white/[0.18] via-white/[0.06] to-white/[0.02] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)]">
                <div className="relative rounded-3xl bg-[#0d1130]/80 backdrop-blur-2xl p-7 sm:p-8 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

                  {/* Header */}
                  <div className="text-center mb-7 relative">
                    <h1 className="text-[26px] sm:text-3xl font-bold text-white tracking-tight">
                      {otpSent ? 'Verify your identity' : 'Welcome back'}
                    </h1>
                    <p className="text-indigo-200/60 mt-2 text-sm leading-relaxed">
                      {otpSent ? (
                        <>
                          We sent a {OTP_LENGTH}-digit code to{' '}
                          <span className="text-indigo-200 font-medium">
                            {phone || `+91 ${mobile}`}
                          </span>
                        </>
                      ) : (
                        'Sign in to continue to your admin dashboard'
                      )}
                    </p>

                    <div className="flex items-center justify-center gap-2 mt-4">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-full">
                        <FaShieldAlt className="text-emerald-400 text-[10px]" />
                        <span className="text-emerald-300 text-[11px] font-medium">Secure</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/[0.08] border border-blue-500/20 rounded-full">
                        <FaLock className="text-blue-400 text-[10px]" />
                        <span className="text-blue-300 text-[11px] font-medium">Encrypted</span>
                      </div>
                    </div>
                  </div>

                  {/* STEP 1 — MOBILE */}
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-5">
                      <div>
                        <label className="block text-[11px] font-semibold text-indigo-200/70 uppercase tracking-[0.12em] mb-2">
                          Mobile Number
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FaPhoneAlt className="text-indigo-300/60 group-focus-within:text-indigo-400 transition-colors text-sm" />
                          </div>
                          <div className="absolute inset-y-0 left-11 flex items-center pointer-events-none">
                            <span className="text-white/70 font-medium text-sm">+91</span>
                            <span className="ml-2 h-4 w-px bg-white/15" />
                          </div>
                          <input
                            type="tel"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                            placeholder="98765 43210"
                            maxLength="10"
                            autoFocus
                            required
                            className="w-full pl-[76px] pr-12 py-3.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white text-[15px] tracking-wide placeholder-white/25 outline-none focus:bg-white/[0.07] focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                          />
                          {mobile.length === 10 && (
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                              <FaCheckCircle className="text-emerald-400 animate-scale-in" />
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || mobile.length < 10}
                        className="group relative w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-[15px] text-white shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none overflow-hidden transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-300 group-hover:from-indigo-400 group-hover:via-purple-400 group-hover:to-indigo-500" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <span className="relative flex items-center gap-2">
                          {isLoading ? (
                            <>
                              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                              Sending...
                            </>
                          ) : (
                            <>
                              Send OTP
                              <FaArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                            </>
                          )}
                        </span>
                      </button>
                    </form>
                  ) : (
                    /* STEP 2 — OTP */
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                      <div>
                        <label className="block text-[11px] font-semibold text-indigo-200/70 uppercase tracking-[0.12em] mb-3 text-center">
                          Enter {OTP_LENGTH}-Digit Code
                        </label>
                        <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                          {otp.map((digit, i) => (
                            <input
                              key={i}
                              ref={(el) => (otpRefs.current[i] = el)}
                              type="text"
                              inputMode="numeric"
                              value={digit}
                              onChange={(e) => handleOtpChange(i, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              maxLength="1"
                              className={`w-11 sm:w-12 text-center text-xl font-bold rounded-xl bg-white/[0.04] border text-white outline-none transition-all duration-200
                                ${
                                  digit
                                    ? 'border-indigo-400/60 bg-indigo-500/[0.08] shadow-[0_0_0_3px_rgba(99,102,241,0.1)]'
                                    : 'border-white/[0.1]'
                                }
                                focus:border-indigo-400/70 focus:bg-white/[0.08] focus:ring-4 focus:ring-indigo-500/15
                              `}
                              style={{ height: '3.25rem' }}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || otp.join('').length < OTP_LENGTH}
                        className="group relative w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-[15px] text-white shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none overflow-hidden transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 transition-all duration-300 group-hover:from-emerald-400 group-hover:via-teal-400 group-hover:to-emerald-500" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <span className="relative flex items-center gap-2">
                          {isLoading ? (
                            <>
                              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <FaCheckCircle size={14} />
                              Verify & Login
                            </>
                          )}
                        </span>
                      </button>

                      <div className="flex items-center justify-between text-[12px] pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setOtp(Array(OTP_LENGTH).fill(''));
                            dispatch(resetOtpState());
                          }}
                          className="text-indigo-300/70 hover:text-white transition-colors font-medium"
                        >
                          ← Change number
                        </button>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isLoading}
                          className="text-indigo-300/70 hover:text-white transition-colors font-medium disabled:opacity-40"
                        >
                          Resend OTP
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ⚡⚡ reCAPTCHA container — VISIBLE inside the card ⚡⚡ */}
                  <div
                    id="recaptcha-container"
                    style={{
                      marginTop: '15px',
                      minHeight: '0px',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  ></div>

                  {/* Footer */}
                  <div className="mt-6 pt-5 border-t border-white/[0.06]">
                    <p className="text-center text-[11px] text-white/25">
                      © 2026 Local Guider · All rights reserved
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-white/30 mt-5">
                Trouble signing in?{' '}
                <span className="text-indigo-300/70 hover:text-indigo-200 cursor-pointer transition-colors">
                  Contact support
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.55; }
          33%      { transform: translate(40px, -30px) scale(1.08); opacity: 0.75; }
          66%      { transform: translate(-30px, 25px) scale(0.95); opacity: 0.5; }
        }
        .animate-blob { animation: blob 14s ease-in-out infinite; }
        .animate-blob-delay { animation: blob 16s ease-in-out infinite; animation-delay: 2s; }
        .animate-blob-slow { animation: blob 20s ease-in-out infinite; animation-delay: 4s; }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }

        @keyframes scale-in {
          0%   { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }

        /* Firebase reCAPTCHA badge ko chhota rakho */
        .grecaptcha-badge {
          visibility: hidden !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default Login;