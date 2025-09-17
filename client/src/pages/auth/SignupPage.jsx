import React from 'react';
import { useDarkMode } from '../../hooks/useDarkMode.jsx';
import RegisterForm from '../../components/auth/RegisterForm';
import DarkMode from '../../components/ui/DarkMode';
import { Logo } from '../../assets/index.js';

const SignupPage = () => {
  const { isDark } = useDarkMode();

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden py-12 transition-all duration-300 z-0 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
    }`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-32 -right-32 w-72 h-72 rounded-full opacity-20 ${
          isDark ? 'bg-indigo-500' : 'bg-indigo-400'
        }`} />
        <div className={`absolute -bottom-32 -left-32 w-72 h-72 rounded-full opacity-20 ${
          isDark ? 'bg-pink-500' : 'bg-pink-400'
        }`} />
        <div className={`absolute top-1/4 right-1/4 w-48 h-48 rounded-full opacity-15 ${
          isDark ? 'bg-blue-500' : 'bg-blue-400'
        }`} />
        <div className={`absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 ${
          isDark ? 'bg-purple-500' : 'bg-purple-400'
        }`} />
      </div>

      <div className="absolute inset-0">
        <div className={`absolute top-1/3 left-1/3 w-32 h-32 rounded-full opacity-5 animate-pulse ${
          isDark ? 'bg-cyan-500' : 'bg-cyan-400'
        }`} style={{ animationDuration: '3s' }} />
        <div className={`absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full opacity-5 animate-pulse ${
          isDark ? 'bg-yellow-500' : 'bg-yellow-400'
        }`} style={{ animationDuration: '4s', animationDelay: '1s' }} />
      </div>

      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23${isDark ? 'ffffff' : '000000'}' fill-opacity='0.05'%3E%3Cpath d='M20 20.5V18H0v-2h20v2.5zm0 2.5v2.5H0V23h20zm2-5V18h18v-2H22v2.5zm0 2.5V23h18v-2H22v2.5z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="absolute top-6 right-6 z-10">
        <DarkMode />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className={`mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl ${
            isDark 
              ? 'bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300' 
              : 'bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300'
          }`}>
            <img src={Logo} className="w-20 h-20 p-2" alt="" />
          </div>
          <h1 className={`text-3xl font-bold mb-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Sign Up
          </h1>
          <p className={`text-lg max-w-md mx-auto ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Create a new user for the staff portal.
          </p>
        </div>

        <RegisterForm />
      </div>

      <div className={`absolute top-16 left-16 w-3 h-3 rounded-full opacity-40 animate-bounce ${
        isDark ? 'bg-blue-400' : 'bg-blue-500'
      }`} style={{ animationDuration: '2s' }} />
      <div className={`absolute bottom-20 right-16 w-2 h-2 rounded-full opacity-50 animate-bounce ${
        isDark ? 'bg-purple-400' : 'bg-purple-500'
      }`} style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
      <div className={`absolute top-1/2 left-8 w-1.5 h-1.5 rounded-full opacity-60 animate-bounce ${
        isDark ? 'bg-pink-400' : 'bg-pink-500'
      }`} style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
      <div className={`absolute top-1/4 right-8 w-2.5 h-2.5 rounded-full opacity-30 animate-bounce ${
        isDark ? 'bg-indigo-400' : 'bg-indigo-500'
      }`} style={{ animationDuration: '3.5s', animationDelay: '1.5s' }} />
    </div>
  );
};

export default SignupPage;
