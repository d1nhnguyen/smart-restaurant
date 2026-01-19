import React, { useState, useEffect } from 'react';

const UserModal = ({ user, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'STAFF',
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: '', // Don't show password in edit mode
                confirmPassword: '',
                role: user.role || 'STAFF',
            });
        }
    }, [user]);

    // Password validation helper
    const validatePassword = (password) => {
        if (!password) return false;
        const hasMinLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        return hasMinLength && hasUppercase && hasLowercase && hasNumber;
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email || !formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        // Password validation: required for new users, optional for edit
        if (!user && !formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password && !validatePassword(formData.password)) {
            newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
        }

        // Confirm password validation
        if (formData.password && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.role) {
            newErrors.role = 'Role is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Prepare data to send
        const dataToSave = { ...formData };

        // Remove confirmPassword - it's only for frontend validation
        delete dataToSave.confirmPassword;

        // Remove password if it's empty in edit mode
        if (user && !dataToSave.password) {
            delete dataToSave.password;
        }

        onSave(dataToSave);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{user ? 'Edit User' : 'Add New User'}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Name */}
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter user name"
                                className={errors.name ? 'error' : ''}
                            />
                            {errors.name && <span className="error-text">{errors.name}</span>}
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label>
                                Email <span className="required">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter email address"
                                className={errors.email ? 'error' : ''}
                            />
                            {errors.email && <span className="error-text">{errors.email}</span>}
                        </div>

                        {/* Password (only for new users or if admin wants to change) */}
                        {!user && (
                            <>
                                <div className="form-group">
                                    <label>
                                        Password <span className="required">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Min 8 chars, uppercase, lowercase, number"
                                        className={errors.password ? 'error' : ''}
                                    />
                                    {errors.password && <span className="error-text">{errors.password}</span>}
                                </div>
                                <div className="form-group">
                                    <label>
                                        Confirm Password <span className="required">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Re-enter password"
                                        className={errors.confirmPassword ? 'error' : ''}
                                    />
                                    {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                                </div>
                            </>
                        )}

                        {/* Role */}
                        <div className="form-group">
                            <label>
                                Role <span className="required">*</span>
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className={errors.role ? 'error' : ''}
                            >
                                <option value="ADMIN">Admin</option>
                                <option value="STAFF">Staff</option>
                                <option value="WAITER">Waiter</option>
                            </select>
                            {errors.role && <span className="error-text">{errors.role}</span>}
                        </div>

                        {user && (
                            <>
                                <div className="form-group">
                                    <label>
                                        New Password (optional)
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Leave empty to keep current password"
                                        className={errors.password ? 'error' : ''}
                                    />
                                    {errors.password && <span className="error-text">{errors.password}</span>}
                                    <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                                        Min 8 chars with uppercase, lowercase, and number
                                    </small>
                                </div>
                                <div className="form-group">
                                    <label>
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Re-enter new password"
                                        className={errors.confirmPassword ? 'error' : ''}
                                    />
                                    {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {user ? 'Update User' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
