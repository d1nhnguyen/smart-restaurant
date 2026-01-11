import React from 'react';
import { useCart } from '../../contexts/CartContext';
import './CartButton.css';

const CartButton = () => {
    const { cartCount, setIsCartOpen, table } = useCart();

    // Only show if a table is selected
    if (!table) return null;

    return (
        <div className="cart-button-container" onClick={() => setIsCartOpen(true)}>
            <div className="cart-button-circle">
                <span className="cart-icon">🛒</span>
                {cartCount > 0 && (
                    <div className="cart-badge">{cartCount}</div>
                )}
            </div>
        </div>
    );
};

export default CartButton;
