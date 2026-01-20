import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../../contexts/CartContext';
import { useCustomerAuth } from '../../../contexts/CustomerAuthContext';
import './CartTab.css';

const CartTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, customer } = useCustomerAuth();

  const {
    cart, updateQuantity, removeFromCart,
    subtotal, total, taxAmount, orderNotes, setOrderNotes,
    table, placeOrder, isSubmitting
  } = useCart();

  const [orderSuccess, setOrderSuccess] = useState(null);

  const handlePlaceOrder = async () => {
    try {
      // Get customerId if authenticated
      const customerId = isAuthenticated && customer ? customer.id : null;

      const order = await placeOrder(customerId);
      if (order) {
        setOrderSuccess(order);
        // Navigate to orders tab after a short delay
        setTimeout(() => {
          navigate('/c/orders');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to place order:', err);
      alert(t('checkout.failedToPlaceOrder', 'Failed to place order. Please try again.'));
    }
  };

  const handleRemoveItem = (cartItemId, itemName) => {
    if (window.confirm(`${t('cart.removeConfirm', 'Remove')} "${itemName}"?`)) {
      removeFromCart(cartItemId);
    }
  };

  // Success state
  if (orderSuccess) {
    return (
      <div className="cart-tab">
        <div className="order-success">
          <div className="success-icon">
            <span role="img" aria-label="success">&#10003;</span>
          </div>
          <h2>{t('cart.orderPlaced', 'Order Placed!')}</h2>
          <p>{t('orderTracking.orderNumber', 'Order')}: <strong>#{orderSuccess.orderNumber}</strong></p>
          <p className="success-message">{t('cart.orderSuccessMessage', 'Your order has been sent to the kitchen.')}</p>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cart.length === 0) {
    return (
      <div className="cart-tab">
        <header className="cart-header">
          <h1>{t('cart.title', 'Your Cart')}</h1>
          {table && <span className="table-badge">{t('menu.table', 'Table')} {table.tableNumber}</span>}
        </header>

        <div className="empty-cart">
          <div className="empty-icon">
            <span role="img" aria-label="cart">&#128722;</span>
          </div>
          <h2>{t('cart.empty', 'Your cart is empty')}</h2>
          <p>{t('cart.emptyMessage', 'Add some delicious items from our menu!')}</p>
          <button className="browse-menu-btn" onClick={() => navigate('/c/menu')}>
            {t('cart.browseMenu', 'Browse Menu')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-tab">
      <header className="cart-header">
        <h1>{t('cart.title', 'Your Cart')}</h1>
        {table && <span className="table-badge">{t('menu.table', 'Table')} {table.tableNumber}</span>}
      </header>

      {/* Cart Items */}
      <div className="cart-items">
        {cart.map((item) => (
          <div key={item.cartItemId} className="cart-item">
            <div className="cart-item-content">
              <div className="cart-item-main">
                <h3 className="cart-item-name">{item.name}</h3>
                <span className="cart-item-price">${item.itemTotal.toFixed(2)}</span>
              </div>

              {item.selectedModifiers.length > 0 && (
                <div className="cart-item-modifiers">
                  {item.selectedModifiers.map(m => m.modifierOptionName).join(', ')}
                </div>
              )}

              {item.specialRequest && (
                <div className="cart-item-note">
                  <span role="img" aria-label="note">&#128221;</span> {item.specialRequest}
                </div>
              )}

              <div className="cart-item-actions">
                <div className="quantity-controls">
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.cartItemId, -1)}
                    aria-label={t('cart.decreaseQuantity', 'Decrease')}
                  >
                    -
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.cartItemId, 1)}
                    aria-label={t('cart.increaseQuantity', 'Increase')}
                  >
                    +
                  </button>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveItem(item.cartItemId, item.name)}
                  aria-label={t('cart.remove', 'Remove')}
                >
                  <span role="img" aria-label="delete">&#128465;</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Special Instructions */}
      <div className="special-instructions">
        <label>{t('cart.specialInstructions', 'Special Instructions')}</label>
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          placeholder={t('cart.specialInstructionsPlaceholder', 'Any allergies or special requests?')}
          rows={3}
        />
      </div>

      {/* Order Summary */}
      <div className="order-summary">
        <div className="summary-row">
          <span>{t('cart.subtotal', 'Subtotal')}</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>{t('cart.tax', 'Tax')} (8%)</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>{t('cart.total', 'Total')}</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Pay After Meal Info */}
      <div className="pay-after-info">
        <span className="info-icon" role="img" aria-label="info">&#8505;</span>
        <p>{t('cart.payAfterMeal', 'Payment is collected after your meal. Enjoy your food!')}</p>
      </div>

      {/* Place Order Button - Fixed at bottom */}
      <div className="cart-footer">
        <button
          className="place-order-btn"
          onClick={handlePlaceOrder}
          disabled={isSubmitting || cart.length === 0}
        >
          {isSubmitting ? (
            <span className="loading-text">
              <span className="spinner-small"></span>
              {t('checkout.processing', 'Processing...')}
            </span>
          ) : (
            <>
              <span role="img" aria-label="restaurant">&#127869;</span>
              {t('cart.placeOrder', 'Place Order')} - ${total.toFixed(2)}
            </>
          )}
        </button>
        <button className="continue-btn" onClick={() => navigate('/c/menu')}>
          {t('cart.continueBrowsing', 'Continue Browsing')}
        </button>
      </div>
    </div>
  );
};

export default CartTab;
