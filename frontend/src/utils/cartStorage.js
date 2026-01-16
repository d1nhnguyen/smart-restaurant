const CART_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export const saveCartData = (tableId, cart, orderNotes = '') => {
    if (!tableId) return;
    const storageData = {
        cart,
        orderNotes,
        lastUpdate: Date.now(),
    };
    localStorage.setItem(`cart_${tableId}`, JSON.stringify(storageData));
};

export const loadCartData = (tableId) => {
    if (!tableId) return null;
    const stored = localStorage.getItem(`cart_${tableId}`);
    if (!stored) return null;

    try {
        const parsed = JSON.parse(stored);
        const { cart, orderNotes, lastUpdate } = parsed;

        // Check expiry
        if (Date.now() - lastUpdate > CART_EXPIRY_MS) {
            localStorage.removeItem(`cart_${tableId}`);
            return null;
        }

        return { cart, orderNotes };
    } catch (error) {
        console.error('Error parsing cart data', error);
        return null;
    }
};

export const clearCartData = (tableId) => {
    if (tableId) {
        localStorage.removeItem(`cart_${tableId}`);
    }
};

export const refreshCartTimestamp = (tableId) => {
    if (!tableId) return;
    const stored = localStorage.getItem(`cart_${tableId}`);
    if (!stored) return;

    try {
        const parsed = JSON.parse(stored);
        parsed.lastUpdate = Date.now();
        localStorage.setItem(`cart_${tableId}`, JSON.stringify(parsed));
    } catch (error) {
        console.error('Error refreshing cart timestamp', error);
    }
};
