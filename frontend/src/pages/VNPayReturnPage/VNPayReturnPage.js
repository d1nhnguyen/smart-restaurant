import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './VNPayReturnPage.css';

const VNPayReturnPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const processVNPayReturn = async () => {
            try {
                // Get RAW query string from URL (preserves original VNPay encoding)
                const rawQueryString = window.location.search.substring(1); // Remove '?'

                // Capture raw query string

                // Send raw query string to backend
                const response = await axios.post('/api/payments/vnpay-return', {
                    rawQueryString: rawQueryString
                });

                // Payment verification complete

                if (response.data.success) {
                    // Navigate to success page with payment details
                    navigate('/payment/success', {
                        state: {
                            orderId: response.data.data.orderId,
                            amount: response.data.data.amount,
                            transactionNo: response.data.data.transactionNo
                        }
                    });
                } else {
                    // Navigate to failed page with error
                    navigate('/payment/failed', {
                        state: {
                            error: response.data.message
                        }
                    });
                }
            } catch (err) {
                console.error('Error processing VNPay return:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        processVNPayReturn();
    }, [navigate]);

    if (error) {
        return (
            <div className="vnpay-return-container">
                <div className="vnpay-return-error">
                    <h2>❌ Payment Processing Error</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/menu')}>Back to Menu</button>
                </div>
            </div>
        );
    }

    return (
        <div className="vnpay-return-container">
            <div className="vnpay-return-loading">
                <h2>⏳ Processing Payment...</h2>
                <p>Please wait while we verify your payment with VNPay.</p>
                <div className="spinner"></div>
            </div>
        </div>
    );
};

export default VNPayReturnPage;
