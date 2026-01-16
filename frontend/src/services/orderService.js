import axios from 'axios';

const API_BASE = '/api/orders';

export const orderService = {
    /**
     * Create a new order
     */
    createOrder: async (orderData) => {
        const response = await axios.post(API_BASE, orderData);
        return response.data;
    },

    /**
     * Get current active order for a table
     */
    getCurrentOrder: async (tableId) => {
        const response = await axios.get(`${API_BASE}/current`, {
            params: { tableId }
        });
        return response.data;
    },

    /**
     * Get unpaid orders for a table (for checkout)
     */
    getUnpaidOrders: async (tableId) => {
        const response = await axios.get(`${API_BASE}/unpaid`, {
            params: { tableId }
        });
        return response.data;
    },

    /**
     * Get order status by ID
     */
    getOrderById: async (orderId) => {
        const response = await axios.get(`${API_BASE}/${orderId}`);
        return response.data;
    }
};
