import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  requestNotificationPermission,
} from '../utils/notifications';
import './Notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    // Request notification permission on mount
    requestNotificationPermission();
  }, []);

  const loadNotifications = () => {
    const allNotifications = getNotifications();
    setNotifications(allNotifications);
    setUnreadCount(allNotifications.filter((n) => !n.read).length);
  };

  const handleMarkAsRead = (id) => {
    markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    loadNotifications();
  };

  const handleDelete = (id) => {
    deleteNotification(id);
    loadNotifications();
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>🔔 Notifications</h1>
        {unreadCount > 0 && (
          <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="notifications-content">
        {notifications.length === 0 ? (
          <div className="empty-notifications">
            <div className="empty-icon">🔔</div>
            <p>No notifications yet</p>
            <p className="empty-subtitle">You'll see your booking and payment notifications here</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
              >
                <div className="notification-content">
                  <div className="notification-header-row">
                    <h3 className="notification-title">{notification.title}</h3>
                    {!notification.read && <span className="unread-badge">New</span>}
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-footer">
                    <span className="notification-time">{formatDate(notification.timestamp)}</span>
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;

