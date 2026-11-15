import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, CheckCircle2, Clock, AlertCircle, ArrowLeft, 
  RefreshCw, CheckCheck, UserCheck, Stethoscope, 
  Calendar, CreditCard, ShieldAlert, Filter, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // 'All' | 'Unread' | 'Verification' | 'Clinical'
  const [isMarking, setIsMarking] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('dentaai_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE}/api/admin/notifications`, { headers });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch admin notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('dentaai_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE}/api/admin/notifications/${id}/read`, {
        method: 'PUT',
        headers
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id || n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarking(true);
    try {
      const token = localStorage.getItem('dentaai_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE}/api/admin/notifications/read-all`, {
        method: 'PUT',
        headers
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    } finally {
      setIsMarking(false);
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'Unread') return !n.isRead;
    if (filter === 'Verification') {
      const t = (n.title || '').toLowerCase() + (n.message || '').toLowerCase();
      return t.includes('doctor') || t.includes('verification') || t.includes('credential');
    }
    if (filter === 'Clinical') {
      const t = (n.title || '').toLowerCase() + (n.message || '').toLowerCase();
      return t.includes('consultation') || t.includes('appointment') || t.includes('scan');
    }
    return true;
  });

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  const getNotifIcon = (notif) => {
    const text = (notif.title || '').toLowerCase() + (notif.message || '').toLowerCase();
    if (text.includes('doctor') || text.includes('credential')) {
      return { icon: <Stethoscope size={18} />, bg: '#EFF6FF', color: '#2563EB' };
    }
    if (text.includes('payment') || text.includes('fee')) {
      return { icon: <CreditCard size={18} />, bg: '#F0FDF4', color: '#16A34A' };
    }
    if (text.includes('appointment') || text.includes('booking')) {
      return { icon: <Calendar size={18} />, bg: '#F5F3FF', color: '#7C3AED' };
    }
    return { icon: <Bell size={18} />, bg: '#FFFBEB', color: '#D97706' };
  };

  return (
    <div className="screening-history-wrapper" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 16px 48px' }}>
      <motion.div initial="hidden" animate="show" variants={stagger}>
        
        {/* Navigation Breadcrumb */}
        <motion.div variants={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/dashboard/admin" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
              <ArrowLeft size={16} /> Admin Console
            </Link>
            <span style={{ color: '#CBD5E1' }}>/</span>
            <span style={{ color: '#17324D', fontWeight: 800, fontSize: '0.95rem' }}>System Alerts & Notifications</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleMarkAllRead} 
              disabled={isMarking || unreadCount === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #BFD4E5', padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, color: unreadCount === 0 ? '#94A3B8' : '#17324D', cursor: unreadCount === 0 ? 'default' : 'pointer' }}
            >
              <CheckCheck size={14} color="#059669" /> Mark All as Read
            </button>
            <button 
              onClick={fetchNotifications} 
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #BFD4E5', padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, color: '#17324D', cursor: 'pointer' }}
            >
              <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
            </button>
          </div>
        </motion.div>

        {/* Title Header */}
        <motion.div variants={item} className="card" style={{ padding: '24px', borderRadius: '18px', border: '1px solid #BFD4E5', marginBottom: '20px', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#17324D', margin: '0 0 4px' }}>
              Admin Notifications
            </h2>
            <p style={{ color: '#64748B', margin: 0, fontSize: '0.88rem' }}>
              Real-time operational alerts for doctor verifications, new registrations, and critical system events.
            </p>
          </div>
          {unreadCount > 0 && (
            <span style={{ background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5', padding: '6px 14px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 800 }}>
              {unreadCount} Unread Notifications
            </span>
          )}
        </motion.div>

        {/* Filter Pills */}
        <motion.div variants={item} style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['All', 'Unread', 'Verification', 'Clinical'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                background: filter === tab ? '#17324D' : '#FFFFFF',
                color: filter === tab ? '#FFFFFF' : '#475569',
                border: filter === tab ? '1px solid #17324D' : '1px solid #CBD5E1',
                padding: '6px 16px',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab === 'Unread' && unreadCount > 0 ? `Unread (${unreadCount})` : tab}
            </button>
          ))}
        </motion.div>

        {/* Notification List */}
        <motion.div variants={item} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isLoading ? (
            <div className="card" style={{ padding: '48px 20px', textAlign: 'center', color: '#64748B', borderRadius: '16px' }}>
              <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 12px', display: 'block', color: '#00A6A6' }} />
              Loading notifications...
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div className="card" style={{ padding: '48px 20px', textAlign: 'center', color: '#64748B', borderRadius: '16px' }}>
              <Bell size={32} style={{ margin: '0 auto 12px', color: '#CBD5E1', display: 'block' }} />
              No notifications matching the selected filter.
            </div>
          ) : (
            filteredNotifs.map((notif) => {
              const iconMeta = getNotifIcon(notif);
              return (
                <div 
                  key={notif._id || notif.id}
                  className="card"
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    border: notif.isRead ? '1px solid #E2E8F0' : '1px solid #93C5FD',
                    background: notif.isRead ? '#FFFFFF' : '#F0F9FF',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: iconMeta.bg, color: iconMeta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      {iconMeta.icon}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: '#17324D' }}>
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB' }} />
                        )}
                      </div>
                      <p style={{ margin: '0 0 6px 0', fontSize: '0.86rem', color: '#334155', lineHeight: 1.5 }}>
                        {notif.message}
                      </p>
                      <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif._id || notif.id)}
                        title="Mark as read"
                        style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700, color: '#2563EB', cursor: 'pointer' }}
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </motion.div>

      </motion.div>
    </div>
  );
};

export default AdminNotifications;
