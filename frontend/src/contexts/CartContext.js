import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadCartData, saveCartData, clearCartData, refreshCartTimestamp } from '../utils/cartStorage';
import { orderService } from '../services/orderService';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [table, setTable] = useState(() => {
        const savedTable = localStorage.getItem('current_table');
        return savedTable ? JSON.parse(savedTable) : null;
    });

    const [cart, setCart] = useState([]);
    const [orderNotes, setOrderNotes] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeOrder, setActiveOrder] = useState(null);
    const [error, setError] = useState(null);

    const refreshActiveOrder = useCallback(async (tableId) => {
        try {
            const order = await orderService.getCurrentOrder(tableId);
            setActiveOrder(order); // null if no active order
        } catch (err) {
            console.error('Failed to fetch active order', err);
            setActiveOrder(null);
        }
    }, []);

    // Load cart data when table changes
    useEffect(() => {
        if (table?.id) {
            localStorage.setItem('current_table', JSON.stringify(table));
            const saved = loadCartData(table.id);

            if (saved) {
                setCart(saved.cart || []);
                setOrderNotes(saved.orderNotes || '');
            } else {
                setCart([]);
                setOrderNotes('');

                // Check if there was data that expired
                const rawStored = localStorage.getItem(`cart_${table.id}`);
                if (rawStored) {
                    setError('Your cart has expired due to inactivity. Please add items again.');
                    localStorage.removeItem(`cart_${table.id}`);
                }
            }

            refreshActiveOrder(table.id);
        }
    }, [table?.id, refreshActiveOrder]);

    // Persist cart on changes
    useEffect(() => {
        if (table?.id) {
            saveCartData(table.id, cart, orderNotes);
        }
    }, [cart, orderNotes, table?.id]);

    const handleSetTable = (tableId, tableNumber) => {
        setTable({ id: tableId, tableNumber });
    };

    const clearError = () => setError(null);

    const addToCart = (item) => {
        setCart((prev) => {
            // Logic to check if exact same item (menuItemId + modifiers + request) exists
            const modifiersKey = (item.selectedModifiers || [])
                .map(m => m.modifierOptionId)
                .sort()
                .join(',');

            const existingIndex = prev.findIndex(cartItem =>
                cartItem.menuItemId === item.id &&
                cartItem.specialRequest === (item.specialRequest || '') &&
                (cartItem.selectedModifiers || [])
                    .map(m => m.modifierOptionId)
                    .sort()
                    .join(',') === modifiersKey
            );

            if (existingIndex >= 0) {
                // Merge: Increase quantity
                return prev.map((cartItem, index) => {
                    if (index === existingIndex) {
                        const newQty = cartItem.quantity + (item.quantity || 1);
                        return {
                            ...cartItem,
                            quantity: newQty,
                            itemTotal: (cartItem.price + cartItem.modifiersTotal) * newQty
                        };
                    }
                    return cartItem;
                });
            }

            // New item entry
            const cartItemId = `${item.id}-${Date.now()}`;
            const newItem = {
                cartItemId,
                menuItemId: item.id,
                name: item.name,
                price: Number(item.price),
                quantity: item.quantity || 1,
                specialRequest: item.specialRequest || '',
                selectedModifiers: item.selectedModifiers || [],
                modifiersTotal: item.modifiersTotal || 0,
                itemTotal: (Number(item.price) + (item.modifiersTotal || 0)) * (item.quantity || 1)
            };

            return [...prev, newItem];
        });

        // Reset expiry timer on interaction
        if (table?.id) refreshCartTimestamp(table.id);
        setError(null);
    };

    const removeFromCart = (cartItemId) => {
        setCart((prev) => prev.filter(item => item.cartItemId !== cartItemId));
        if (table?.id) refreshCartTimestamp(table.id);
    };

    const updateQuantity = (cartItemId, delta) => {
        setCart((prev) => {
            return prev.map(item => {
                if (item.cartItemId === cartItemId) {
                    const newQty = Math.max(0, item.quantity + delta);
                    if (newQty === 0) return null;
                    return {
                        ...item,
                        quantity: newQty,
                        itemTotal: (item.price + item.modifiersTotal) * newQty
                    };
                }
                return item;
            }).filter(Boolean);
        });
        if (table?.id) refreshCartTimestamp(table.id);
    };

    const placeOrder = async () => {
        if (!table?.id || cart.length === 0) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const orderData = {
                tableId: table.id,
                notes: orderNotes,
                items: cart.map(item => ({
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    specialRequest: item.specialRequest,
                    modifiers: item.selectedModifiers.map(m => ({
                        modifierOptionId: m.modifierOptionId
                    }))
                }))
            };

            const result = await orderService.createOrder(orderData);
            clearCartData(table.id);
            setCart([]);
            setOrderNotes('');
            setActiveOrder(result);
            setIsCartOpen(false);
            return result;
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to place order. Please try again.';
            setError(msg);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    const subtotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const taxRate = 0; // Tax logic can be added here
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    return (
        <CartContext.Provider value={{
            table,
            setTable: handleSetTable,
            cart,
            cartCount,
            addToCart,
            removeFromCart,
            updateQuantity,
            orderNotes,
            setOrderNotes,
            subtotal,
            taxAmount,
            total,
            isCartOpen,
            setIsCartOpen,
            isSubmitting,
            error,
            clearError,
            placeOrder,
            activeOrder,
            refreshActiveOrder
        }}>
            {children}
        </CartContext.Provider>
    );
};
