/**
 * Validation utilities for signup form fields
 */

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || !value.trim()) {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) {
    return 'Email is required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  
  return null;
}

export function validateMobileNumber(mobile: string): string | null {
  if (!mobile || !mobile.trim()) {
    return 'Mobile number is required';
  }
  
  const cleanMobile = mobile.trim().replace(/[\s\-\(\)]/g, '');
  
  if (cleanMobile.length < 10) {
    return 'Mobile number must be at least 10 digits';
  }
  
  if (!/^\+?\d+$/.test(cleanMobile)) {
    return 'Mobile number can only contain digits and optional + prefix';
  }
  
  return null;
}

export function validateAdminAccessCode(accessCode: string): string | null {
  if (!accessCode || !accessCode.trim()) {
    return 'Admin special password is required';
  }
  
  const cleanCode = accessCode.trim();
  
  if (!/^\d{6}$/.test(cleanCode)) {
    return 'Special password must be exactly 6 digits';
  }
  
  // Note: Frontend validation is for UX only; backend enforces the actual check
  return null;
}
