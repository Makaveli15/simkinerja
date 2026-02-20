'use client';

import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LuChevronLeft,
  LuChevronDown,
  LuMenu,
  LuBell,
  LuUser,
  LuLogOut,
} from 'react-icons/lu';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  hasSubmenu?: boolean;
  submenu?: MenuItem[];
}

interface User {
  id: number;
  username: string;
  email?: string;
  nama_lengkap?: string;
  role: string;
  foto?: string;
  tim_nama?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: string;
  read: boolean;
  referenceId?: number;
  referenceType?: string;
}

interface SidebarProps {
  menuItems: MenuItem[];
  user: User | null;
  notifications: Notification[];
  unreadCount: number;
  onLogout: () => void;
  onNotificationClick: (notification: Notification) => void;
  onMarkAllRead: () => void;
  profilePath: string;
  roleLabel: string;
  roleColor: string;
}

// Memoized Menu Item Component
const MenuItemComponent = memo(function MenuItemComponent({
  item,
  isCollapsed,
  pathname,
  isSubmenuOpen,
  onSubmenuToggle,
}: {
  item: MenuItem;
  isCollapsed: boolean;
  pathname: string;
  isSubmenuOpen: boolean;
  onSubmenuToggle: () => void;
}) {
  const isActive = pathname === item.href || 
    (item.hasSubmenu && item.submenu?.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/')));

  if (item.hasSubmenu && item.submenu) {
    return (
      <div>
        <button
          onClick={onSubmenuToggle}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
            isActive
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <span className="flex-shrink-0">{item.icon}</span>
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left font-medium">{item.label}</span>
              <LuChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>
        
        {!isCollapsed && isSubmenuOpen && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
            {item.submenu.map((subItem) => {
              const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
              return (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    isSubActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {subItem.icon}
                  <span>{subItem.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      {!isCollapsed && <span className="font-medium">{item.label}</span>}
    </Link>
  );
});

// Memoized Notification Item
const NotificationItem = memo(function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors ${
        !notification.read ? 'bg-blue-50/50' : ''
      }`}
    >
      <p className="text-sm font-medium text-gray-900 line-clamp-1">{notification.title}</p>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
      <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
    </button>
  );
});

// Main Sidebar Component
const OptimizedSidebar = memo(function OptimizedSidebar({
  menuItems,
  user,
  notifications,
  unreadCount,
  onLogout,
  onNotificationClick,
  onMarkAllRead,
  profilePath,
  roleLabel,
  roleColor,
}: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Auto-open submenu based on current path
  useEffect(() => {
    const activeMenu = menuItems.find(item => 
      item.hasSubmenu && item.submenu?.some(sub => 
        pathname === sub.href || pathname.startsWith(sub.href + '/')
      )
    );
    if (activeMenu) {
      setOpenSubmenu(activeMenu.href);
    }
  }, [pathname, menuItems]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmenuToggle = useCallback((href: string) => {
    setOpenSubmenu(prev => prev === href ? null : href);
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-lg border border-gray-200"
      >
        <LuMenu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Image src="/images/bps-logo.png" alt="Logo" width={32} height={32} priority />
              <span className="font-bold text-gray-800">SIMKinerja</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg hidden lg:block"
          >
            <LuChevronLeft className={`w-5 h-5 text-gray-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-4rem-4rem)]">
          {menuItems.map((item) => (
            <MenuItemComponent
              key={item.href}
              item={item}
              isCollapsed={isCollapsed}
              pathname={pathname}
              isSubmenuOpen={openSubmenu === item.href}
              onSubmenuToggle={() => handleSubmenuToggle(item.href)}
            />
          ))}
        </nav>

        {/* User Info */}
        {!isCollapsed && user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                {user.nama_lengkap?.charAt(0) || user.username.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.nama_lengkap || user.username}
                </p>
                <p className={`text-xs ${roleColor}`}>{roleLabel}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Top Bar */}
      <header className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-30 transition-all duration-300 ${
        isCollapsed ? 'left-20' : 'left-64'
      } left-0 lg:left-auto`}>
        <div className="h-full flex items-center justify-end px-4 lg:px-6 gap-4">
          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <LuBell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <button onClick={onMarkAllRead} className="text-xs text-blue-600 hover:text-blue-700">
                      Tandai semua dibaca
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notif) => (
                      <NotificationItem
                        key={notif.id}
                        notification={notif}
                        onClick={() => onNotificationClick(notif)}
                      />
                    ))
                  ) : (
                    <p className="p-4 text-sm text-gray-500 text-center">Tidak ada notifikasi</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                {user?.nama_lengkap?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
              <LuChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-3 border-b border-gray-100">
                  <p className="font-medium text-gray-900">{user?.nama_lengkap || user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="p-2">
                  <Link
                    href={profilePath}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <LuUser className="w-4 h-4" />
                    Profil Saya
                  </Link>
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LuLogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
});

export default OptimizedSidebar;
