import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../stores/thunks/authThunks';
import { useDarkMode } from '../../hooks/useDarkMode';
import { toast } from 'sonner';
import { motion } from 'motion/react';

const RegisterForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDark } = useDarkMode();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    jobRole: '',
    phoneNumber: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } 
    else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } 
    else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } 
    else if (!/^[a-zA-Z0-9._-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and the symbols . - _';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } 
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phoneNumber.trim() && !/^(\+?61|0)[2-478](?:[ -]?[0-9]){8}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid Australian phone number (e.g. 0412 345 678 or +61412345678)';
    }

    if (!formData.jobRole) {
      newErrors.jobRole = 'Job role is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } 
    else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } 
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
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
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const result = await dispatch(registerUser({
        fullName: formData.fullName,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        jobRole: formData.jobRole
      })).unwrap();

      if (result.success || result) {
        toast.success('Registration successful!');
        navigate('/login');
      }
    } 
    catch (error) {
      console.error('Registration error:', error);
      toast.error(error?.payload?.error || 'Registration failed');
    }
  };

  return (
    <div 
      className={`w-full max-w-2xl mx-auto p-8 rounded-2xl shadow-2xl border transition-all duration-300 ${
        isDark 
          ? 'bg-gray-800 border-gray-700 shadow-gray-900/50' 
          : 'bg-white border-gray-200 shadow-gray-200/50'
      }`}
    >
      <div className="text-center mb-8">
        <h2 className={`text-3xl font-bold mb-2 ${ isDark ? 'text-white' : 'text-gray-900' }`}>
          Create Account
        </h2>
        <p className={`text-sm ${ isDark ? 'text-gray-400' : 'text-gray-600' }`}>
          Join the staff portal to manage your work efficiently
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label 
            htmlFor="fullName" 
            className={`block text-sm font-medium ${ isDark ? 'text-gray-300' : 'text-gray-700' }`}
          >
            Full Name
          </label>
          <div className="mt-1 relative">
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              className={`block w-full rounded-md shadow-sm outline-0 px-2 py-2 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-[#947BD3] focus:border-[#947BD3]' 
                  : 'border-gray-300 focus:ring-[#947BD3] focus:border-[#947BD3]'
              }`}
              required
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.fullName}
              </p>
            )}
          </div>
        </div>

        <div>
          <label 
            htmlFor="username" 
            className={`block text-sm font-medium ${ isDark ? 'text-gray-300' : 'text-gray-700' }`}
          >
            Username
          </label>
          <div className="mt-1 relative">
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className={`block w-full rounded-md shadow-sm outline-0 px-2 py-2 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-[#947BD3] focus:border-[#947BD3]' 
                  : 'border-gray-300 focus:ring-[#947BD3] focus:border-[#947BD3]'
              }`}
              required
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.username}
              </p>
            )}
          </div>
        </div>

        <div>
          <label 
            htmlFor="email" 
            className={`block text-sm font-medium ${ isDark ? 'text-gray-300' : 'text-gray-700' }`}
          >
            Email Address
          </label>
          <div className="mt-1 relative">
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`block w-full rounded-md shadow-sm outline-0 px-2 py-2 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-[#947BD3] focus:border-[#947BD3]' 
                  : 'border-gray-300 focus:ring-[#947BD3] focus:border-[#947BD3]'
              }`}
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        <div>
          <label 
            htmlFor="phoneNumber" 
            className={`block text-sm font-medium ${ isDark ? 'text-gray-300' : 'text-gray-700' }`}
          >
            Phone Number <span className="text-gray-500 text-xs">(Optional)</span>
          </label>
          <div className="mt-1 relative">
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="text"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`block w-full rounded-md shadow-sm outline-0 px-2 py-2 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-[#947BD3] focus:border-[#947BD3]' 
                  : 'border-gray-300 focus:ring-[#947BD3] focus:border-[#947BD3]'
              }`}
              placeholder="Optional - e.g. 0412 345 678"
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.phoneNumber}
              </p>
            )}
          </div>
        </div>

        <div>
          <label 
            htmlFor="jobRole" 
            className={`block text-sm font-medium ${ isDark ? 'text-gray-300' : 'text-gray-700' }`}
          >
            Job Role
          </label>
          <div className="mt-1 relative">
            <input
              id="jobRole"
              name="jobRole"
              type="text"
              value={formData.jobRole}
              onChange={handleChange}
              className={`block w-full rounded-md shadow-sm outline-0 px-2 py-2 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-[#947BD3] focus:border-[#947BD3]' 
                  : 'border-gray-300 focus:ring-[#947BD3] focus:border-[#947BD3]'
              }`}
              required
            />
            {errors.jobRole && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.jobRole}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label 
              htmlFor="password" 
              className={`block text-sm font-medium ${ isDark ? 'text-gray-300' : 'text-gray-700' }`}
            >
              Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                className={`block w-full rounded-md shadow-sm outline-0 px-2 py-2 ${ isDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-[#947BD3] focus:border-[#947BD3]' : 'border-gray-300 focus:ring-[#947BD3] focus:border-[#947BD3]' }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${ isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600' }`}
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
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <label 
              htmlFor="confirmPassword" 
              className={`block text-sm font-medium ${ isDark ? 'text-gray-300' : 'text-gray-700' }`}
            >
              Confirm Password
            </label>
            <div className="mt-1 relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`block w-full rounded-md shadow-sm outline-0 px-2 py-2 ${ isDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-[#947BD3] focus:border-[#947BD3]' : 'border-gray-300 focus:ring-[#947BD3] focus:border-[#947BD3]' }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${ isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600' }`}
              >
                {showConfirmPassword ? (
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
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={`text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>Password must contain:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>At least 8 characters</li>
            <li>One uppercase letter</li>
            <li>One lowercase letter</li>
            <li>One number</li>
	          <li>One special character</li>
          </ul>
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.5, transition: { duration: 0.2 }}}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium cursor-pointer text-white bg-[#947BD3] hover:bg-[#7964ad] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#947BD3]`}
        >
          Create Account
        </motion.button>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link 
            to="/login" 
            className="font-medium text-[#3a1f81] hover:text-[#947BD3] dark:text-[#9a80ea] dark:hover:text-[#7964ad] transition-colors duration-200"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;
