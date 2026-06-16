export const performEmergencyCleanup = (requiredSpace = 1000000) => {
    console.warn(`Attempting emergency cleanup to free ~${requiredSpace} bytes...`);

    // 1. Clear old notifications (usually small but can accumulate)
    localStorage.removeItem('petcare_notifications');

    // 2. Aggressively trim Lost & Found
    const lfKey = 'lostFoundPosts';
    const lfStored = localStorage.getItem(lfKey);
    if (lfStored) {
        try {
            const lfPosts = JSON.parse(lfStored);
            if (lfPosts.length > 1) {
                localStorage.setItem(lfKey, JSON.stringify(lfPosts.slice(0, 1)));
                console.log('Trimmed Lost & Found to 1 post');
            }
        } catch (e) { }
    }

    // 3. Aggressively trim Bookings
    const bkKey = 'petcare_bookings';
    const bkStored = localStorage.getItem(bkKey);
    if (bkStored) {
        try {
            const bookings = JSON.parse(bkStored);
            if (bookings.length > 3) {
                localStorage.setItem(bkKey, JSON.stringify(bookings.slice(0, 3)));
                console.log('Trimmed bookings to 3 items');
            }
        } catch (e) { }
    }

    // 4. Trim shop orders
    const ordKey = 'petcare_orders';
    const ordStored = localStorage.getItem(ordKey);
    if (ordStored) {
        try {
            const orders = JSON.parse(ordStored);
            if (orders.length > 3) {
                localStorage.setItem(ordKey, JSON.stringify(orders.slice(0, 3)));
                console.log('Trimmed orders to 3 items');
            }
        } catch (e) { }
    }

    // 5. Clear reviews (can be large due to images)
    localStorage.removeItem('petcare_reviews');
    localStorage.removeItem('dog_show_reviews');

    console.log('Emergency cleanup completed');
};

export const saveBooking = (newBooking) => {
    const KEY = 'petcare_bookings';
    try {
        const stored = localStorage.getItem(KEY);
        let bookings = [];
        try {
            bookings = stored ? JSON.parse(stored) : [];
            if (!Array.isArray(bookings)) bookings = [];
        } catch (e) {
            bookings = [];
        }

        const updated = [newBooking, ...bookings].slice(0, 100);

        try {
            localStorage.setItem(KEY, JSON.stringify(updated));
            return true;
        } catch (quotaError) {
            performEmergencyCleanup();
            try {
                localStorage.setItem(KEY, JSON.stringify([newBooking, ...bookings].slice(0, 20)));
                return true;
            } catch (innerError) {
                localStorage.setItem(KEY, JSON.stringify([newBooking]));
                return true;
            }
        }
    } catch (error) {
        console.error('Final storage failure:', error);
        return false;
    }
};

export const compressImage = (file, maxWidth = 200, maxHeight = 200, quality = 0.4) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};
export const getStorageUsage = () => {
    let total = 0;
    for (let x in localStorage) {
        if (!localStorage.hasOwnProperty(x)) continue;
        total += ((localStorage[x].length + x.length) * 2);
    }
    return (total / 1024 / 1024).toFixed(2); // MB
};
