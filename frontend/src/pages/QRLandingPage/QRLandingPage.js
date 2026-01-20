import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../../contexts/CartContext';

const isValidUUID = (str) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
};

const QRLandingPage = () => {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const { setTable, refreshActiveOrder } = useCart();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const validateTable = async () => {
            // 1. Initial validation
            if (!tableId || !isValidUUID(tableId)) {
                setError('Invalid QR code format. Please scan again.');
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`/api/tables/${tableId}`);
                const tableData = response.data;

                if (tableData.status === 'INACTIVE') {
                    setError('This table is currently not in use. Please contact staff.');
                    setLoading(false);
                    return;
                }

                // 2. Initialize Cart Context
                setTable(tableData.id, tableData.tableNumber, tableData.qrToken);

                // 3. Check for existing order
                await refreshActiveOrder(tableData.id);

                // 4. Navigate to customer auth page
                navigate('/c/auth', { replace: true });

            } catch (err) {
                console.error('Table validation failed', err);
                if (err.response?.status === 404) {
                    setError('Table not found. Please scan a valid QR code.');
                } else {
                    setError('Invalid QR code or connection error. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        validateTable();
    }, [tableId, navigate, setTable, refreshActiveOrder]);

    if (loading) {
        return (
            <div className="loading-container" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: '#f8f9fa'
            }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '20px', color: '#666', fontWeight: '500' }}>Setting up your table...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="loading-container" style={{
                padding: '40px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: '#f8f9fa'
            }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>😕</div>
                <h2 style={{ margin: '0 0 10px', color: '#2c3e50' }}>Oops!</h2>
                <p style={{ color: '#666', marginBottom: '30px', maxWidth: '300px' }}>{error}</p>

                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '14px 32px',
                        background: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '25px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    🔄 Try Again
                </button>

                <p style={{ color: '#999', fontSize: '14px', marginTop: '30px' }}>
                    Still having issues? <br />
                    Please ask our staff for help.
                </p>
            </div>
        );
    }

    return null;
};

export default QRLandingPage;
