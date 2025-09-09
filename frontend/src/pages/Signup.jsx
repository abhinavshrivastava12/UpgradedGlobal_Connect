import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import { authDataContext } from '../context/AuthContext';
import { userDataContext } from '../context/userContext';

function Signup() {
  const navigate = useNavigate();
  const { serverUrl } = useContext(authDataContext);
  const { setUserData } = useContext(userDataContext);
  
  const [step, setStep] = useState(1);
  const [show, setShow] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: ""
  });

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (err) setErr("");
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setSuccess("");

    try {
      await axios.post(`${serverUrl}/api/auth/send-signup-otp`, formData, { withCredentials: true });
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

      // Auto focus next input
      if (value && index < 5) {
        const nextInput = document.querySelector(`input[name="otp-${index + 1}"]`);
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
        `${serverUrl}/api/auth/verify-signup-otp`,
        { email: formData.email, otp: otpString },
        { withCredentials: true }
      );
      setSuccess(result.data.message);
      setUserData(result.data.user);
      navigate("/");
    } catch (error) {
      setErr(error.response?.data?.message || "Invalid OTP or verification failed");
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
        { email: formData.email, type: 'signup' },
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

  const navigateToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-100 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Step indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step >= 1 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <div className={`w-12 h-0.5 transition-all ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step >= 2 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {step === 1 ? 'Create Account' : 'Verify Email'}
            </h1>
            <p className="text-gray-600 mt-2">
              {step === 1 ? 'Join us today and get started' : `Enter the 6-digit code sent to ${formData.email}`}
            </p>
          </div>

          {/* Success message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3 animate-pulse">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Error message */}
          {err && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 animate-pulse">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 text-sm">{err}</p>
            </div>
          )}

          {step === 1 ? (
            /* Step 1: Registration Form */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="First Name"
                    required
                    className="w-full h-12 pl-12 pr-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all group-hover:shadow-md"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-blue-500" />
                </div>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Last Name"
                    required
                    className="w-full h-12 pl-12 pr-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all group-hover:shadow-md"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-blue-500" />
                </div>
              </div>

              <div className="relative group">
                <input
                  type="text"
                  placeholder="Username"
                  required
                  className="w-full h-12 pl-12 pr-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all group-hover:shadow-md"
                  value={formData.userName}
                  onChange={(e) => handleInputChange('userName', e.target.value)}
                />
                <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-blue-500" />
              </div>

              <div className="relative group">
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  className="w-full h-12 pl-12 pr-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all group-hover:shadow-md"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-blue-500" />
              </div>

              <div className="relative group">
                <input
                  type={show ? "text" : "password"}
                  placeholder="Password"
                  required
                  className="w-full h-12 pl-12 pr-12 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all group-hover:shadow-md"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-blue-500" />
                <button
                  type="button"
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
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
            /* Step 2: OTP Verification */
            <div className="space-y-6">
              <div className="flex justify-center space-x-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    name={`otp-${index}`}
                    maxLength="1"
                    className="w-12 h-12 text-center text-xl font-bold bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:shadow-md"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && index > 0) {
                        const prevInput = document.querySelector(`input[name="otp-${index - 1}"]`);
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
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Verify & Create Account</span>
                )}
              </button>

              <div className="text-center space-y-3">
                <p className="text-gray-600 text-sm">Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendLoading}
                  className="text-blue-500 hover:text-blue-600 font-medium text-sm flex items-center justify-center space-x-1 mx-auto transition-colors hover:underline"
                >
                  {resendLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Resend OTP</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Sign in link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <button
                onClick={navigateToLogin}
                className="text-blue-500 hover:text-blue-600 font-medium transition-colors hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;