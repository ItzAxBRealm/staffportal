export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  return value.trim() === '';
};

export const isValidEmail = (email) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

export const isStrongPassword = (password) => {
  if (password.length < 8) return false;
  
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasNumber && hasSpecialChar;
};

export const isValidPhone = (phone) => {
  const regex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return regex.test(phone);
};

export const isValidImageType = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return file && validTypes.includes(file.type);
};

export const isValidFileSize = (file, maxSizeMB = 5) => {
  const maxSize = maxSizeMB * 1024 * 1024; 
  return file && file.size <= maxSize;
};

export const validators = {
  loginForm: (values) => {
    const errors = {};
    
    if (isEmpty(values.username)) {
      errors.username = 'Username is required';
    }
    if (isEmpty(values.password)) {
      errors.password = 'Password is required';
    }
    return errors;
  },
  
  registerForm: (values) => {
    const errors = {};
    
    if (isEmpty(values.fullName)) {
      errors.fullName = 'Full name is required';
    }
    
    if (isEmpty(values.email)) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(values.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (isEmpty(values.username)) {
      errors.username = 'Username is required';
    } else if (values.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (isEmpty(values.password)) {
      errors.password = 'Password is required';
    } else if (!isStrongPassword(values.password)) {
      errors.password = 'Password must be at least 8 characters with a number and special character';
    }
    
    if (values.confirmPassword !== values.password) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!isEmpty(values.phoneNumber) && !isValidPhone(values.phoneNumber)) {
      errors.phoneNumber = 'Invalid phone number format';
    }
    
    return errors;
  },
  
  ticketForm: (values) => {
    const errors = {};
    
    if (isEmpty(values.title)) {
      errors.title = 'Title is required';
    } else if (values.title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }
    
    if (isEmpty(values.content)) {
      errors.content = 'Content is required';
    } else if (values.content.length < 10) {
      errors.content = 'Content must be at least 10 characters';
    }
    
    return errors;
  },
  
  messageForm: (values) => {
    const errors = {};
    
    if (isEmpty(values.content)) {
      errors.content = 'Message content is required';
    }
    
    return errors;
  },
  
  announcementForm: (values) => {
    const errors = {};
    
    if (isEmpty(values.title)) {
      errors.title = 'Title is required';
    }
    if (isEmpty(values.content)) {
      errors.content = 'Content is required';
    }
    return errors;
  },
  
  faqForm: (values) => {
    const errors = {};
    
    if (isEmpty(values.question)) {
      errors.question = 'Question is required';
    }
    if (isEmpty(values.answer)) {
      errors.answer = 'Answer is required';
    }
    return errors;
  }
};

export default validators;
