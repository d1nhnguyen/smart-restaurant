import React from 'react';
import { useParams, Link } from 'react-router-dom';
import './OrderConfirmPage.css';

const OrderConfirmPage = () => {
    const { orderId } = useParams();

    return (
        <div className="order-success-container">
            <div className="success-card">
                <div className="success-icon">✓</div>
                <h1>Order Placed!</h1>
                <p>Your order has been sent to the kitchen and is being processed.</p>

                <div className="order-info">
                    <span className="label">Order ID:</span>
                    <span className="value">#{orderId?.slice(-6).toUpperCase()}</span>
                </div>

                <div className="estimated-time">
                    <div className="time-icon">⏲</div>
                    <div>
                        <strong>Estimated Wait: 15-20 mins</strong>
                        <p>We'll notify you when it's ready!</p>
                    </div>
                </div>

                <div className="success-actions">
                    <Link to={`/order-status/${orderId}`} className="track-btn">Track Live Status</Link>
                    <Link to="/menu" className="menu-btn">Add More Items</Link>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmPage;
