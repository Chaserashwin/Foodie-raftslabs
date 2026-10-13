export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateCustomerForm(values: {
  name: string;
  phone: string;
  address: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const trimmedName = values.name.trim();
  if (!trimmedName) {
    errors.name = 'Please enter your full name';
  } else if (trimmedName.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (trimmedName.length > 100) {
    errors.name = 'Name cannot exceed 100 characters';
  }

  const trimmedPhone = values.phone.trim();
  const phonePattern = /^(?:(?:\+|00)91[\s.-]?|0)?[6-9]\d{9}$/;
  if (!trimmedPhone) {
    errors.phone = 'Please enter your phone number';
  } else if (!phonePattern.test(trimmedPhone)) {
    errors.phone = 'Please enter a valid 10-digit mobile number (e.g. 9876543210 or +91 9876543210)';
  }

  const trimmedAddress = values.address.trim();
  if (!trimmedAddress) {
    errors.address = 'Please enter your complete delivery address';
  } else if (trimmedAddress.length < 5) {
    errors.address = 'Address must be at least 5 characters with street & landmark';
  } else if (trimmedAddress.length > 300) {
    errors.address = 'Address cannot exceed 300 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
