import React from 'react';
import './PasswordStrengthIndicator.css';

const PasswordStrengthIndicator = ({ password }) => {
  const getStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '' };

    let score = 0;

    // Length checks
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { level: 1, label: 'Weak', color: '#e74c3c' };
    if (score <= 4) return { level: 2, label: 'Medium', color: '#f39c12' };
    return { level: 3, label: 'Strong', color: '#27ae60' };
  };

  const strength = getStrength(password);
  const percentage = (strength.level / 3) * 100;

  if (!password) return null;

  return (
    <div className="password-strength">
      <div className="password-strength-bar">
        <div
          className="password-strength-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: strength.color
          }}
        />
      </div>
      <span
        className="password-strength-label"
        style={{ color: strength.color }}
      >
        {strength.label}
      </span>
    </div>
  );
};

export default PasswordStrengthIndicator;
