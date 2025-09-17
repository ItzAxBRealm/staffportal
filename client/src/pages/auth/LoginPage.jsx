import React from 'react';
import { useDarkMode } from '../../hooks/useDarkMode.jsx';
import LoginForm from '../../components/auth/LoginForm';
import DarkMode from '../../components/ui/DarkMode';
import { Logo } from '../../assets/index.js';

const LoginPage = () => {
  const { isDark } = useDarkMode();

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-all duration-300 py-20 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
    }`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 ${
          isDark ? 'bg-indigo-500' : 'bg-indigo-400'
        }`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-20 ${
          isDark ? 'bg-purple-500' : 'bg-purple-400'
        }`} />
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 ${
          isDark ? 'bg-indigo-500' : 'bg-indigo-400'
        }`} />
      </div>

      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${isDark ? 'ffffff' : '000000'}' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="absolute top-6 right-6 z-10">
        <DarkMode />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div className="text-center mb-8">
          <div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${
            isDark 
              ? 'bg-gradient-to-br from-blue-300 to-purple-300' 
              : 'bg-gradient-to-br from-blue-300 to-purple-300'
          }`}>
            <img src={Logo} className="w-20 h-20 p-2" alt="" />
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Staff Portal
          </h1>
          <p className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            From Issues to Answers — Secure, Simple, Supportive.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;

