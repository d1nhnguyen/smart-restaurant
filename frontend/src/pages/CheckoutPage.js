import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import './CheckoutPage.css';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const {
        cart, subtotal, total, taxAmount, orderNotes, setOrderNotes,
        placeOrder, isSubmitting, error, table
    } = useCart();

    if (!table) {
        return (
            <div className="checkout-container">
                <div className="checkout-error">
                    <h2>Session Missing</h2>
                    <p>Please scan a QR code to start ordering.</p>
                    <Link to="/menu" className="back-btn">Back to Menu</Link>
                </div>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="checkout-container">
                <div className="checkout-error">
                    <h2>Your cart is empty</h2>
                    <p>Add some delicious items before checking out!</p>
                    <Link to="/menu" className="back-btn">Back to Menu</Link>
                </div>
            </div>
        );
    }

    const handleConfirmOrder = async () => {
        try {
            const order = await placeOrder();
            if (order) {
                navigate(`/order-success/${order.id}`);
            }
        } catch (err) {
            console.error('Order placement failed', err);
        }
    };

    return (
        <div className="checkout-container">
            <header className="checkout-header">
                <button onClick={() => navigate(-1)} className="back-link">← Back</button>
                <h1>Checkout</h1>
                <div className="table-info">Table {table.tableNumber}</div>
            </header>

            <main className="checkout-main">
                <section className="order-summary">
                    <h2>Order Summary</h2>
                    <div className="items-list">
                        {cart.map((item) => (
                            <div key={item.cartItemId} className="summary-item">
                                <div className="item-details">
                                    <div className="item-name-row">
                                        <span className="qty">{item.quantity}x</span>
                                        <span className="name">{item.name}</span>
                                        <span className="price">${item.itemTotal.toFixed(2)}</span>
                                    </div>
                                    {item.selectedModifiers.length > 0 && (
                                        <p className="modifiers">
                                            {item.selectedModifiers.map(m => m.modifierOptionName).join(', ')}
                                        </p>
                                    )}
                                    {item.specialRequest && (
                                        <p className="special-req">Note: {item.specialRequest}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="checkout-notes">
                    <h2>Special Instructions</h2>
                    <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Any last minute instructions for the kitchen?"
                    />
                </section>

                {error && <div className="checkout-error-msg">{error}</div>}

                <section className="payment-summary">
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Tax (8%)</span>
                        <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="summary-row total">
                        <span>Total Amount</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </section>
            </main>

            <footer className="checkout-footer">
                <button
                    className="place-order-btn"
                    onClick={handleConfirmOrder}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Processing...' : `Confirm & Place Order - $${total.toFixed(2)}`}
                </button>
                <p className="disclaimer">By placing this order, you agree to our terms of service.</p>
            </footer>
        </div>
    );
};

export default CheckoutPage;
