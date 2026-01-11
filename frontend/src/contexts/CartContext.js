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

    const [token, setToken] = useState(() => {
        const stored = localStorage.getItem('qr_token');
        if (!stored) return null;
        try {
            const { token, savedAt } = JSON.parse(stored);
            const TOKEN_EXPIRY = 4 * 60 * 60 * 1000; // 4 hours
            if (Date.now() - savedAt > TOKEN_EXPIRY) {
                localStorage.removeItem('qr_token');
                return null;
            }
            return token;
        } catch {
            return null;
        }
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
            setActiveOrder(order);
        } catch (err) {
            console.error('Failed to fetch active order', err);
            setActiveOrder(null);
        }
    }, []);

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

                const rawStored = localStorage.getItem(`cart_${table.id}`);
                if (rawStored) {
                    setError('Your cart has expired due to inactivity. Please add items again.');
                    localStorage.removeItem(`cart_${table.id}`);
                }
            }
            refreshActiveOrder(table.id);
        }
    }, [table?.id, refreshActiveOrder]);

    useEffect(() => {
        if (table?.id) {
            saveCartData(table.id, cart, orderNotes);
        }
    }, [cart, orderNotes, table?.id]);

    const handleSetTable = (tableId, tableNumber, qrToken) => {
        // If switching tables, clear the old cart and token
        if (table && table.id !== tableId) {
            clearCartData(table.id);
            setCart([]);
            setOrderNotes('');
            localStorage.removeItem('qr_token');
            setToken(null);
        }

        setTable({ id: tableId, tableNumber });

        if (qrToken) {
            setToken(qrToken);
            localStorage.setItem('qr_token', JSON.stringify({
                token: qrToken,
                tableId: tableId,
                savedAt: Date.now()
            }));
        }
    };

    const clearError = () => setError(null);

    const addToCart = (orderData) => {
        const { item, quantity, selectedModifiers: selectedModifiersObj, specialInstructions } = orderData;

        setCart((prev) => {
            // 1. Transform selectedModifiers from Object {groupId: id/ids} to Array of objects
            const selectedModifiersArray = [];
            let modifiersTotal = 0;

            Object.keys(selectedModifiersObj).forEach(groupId => {
                const optionIdOrIds = selectedModifiersObj[groupId];
                const optionIds = Array.isArray(optionIdOrIds) ? optionIdOrIds : [optionIdOrIds];

                const group = item.modifierGroups?.find(mg => mg.group.id === groupId)?.group;
                if (group) {
                    optionIds.forEach(optId => {
                        const option = group.options.find(o => o.id === optId);
                        if (option) {
                            selectedModifiersArray.push({
                                modifierOptionId: option.id,
                                modifierOptionName: option.name,
                                priceAdjustment: Number(option.priceAdjustment)
                            });
                            modifiersTotal += Number(option.priceAdjustment);
                        }
                    });
                }
            });

            // 2. Check for duplicate
            const modifiersKey = selectedModifiersArray
                .map(m => m.modifierOptionId)
                .sort()
                .join(',');

            const existingIndex = prev.findIndex(cartItem =>
                cartItem.menuItemId === item.id &&
                cartItem.specialRequest === (specialInstructions || '') &&
                (cartItem.selectedModifiers || [])
                    .map(m => m.modifierOptionId)
                    .sort()
                    .join(',') === modifiersKey
            );

            if (existingIndex >= 0) {
                return prev.map((cartItem, index) => {
                    if (index === existingIndex) {
                        const newQty = cartItem.quantity + quantity;
                        return {
                            ...cartItem,
                            quantity: newQty,
                            itemTotal: (cartItem.price + cartItem.modifiersTotal) * newQty
                        };
                    }
                    return cartItem;
                });
            }

            // 3. New item
            const cartItemId = `${item.id}-${Date.now()}`;
            const newItem = {
                cartItemId,
                menuItemId: item.id,
                name: item.name,
                price: Number(item.price),
                quantity: quantity,
                specialRequest: specialInstructions || '',
                selectedModifiers: selectedModifiersArray,
                modifiersTotal: modifiersTotal,
                itemTotal: (Number(item.price) + modifiersTotal) * quantity
            };

            return [...prev, newItem];
        });

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
            // Handle 409 Conflict - table already has active order
            if (err.response?.status === 409) {
                setError('This table already has an active order. You can add more items to it.');
                await refreshActiveOrder(table.id);
                return null;
            }

            const msg = err.response?.data?.message || 'Failed to place order. Please try again.';
            setError(msg);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    const subtotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = subtotal; // Tax can be added if needed

    return (
        <CartContext.Provider value={{
            table, setTable: handleSetTable,
            cart, cartCount,
            addToCart, removeFromCart, updateQuantity,
            orderNotes, setOrderNotes,
            subtotal, total, taxAmount: 0,
            isCartOpen, setIsCartOpen, isSubmitting, error, clearError,
            placeOrder, activeOrder, refreshActiveOrder
        }}>
            {children}
        </CartContext.Provider>
    );
};
