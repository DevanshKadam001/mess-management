import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Bell, CheckCheck, X, Clock, ExternalLink } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToOrder?: (orderId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToOrder,
}) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSocket();

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
            <p className="text-xs text-slate-500">{unreadCount} unread</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 py-1 px-2 rounded-md hover:bg-orange-50 transition"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (!item.isRead) markAsRead(item.id);
                if (item.link && onNavigateToOrder) {
                  const parts = item.link.split('/');
                  const orderId = parts[parts.length - 1];
                  onNavigateToOrder(orderId);
                  onClose();
                }
              }}
              className={`p-3.5 transition cursor-pointer hover:bg-slate-50 flex items-start gap-3 ${
                !item.isRead ? 'bg-orange-50/40' : ''
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  !item.isRead ? 'bg-orange-500' : 'bg-transparent'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-semibold text-slate-800 truncate">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                  {item.message}
                </p>
                {item.link && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-orange-600 font-medium mt-1 hover:underline">
                    View Order Details <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
