import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import './CartDrawer.css';

const CartDrawer = () => {
    const navigate = useNavigate();
    const {
        cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart,
        subtotal, total, taxAmount, orderNotes, setOrderNotes, table
    } = useCart();

    if (!isCartOpen) return null;

    const handleGoToCheckout = () => {
        setIsCartOpen(false);
        navigate('/checkout');
    };

    const handleRemoveItem = (cartItemId, itemName) => {
        if (window.confirm(`Remove "${itemName}" from cart?`)) {
            removeFromCart(cartItemId);
        }
    };

    return (
        <div className="cart-drawer-overlay">
            <div className="cart-drawer-backdrop" onClick={() => setIsCartOpen(false)}></div>
            <div className="cart-drawer-content">
                <div className="cart-drawer-header">
                    <h2>Your Cart {table && <span className="table-badge">Table {table.tableNumber}</span>}</h2>
                    <button className="close-drawer" onClick={() => setIsCartOpen(false)} aria-label="Close cart">&times;</button>
                </div>

                <div className="cart-items-list">
                    {cart.length === 0 ? (
                        <div className="empty-cart">
                            <div className="empty-icon">🛒</div>
                            <p>Your cart is empty</p>
                            <button className="continue-btn" onClick={() => setIsCartOpen(false)}>Continue Browsing</button>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.cartItemId} className="cart-item">
                                <div className="cart-item-info">
                                    <div className="cart-item-main">
                                        <span className="cart-item-name">{item.name}</span>
                                        <span className="cart-item-price">${item.itemTotal.toFixed(2)}</span>
                                    </div>
                                    {item.selectedModifiers.length > 0 && (
                                        <div className="cart-item-modifiers">
                                            {item.selectedModifiers.map(m => m.modifierOptionName).join(', ')}
                                        </div>
                                    )}
                                    {item.specialRequest && (
                                        <div className="cart-item-special">Note: {item.specialRequest}</div>
                                    )}
                                </div>
                                <div className="cart-item-actions">
                                    <div className="quantity-controls">
                                        <button onClick={() => updateQuantity(item.cartItemId, -1)} aria-label="Decrease quantity">−</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.cartItemId, 1)} aria-label="Increase quantity">+</button>
                                    </div>
                                    <button className="remove-item" onClick={() => handleRemoveItem(item.cartItemId, item.name)} aria-label="Remove item">🗑️</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="cart-drawer-footer">
                        <div className="special-notes">
                            <label>Special instructions for the kitchen</label>
                            <textarea
                                value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)}
                                placeholder="Any dietary requirements or general notes?"
                            ></textarea>
                        </div>
                        <div className="summary-section">
                            <div className="summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                            <div className="summary-row"><span>Tax (8%)</span><span>${taxAmount.toFixed(2)}</span></div>
                            <div className="summary-row total"><span>Total</span><span>${total.toFixed(2)}</span></div>
                        </div>
                        <button className="place-order-btn" onClick={handleGoToCheckout}>
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;
