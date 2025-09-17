import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { loginUser } from '../../stores/thunks/authThunks';
import { useDarkMode } from '../../hooks/useDarkMode.jsx';
import { toast } from 'sonner';
import { motion } from 'motion/react';

const LoginForm = () => {
  const dispatch = useDispatch();
  const { isDark } = useDarkMode();
  const { loading, error } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } 
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } 
    else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      localStorage.setItem('rememberMe', rememberMe.toString());

      await dispatch(loginUser(formData)).unwrap();
      
      toast.success('Login successful!');
    } 
    catch (error) {
      let errorMessage = 'Login failed';
      
      if (typeof error === 'string') {
        if (error.includes('credentials')) {
          errorMessage = 'Invalid email or password';
        } 
        else if (error.includes('not found')) {
          errorMessage = 'User not found';
        } 
        else {
          errorMessage = error;
        }
      }
      toast.error(errorMessage);
    }
  };
  
  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedEmail && savedRememberMe) {
      setFormData(prevState => ({
        ...prevState,
        email: savedEmail
      }));
      setRememberMe(true);
    }
  }, []);

  return (
    <div className={`w-full max-w-md mx-auto p-8 rounded-2xl shadow-2xl border transition-all duration-300 ${
      isDark 
        ? 'bg-gray-800 border-gray-700 shadow-gray-900/50' 
        : 'bg-white border-gray-200 shadow-gray-200/50'
    }`}>
      <div className="text-center mb-8">
        <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Welcome
        </h2>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-[#947BD3] focus:border-transparent ${
                errors.email
                  ? 'border-red-500 focus:ring-red-500'
                  : isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              required
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className={`h-5 w-5 ${
                errors.email ? 'text-red-500' : isDark ? 'text-gray-400' : 'text-gray-400'
              }`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs font-medium">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={`w-full pl-10 pr-10 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-[#947BD3] focus:border-transparent ${
                errors.password
                  ? 'border-red-500 focus:ring-red-500'
                  : isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              required
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className={`h-5 w-5 ${
                errors.password ? 'text-red-500' : isDark ? 'text-gray-400' : 'text-gray-400'
              }`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${
                isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs font-medium">{errors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={() => {
                const newValue = !rememberMe;
                setRememberMe(newValue);
                if (newValue) {
                  localStorage.setItem('userEmail', formData.email);
                } 
                else {
                  localStorage.removeItem('userEmail');
                }
              }}
              className={`h-4 w-4 rounded border-gray-300 ${isDark ? 'bg-gray-700 border-gray-600 text-[#947BD3]' : 'text-[#947BD3] focus:ring-[#947BD3]'}`}
            />
            <label
              htmlFor="remember-me"
              className={`ml-2 block text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}
            >
              Remember me
            </label>
          </div>
          <div>
            <Link
              to="/forgot-password"
              className={`text-sm font-medium ${isDark ? 'text-[#947BD3] hover:text-[#7964ad]' : 'text-[#947BD3] hover:text-[#7964ad]'}`}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="flex justify-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Don't have an account? {" "}
            <Link
              to="/register"
              className={`text-sm font-medium ${isDark ? 'text-[#947BD3] hover:text-[#7964ad]' : 'text-[#947BD3] hover:text-[#7964ad]'}`}
            >
              Create an account
            </Link>
          </p>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.5, transition: { duration: 0.2 }}}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#947BD3] hover:bg-[#7964ad] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#947BD3] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 outline-0 cursor-pointer"
        >
          {loading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </div>
          ) : (
            'Sign In'
          )}
        </motion.button>
      </form>
    </div>
  );
};

export default LoginForm;