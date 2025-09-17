import React, { useState, useId } from 'react'; 

const icons = {
  user: "M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z",
  lock: "M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z",
  envelope: "M64 112c-8.8 0-16 7.2-16 16v22.1L220.5 291.7c22 15.2 52.8 15.2 74.8 0L464 150.1V128c0-8.8-7.2-16-16-16H64zM48 212.2V384c0 8.8 7.2 16 16 16H448c8.8 0 16-7.2 16-16V212.2L322 328.8c-38.4 26.5-86.3 26.5-124.7 0L48 212.2z",
};

const Input = ({
  label,
  placeholder,
  type = 'text', 
  iconName = 'user', 
  value,
  onChange,
}) => {
  const inputId = useId(); 

  const svgPath = icons[iconName] || icons.user;

  return (
    <div className="relative flex flex-col gap-2.5 inputContainerCustom">
      <input
        required
        id={inputId}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={onChange}
        className="border-2 border-white bg-transparent rounded-lg px-3.5 py-3 text-black font-medium outline-none caret-purple-500 transition-all duration-300 font-whitney"
      />
      <label
        htmlFor={inputId}
        className="absolute top-[-25px] left-1.5 text-white text-sm font-normal overflow-hidden transition-all duration-200 usernameLabelCustom"
      >
        {label}
      </label>
      <svg
        viewBox="0 0 448 512"
        className="absolute w-3 top-[-23px] left-[-15px] fill-purple-500 userIconCustom"
      >
        <path d={svgPath}></path> 
      </svg>
    </div>
  );
};

export default Input;