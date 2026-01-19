import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import axios from 'axios';
import './CheckoutPage.css';

const CheckoutPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Lấy dữ liệu từ CartContext - use unpaidOrders for checkout
    const { table, unpaidOrders, refreshUnpaidOrders } = useCart();

    // State cho phương thức thanh toán
    const [paymentMethod, setPaymentMethod] = useState('VNPAY');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Refresh unpaid orders when component mounts
    useEffect(() => {
        if (table?.id) {
            refreshUnpaidOrders(table.id);
        }
    }, [table?.id, refreshUnpaidOrders]);

    // Kiểm tra session bàn
    if (!table) {
        return (
            <div className="checkout-container">
                <div className="checkout-error">
                    <h2>{t('checkout.sessionMissing')}</h2>
                    <p>{t('checkout.scanQRStart')}</p>
                    <Link to="/menu" className="back-btn">{t('orderTracking.backToMenu')}</Link>
                </div>
            </div>
        );
    }

    // Calculate totals from all unpaid orders
    const allItems = unpaidOrders.flatMap(order =>
        order.items.map(item => ({
            ...item,
            orderId: order.id,
            orderNumber: order.orderNumber
        }))
    );

    const subtotal = unpaidOrders.reduce((sum, order) => sum + Number(order.subtotalAmount || 0), 0);
    const TAX_RATE = 0.08;
    const taxAmount = subtotal * TAX_RATE;
    const total = subtotal + taxAmount;

    // Kiểm tra có orders để thanh toán không
    if (unpaidOrders.length === 0 || allItems.length === 0) {
        return (
            <div className="checkout-container">
                <div className="checkout-error">
                    <h2>{t('checkout.noOrdersToPay')}</h2>
                    <p>{t('checkout.addItemsFirst')}</p>
                    <Link to="/menu" className="back-btn">{t('orderTracking.backToMenu')}</Link>
                </div>
            </div>
        );
    }

    // Logic xử lý thanh toán cho TẤT CẢ orders
    const handleConfirmPayment = async () => {
        setLoading(true);
        setError(null);
        try {
            // VNPay flow - redirect to payment gateway
            if (paymentMethod === 'VNPAY') {
                // For VNPay, we'll process all orders together
                const totalOrderIds = unpaidOrders.map(o => o.id).join(',');
                const orderInfo = `Payment for ${unpaidOrders.length} order(s): ${unpaidOrders.map(o => `#${o.orderNumber}`).join(', ')}`;

                const response = await axios.post('/api/payments/vnpay/create', {
                    orderId: unpaidOrders[0].id, // Use first order ID as reference
                    amount: total,
                    orderInfo: orderInfo,
                    language: 'vn'
                });

                // Redirect to VNPay payment page
                window.location.href = response.data.paymentUrl;
                return;
            }

            // Original flow for other payment methods
            // Create payments for all active orders
            const paymentPromises = unpaidOrders.map(async (order) => {
                const orderTotal = Number(order.totalAmount);

                // 1. Tạo payment record
                const payRes = await axios.post('/api/payments', {
                    orderId: order.id,
                    amount: orderTotal,
                    method: paymentMethod
                });

                // 2. Confirm payment (trừ CASH)
                if (paymentMethod !== 'CASH') {
                    // Giả lập delay cho online payment
                    if (paymentMethod === 'CARD') {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    await axios.post(`/api/payments/${payRes.data.id}/confirm`);
                }

                return payRes.data;
            });

            // Wait for all payments to complete
            await Promise.all(paymentPromises);

            // Refresh unpaid orders to remove paid orders
            if (table?.id) {
                await refreshUnpaidOrders(table.id);
            }

            // Navigate to success page with orders and total amount
            navigate('/payment/success', {
                state: {
                    orders: unpaidOrders,
                    totalAmount: total
                }
            });

        } catch (err) {
            console.error('Payment failed', err);
            setError(err.response?.data?.message || t('checkout.paymentFailed'));

            navigate('/payment/failed', {
                state: {
                    error: err.response?.data?.message || t('checkout.paymentFailed')
                }
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="checkout-container">
            {/* Language Switcher */}
            <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1100 }}>
                <LanguageSwitcher />
            </div>

            <header className="checkout-header">
                <button onClick={() => navigate(-1)} className="back-link">← {t('common.back')}</button>
                <h1>{t('checkout.title')}</h1>
                <div className="table-info">{t('menu.table')} {table.tableNumber}</div>
            </header>

            <main className="checkout-main">
                {/* Summary banner */}
                <div className="orders-summary-banner">
                    <h3>💳 {t('checkout.payingFor')} {unpaidOrders.length} {unpaidOrders.length > 1 ? t('checkout.orders') : t('checkout.order')}</h3>
                    <p>{t('checkout.ordersList')}: {unpaidOrders.map(o => `#${o.orderNumber}`).join(', ')}</p>
                </div>

                {/* Tóm tắt tất cả items từ active orders */}
                <section className="order-summary">
                    <h2>{t('checkout.allItemsToPay')}</h2>
                    <div className="items-list">
                        {allItems.map((item, idx) => (
                            <div key={`${item.orderId}-${item.id}-${idx}`} className="summary-item">
                                <div className="item-details">
                                    <div className="item-name-row">
                                        <span className="qty">{item.quantity}x</span>
                                        <span className="name">{item.menuItemName}</span>
                                        <span className="price">${Number(item.subtotal).toFixed(2)}</span>
                                    </div>
                                    {item.selectedModifiers?.length > 0 && (
                                        <p className="modifiers">
                                            {item.selectedModifiers.map(m => m.modifierOptionName).join(', ')}
                                        </p>
                                    )}
                                    <p className="order-ref">{t('checkout.fromOrder')} #{item.orderNumber}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Chọn phương thức thanh toán */}
                <section className="payment-method-section">
                    <h2>{t('checkout.paymentMethod')}</h2>
                    <div className="payment-method-grid">
                        {['VNPAY', 'CASH'].map(method => (
                            <label key={method} className={`payment-option ${paymentMethod === method ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="payment"
                                    value={method}
                                    checked={paymentMethod === method}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                {method === 'VNPAY' ? 'VNPay' : t('checkout.cash')}
                            </label>
                        ))}
                    </div>
                </section>

                {error && <div className="checkout-error-msg">{error}</div>}

                <section className="payment-summary">
                    <div className="summary-row">
                        <span>{t('cart.subtotal')}</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                        <span>{t('cart.tax')}</span>
                        <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="summary-row total">
                        <span>{t('checkout.totalAmount')}</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </section>
            </main>

            <footer className="checkout-footer">
                <button
                    className="place-order-btn"
                    onClick={handleConfirmPayment}
                    disabled={loading}
                >
                    {loading ? t('checkout.processing') : `${t('checkout.pay')} ${unpaidOrders.length} ${unpaidOrders.length > 1 ? t('checkout.orders') : t('checkout.order')} - $${total.toFixed(2)}`}
                </button>
            </footer>
        </div>
    );
};

export default CheckoutPage;
