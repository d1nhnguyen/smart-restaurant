import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import './CheckoutButton.css';

const CheckoutButton = () => {
    const navigate = useNavigate();
    const { unpaidOrders } = useCart();

    // DEBUG: Log unpaidOrders
    // CheckoutButton rendered

    // Only show if there are unpaid orders
    if (!unpaidOrders || unpaidOrders.length === 0) return null;

    return (
        <button
            className="checkout-floating-btn"
            onClick={() => navigate('/checkout')}
            aria-label="Go to checkout"
        >
            <span className="checkout-icon">💳</span>
            <span className="checkout-count">{unpaidOrders.length}</span>
        </button>
    );
};

export default CheckoutButton;
