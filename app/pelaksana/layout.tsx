'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import FirstLoginModal from '../components/FirstLoginModal';
import { 
  LuLayoutDashboard, 
  LuClipboardList, 
  LuFileText, 
  LuCalendar,
  LuChevronLeft,
  LuChevronDown,
  LuMenu,
  LuBell,
  LuUser,
  LuLogOut,
  LuTimer,
  LuPencil,
  LuCircleCheck,
  LuTriangleAlert,
  LuInfo
} from 'react-icons/lu';

interface User {
  id: number;
  username: string;
  email: string;
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

export default function PelaksanaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);

  // Notifications state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // Profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { 
      href: '/pelaksana/dashboard', 
      label: 'Dashboard', 
      icon: <LuLayoutDashboard className="w-5 h-5" />
    },
    { 
      href: '/pelaksana/kegiatan', 
      label: 'Kegiatan', 
      icon: <LuClipboardList className="w-5 h-5" />
    },
    { 
      href: '/pelaksana/laporan', 
      label: 'Laporan Kinerja', 
      icon: <LuFileText className="w-5 h-5" />
    },
    { 
      href: '/pelaksana/jadwal', 
      label: 'Jadwal Kegiatan', 
      icon: <LuCalendar className="w-5 h-5" />
    },
  ];

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/pelaksana/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else if (res.status === 401 || res.status === 403) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, [router]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/pelaksana/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchNotifications();
    
    // Check if first login from sessionStorage
    const isFirstLogin = sessionStorage.getItem('isFirstLogin');
    if (isFirstLogin === 'true') {
      setShowFirstLoginModal(true);
    }
  }, [fetchProfile, fetchNotifications, pathname]);

  // Handle first login modal success
  const handleFirstLoginSuccess = () => {
    sessionStorage.removeItem('isFirstLogin');
    setShowFirstLoginModal(false);
  };

  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchProfile();
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, [fetchProfile]);

  // Close dropdowns when clicking outside
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/pelaksana/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', notificationId: id }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/pelaksana/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications:', error);
    }
  };

  const getNotificationLink = (notif: Notification): string => {
    const id = notif.referenceId;
    const refType = notif.referenceType;
    
    // Prioritas berdasarkan referenceType jika ada
    if (refType === 'kegiatan' && id) {
      return `/pelaksana/kegiatan/${id}`;
    }
    if (refType === 'dokumen' && id) {
      return `/pelaksana/kegiatan/${id}`;
    }
    if (refType === 'evaluasi' && id) {
      return `/pelaksana/kegiatan/${id}`;
    }
    
    // Fallback berdasarkan type notifikasi
    switch (notif.type) {
      case 'tugas':
      case 'deadline':
      case 'kegiatan':
      case 'kendala':
        return id ? `/pelaksana/kegiatan/${id}` : '/pelaksana/kegiatan';
      case 'evaluasi':
      case 'validasi':
        return id ? `/pelaksana/kegiatan/${id}` : '/pelaksana/kegiatan';
      case 'laporan':
        return '/pelaksana/laporan';
      case 'jadwal':
        return '/pelaksana/jadwal';
      default:
        return '/pelaksana/dashboard';
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id);
    setIsNotifOpen(false);
    const link = getNotificationLink(notif);
    router.push(link);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'tugas':
      case 'kegiatan':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <LuClipboardList className="w-5 h-5 text-blue-600" />
          </div>
        );
      case 'deadline':
        return (
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <LuTimer className="w-5 h-5 text-red-600" />
          </div>
        );
      case 'evaluasi':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <LuPencil className="w-5 h-5 text-purple-600" />
          </div>
        );
      case 'validasi':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <LuCircleCheck className="w-5 h-5 text-green-600" />
          </div>
        );
      case 'kendala':
        return (
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <LuTriangleAlert className="w-5 h-5 text-orange-600" />
          </div>
        );
      case 'info':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <LuInfo className="w-5 h-5 text-green-600" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <LuBell className="w-5 h-5 text-gray-600" />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-blue-500 via-blue-500 to-blue-600 text-white transition-all duration-300 z-40 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/15">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg overflow-hidden">
                <Image src="/images/logo-bps.png" alt="Logo BPS" width={32} height={32} className="object-contain" />
              </div>
              <div>
                <span className="font-bold text-lg text-white">SIMKINERJA</span>
                <p className="text-xs text-blue-100">BPS Kab. Timor Tengah Utara</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mx-auto shadow-lg overflow-hidden">
              <Image src="/images/logo-bps.png" alt="Logo BPS" width={32} height={32} className="object-contain" />
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="p-3 space-y-1 mt-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-white text-blue-600 shadow-lg font-semibold' 
                    : 'text-white/90 hover:bg-white/15 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute bottom-4 right-4 w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all hidden lg:flex"
        >
          <LuChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Header */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
          <div className="h-full px-4 flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <LuMenu className="w-6 h-6 text-gray-600" />
            </button>

            {/* Page Title */}
            <div className="hidden lg:block">
              <h2 className="text-lg font-semibold text-gray-800">
                Portal Pelaksana
              </h2>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <LuBell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Tandai semua dibaca
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 ${
                              !notif.read ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            <div className="flex gap-3">
                              {getNotificationIcon(notif.type)}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                              </div>
                              {!notif.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <LuBell className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500">Tidak ada notifikasi</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 p-1.5 pr-3 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center overflow-hidden">
                    {user?.foto ? (
                      <Image
                        src={user.foto}
                        alt={user.username}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-700 leading-tight">{user?.username || 'User'}</p>
                    <p className="text-xs text-gray-500 leading-tight capitalize">{user?.role || 'pelaksana'}</p>
                  </div>
                  <LuChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">{user?.username}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      {user?.tim_nama && (
                        <p className="text-xs text-blue-600 mt-1">Tim: {user.tim_nama}</p>
                      )}
                    </div>
                    <div className="p-2">
                      <Link
                        href="/pelaksana/profile"
                        className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <LuUser className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium">Profil Saya</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LuLogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Keluar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* First Login Modal */}
      <FirstLoginModal 
        isOpen={showFirstLoginModal} 
        onSuccess={handleFirstLoginSuccess} 
      />
    </div>
  );
}
