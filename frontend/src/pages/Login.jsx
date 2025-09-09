import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  LogIn,
  Shield
} from 'lucide-react';
import axios from 'axios';
import { authDataContext } from '../context/AuthContext';
import { userDataContext } from '../context/userContext';

function Login() {
  const navigate = useNavigate();
  const { serverUrl } = useContext(authDataContext);
  const { setUserData } = useContext(userDataContext);
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setErr("Please enter your email address");
      return;
    }

    setLoading(true);
    setErr("");
    setSuccess("");

    try {
      await axios.post(`${serverUrl}/api/auth/send-login-otp`, { email }, { withCredentials: true });
      setSuccess("OTP sent to your email!");
      setStep(2);
    } catch (error) {
      setErr(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        const nextInput = document.querySelector(`input[name="login-otp-${index + 1}"]`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setErr("Please enter a complete 6-digit OTP");
      return;
    }

    setLoading(true);
    setErr("");
    setSuccess("");

    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/verify-login-otp`,
        { email, otp: otpString },
        { withCredentials: true }
      );
      setSuccess(result.data.message);
      setUserData(result.data.user);
      navigate("/");
    } catch (error) {
      setErr(error.response?.data?.message || "Invalid OTP or login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setErr("");
    setSuccess("");

    try {
      await axios.post(
        `${serverUrl}/api/auth/resend-otp`,
        { email, type: 'login' },
        { withCredentials: true }
      );
      setSuccess("OTP resent successfully!");
      setOtp(["", "", "", "", "", ""]);
    } catch (error) {
      setErr(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  const navigateToSignup = () => {
    navigate("/signup");
  };

  const goBackToEmail = () => {
    setStep(1);
    setOtp(["", "", "", "", "", ""]);
    setErr("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-50 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step >= 1 ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <div className={`w-12 h-0.5 transition-all ${step >= 2 ? 'bg-purple-500' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step >= 2 ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
              {step === 1 ? (
                <LogIn className="w-10 h-10 text-white" />
              ) : (
                <Shield className="w-10 h-10 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {step === 1 ? 'Welcome Back' : 'Verify Identity'}
            </h1>
            <p className="text-gray-600 mt-2">
              {step === 1 ? 'Sign in to your account' : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3 animate-pulse">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {err && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 animate-pulse">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 text-sm">{err}</p>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-6">
              <div className="relative group">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  required
                  className="w-full h-14 pl-12 pr-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all group-hover:shadow-md text-lg"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (err) setErr("");
                  }}
                />
                <Mail className="absolute left-4 top-4.5 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-purple-500" />
              </div>

              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 text-lg"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center space-x-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    name={`login-otp-${index}`}
                    maxLength="1"
                    className="w-12 h-12 text-center text-xl font-bold bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all hover:shadow-md"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && index > 0) {
                        const prevInput = document.querySelector(`input[name="login-otp-${index - 1}"]`);
                        if (prevInput) prevInput.focus();
                      }
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleVerifyOTP}
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 text-lg"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Verify & Sign In</span>
                )}
              </button>

              <div className="text-center space-y-3">
                <p className="text-gray-600 text-sm">Didn't receive the code?</p>
                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendLoading}
                    className="text-purple-500 hover:text-purple-600 font-medium text-sm flex items-center space-x-1 transition-colors hover:underline"
                  >
                    {resendLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Resend OTP</span>
                    )}
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={goBackToEmail}
                    className="text-gray-500 hover:text-gray-600 font-medium text-sm transition-colors hover:underline"
                  >
                    Change Email
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={navigateToSignup}
                className="text-purple-500 hover:text-purple-600 font-medium transition-colors hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;