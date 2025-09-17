import React from 'react';

const FormInput = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  error, 
  placeholder, 
  className = '', 
  as = 'input',
  rows,
  children,
  ...props 
}) => {
  const baseInputClasses = `w-full px-3 py-2 border rounded-md text-sm outline-none ${
    error ? 'border-red-500' : 'border-gray-300'
  } ${className}`;

  const renderInput = () => {
    if (as === 'textarea') {
      return (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className={baseInputClasses}
          {...props}
        />
      );
    }

    if (as === 'select') {
      return (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={baseInputClasses}
          {...props}
        >
          {children}
        </select>
      );
    }

    return (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={baseInputClasses}
        {...props}
      />
    );
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {renderInput()}
      {error && (
        <div className="text-red-500 text-xs mt-1">{error}</div>
      )}
    </div>
  );
};

export default FormInput;
