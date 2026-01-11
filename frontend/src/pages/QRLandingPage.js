import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';

const QRLandingPage = () => {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const { setTable, refreshActiveOrder } = useCart();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const validateTable = async () => {
            try {
                // We use the existing GET /api/tables/:id endpoint
                // or a simpler one if available. Here we verify table exists.
                const response = await axios.get(`/api/tables/${tableId}`);
                const tableData = response.data;

                if (tableData.status === 'INACTIVE') {
                    setError('This table is currently not in use. Please contact staff.');
                    setLoading(false);
                    return;
                }

                // Initialize Cart Context with Table Info
                setTable(tableData.id, tableData.tableNumber);

                // Check for existing order
                await refreshActiveOrder(tableData.id);

                // Redirect to menu with the token if available or just /menu
                // The current MenuPage uses a 'token' query param, let's keep it compatible
                // for now or modify MenuPage later to use context.
                if (tableData.qrToken) {
                    navigate(`/menu?token=${tableData.qrToken}`, { replace: true });
                } else {
                    navigate('/menu', { replace: true });
                }

            } catch (err) {
                console.error('Table validation failed', err);
                setError('Invalid QR code. Please try again or ask for assistance.');
            } finally {
                setLoading(false);
            }
        };

        if (tableId) {
            validateTable();
        } else {
            setError('No table information found.');
            setLoading(false);
        }
    }, [tableId, navigate, setTable, refreshActiveOrder]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p style={{ marginTop: '15px' }}>Verifying your table...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="loading-container" style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '50px' }}>⚠️</div>
                <h2 style={{ margin: '20px 0 10px' }}>Oops!</h2>
                <p style={{ color: '#666' }}>{error}</p>
                <button
                    onClick={() => navigate('/login')}
                    style={{
                        marginTop: '20px',
                        padding: '10px 25px',
                        background: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    Back to Login
                </button>
            </div>
        );
    }

    return null;
};

export default QRLandingPage;
