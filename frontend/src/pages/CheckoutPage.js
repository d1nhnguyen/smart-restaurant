import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';
import './CheckoutPage.css';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Lấy dữ liệu từ CartContext (từ HEAD)
    const {
        cart, subtotal, total, taxAmount, orderNotes, setOrderNotes,
        placeOrder, isSubmitting, error, table
    } = useCart();

    // State cho phương thức thanh toán (từ Incoming)
    const [paymentMethod, setPaymentMethod] = useState('CARD');
    const [loading, setLoading] = useState(false);

    // Kiểm tra session bàn (từ HEAD)
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

    // Kiểm tra giỏ hàng trống (từ HEAD)
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

    // Logic xử lý đặt hàng & thanh toán kết hợp
    const handleConfirmOrder = async () => {
        setLoading(true);
        try {
            // 1. Đặt hàng (sử dụng hàm từ Context của HEAD)
            const order = await placeOrder();
            
            if (order && order.id) {
                // 2. Gọi API thanh toán (Logic từ Incoming)
                const payRes = await axios.post('/api/payments', {
                    orderId: order.id,
                    amount: total,
                    method: paymentMethod
                });

                if (paymentMethod !== 'CASH') {
                    // Giả lập xử lý thanh toán online hoặc confirm
                    if (paymentMethod === 'CARD') await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    await axios.post(`/api/payments/${payRes.data.id}/confirm`);
                    
                    navigate(`/order-success/${order.id}`);
                } else {
                    alert("Vui lòng thanh toán tại quầy. Đơn hàng của bạn đã được gửi!");
                    navigate(`/order-success/${order.id}`);
                }
            }
        } catch (err) {
            console.error('Order placement or payment failed', err);
        } finally {
            setLoading(false);
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
                {/* Tóm tắt đơn hàng (từ HEAD - chi tiết hơn) */}
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
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Chọn phương thức thanh toán (Tích hợp từ Incoming) */}
                <section className="payment-method-section">
                    <h2>Payment Method</h2>
                    <div className="payment-grid">
                        {['CARD', 'MOMO', 'ZALOPAY', 'CASH'].map(method => (
                            <label key={method} className={`payment-option ${paymentMethod === method ? 'active' : ''}`}>
                                <input 
                                    type="radio" 
                                    name="payment" 
                                    value={method} 
                                    checked={paymentMethod === method} 
                                    onChange={(e) => setPaymentMethod(e.target.value)} 
                                />
                                {method}
                            </label>
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
                    disabled={isSubmitting || loading}
                >
                    {isSubmitting || loading ? 'Processing...' : `Confirm & Pay - $${total.toFixed(2)}`}
                </button>
            </footer>
        </div>
    );
};

export default CheckoutPage;