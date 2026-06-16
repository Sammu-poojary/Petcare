// Notification utility functions

const NOTIFICATIONS_KEY = 'petcare_notifications';

// Get all notifications
export const getNotifications = () => {
  try {
    const notifications = localStorage.getItem(NOTIFICATIONS_KEY);
    return notifications ? JSON.parse(notifications) : [];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

// Add a new notification
export const addNotification = (notification) => {
  try {
    const notifications = getNotifications();
    const newNotification = {
      id: Date.now().toString(),
      ...notification,
      timestamp: new Date().toISOString(),
      read: false,
    };
    notifications.unshift(newNotification); // Add to beginning
    // Keep only last 100 notifications
    const limitedNotifications = notifications.slice(0, 100);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(limitedNotifications));
    
    // Request browser notification permission and show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title || 'New Notification', {
        body: notification.message,
        icon: '/favicon.ico',
      });
    }
    
    return newNotification;
  } catch (error) {
    console.error('Error adding notification:', error);
    return null;
  }
};

// Mark notification as read
export const markAsRead = (notificationId) => {
  try {
    const notifications = getNotifications();
    const updated = notifications.map((notif) =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Mark all notifications as read
export const markAllAsRead = () => {
  try {
    const notifications = getNotifications();
    const updated = notifications.map((notif) => ({ ...notif, read: true }));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

// Delete a notification
export const deleteNotification = (notificationId) => {
  try {
    const notifications = getNotifications();
    const updated = notifications.filter((notif) => notif.id !== notificationId);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};

// Get unread count
export const getUnreadCount = () => {
  const notifications = getNotifications();
  return notifications.filter((notif) => !notif.read).length;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }
  return false;
};

