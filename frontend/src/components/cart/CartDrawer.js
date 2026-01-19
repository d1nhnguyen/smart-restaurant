import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import './CartDrawer.css';

const CartDrawer = () => {
    const { t } = useTranslation();
    const {
        cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart,
        subtotal, total, taxAmount, orderNotes, setOrderNotes, table, placeOrder,
        isSubmitting
    } = useCart();

    if (!isCartOpen) return null;

    const handlePlaceOrder = async () => {
        try {
            const order = await placeOrder();
            if (order) {
                setIsCartOpen(false);
                alert(`${t('orderTracking.orderNumber')} #${order.orderNumber} ${t('common.success')}! ✅`);
            }
        } catch (err) {
            console.error('Failed to place order:', err);
            alert(t('checkout.failedToPlaceOrder'));
        }
    };

    const handleRemoveItem = (cartItemId, itemName) => {
        if (window.confirm(`${t('cart.removeConfirm')} "${itemName}"?`)) {
            removeFromCart(cartItemId);
        }
    };

    return (
        <div className="cart-drawer-overlay">
            <div className="cart-drawer-backdrop" onClick={() => setIsCartOpen(false)}></div>
            <div className="cart-drawer-content">
                <div className="cart-drawer-header">
                    <h2>{t('cart.title')} {table && <span className="table-badge">{t('menu.table')} {table.tableNumber}</span>}</h2>
                    <button className="close-drawer" onClick={() => setIsCartOpen(false)} aria-label={t('common.close')}>&times;</button>
                </div>

                <div className="cart-items-list">
                    {cart.length === 0 ? (
                        <div className="empty-cart">
                            <div className="empty-icon">🛒</div>
                            <p>{t('cart.empty')}</p>
                            <button className="continue-btn" onClick={() => setIsCartOpen(false)}>{t('cart.continueBrowsing')}</button>
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
                                        <div className="cart-item-special">{t('cart.note')}: {item.specialRequest}</div>
                                    )}
                                </div>
                                <div className="cart-item-actions">
                                    <div className="quantity-controls">
                                        <button onClick={() => updateQuantity(item.cartItemId, -1)} aria-label={t('cart.decreaseQuantity')}>−</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.cartItemId, 1)} aria-label={t('cart.increaseQuantity')}>+</button>
                                    </div>
                                    <button className="remove-item" onClick={() => handleRemoveItem(item.cartItemId, item.name)} aria-label={t('cart.remove')}>🗑️</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>


                {cart.length > 0 && (
                    <div className="cart-drawer-footer">
                        <div className="special-notes">
                            <label>{t('cart.specialInstructions')}</label>
                            <textarea
                                value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)}
                                placeholder={t('cart.specialInstructionsPlaceholder')}
                            ></textarea>
                        </div>
                        <div className="summary-section">
                            <div className="summary-row"><span>{t('cart.subtotal')}</span><span>${subtotal.toFixed(2)}</span></div>
                            <div className="summary-row"><span>{t('cart.tax')}</span><span>${taxAmount.toFixed(2)}</span></div>
                            <div className="summary-row total"><span>{t('cart.total')}</span><span>${total.toFixed(2)}</span></div>
                        </div>
                        <button
                            className="place-order-btn"
                            onClick={handlePlaceOrder}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                `⏳ ${t('checkout.processing')}`
                            ) : (
                                <>🍽️ {t('cart.confirmOrder')}</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;
