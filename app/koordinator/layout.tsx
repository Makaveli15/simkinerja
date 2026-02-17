'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import FirstLoginModal from '../components/FirstLoginModal';
import { 
  LuLayoutDashboard, 
  LuClipboardList, 
  LuTrendingUp, 
  LuCloudDownload,
  LuChevronLeft,
  LuChevronRight,
  LuChevronDown,
  LuMenu,
  LuBell,
  LuUser,
  LuLogOut,
  LuActivity,
  LuClipboardCheck,
  LuCircleCheck,
  LuCircleX,
  LuFilePen,
  LuChartBar,
  LuPin
} from 'react-icons/lu';

interface User {
  id: number;
  username: string;
  email: string;
  nama_lengkap: string;
  role: string;
  foto?: string;
  tim_id?: number;
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

export default function KoordinatorLayout({
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

  // Kegiatan submenu state - auto open when on kegiatan page
  const [isKegiatanOpen, setIsKegiatanOpen] = useState(pathname.startsWith('/koordinator/kegiatan') || pathname.startsWith('/koordinator/statistik'));

  // Auto open kegiatan submenu when navigating to kegiatan pages
  useEffect(() => {
    if (pathname.startsWith('/koordinator/kegiatan') || pathname.startsWith('/koordinator/statistik')) {
      setIsKegiatanOpen(true);
    }
  }, [pathname]);

  const menuItems = [
    { 
      href: '/koordinator/dashboard', 
      label: 'Dashboard', 
      icon: <LuLayoutDashboard className="w-5 h-5" />
    },
    { 
      href: '/koordinator/kegiatan',
      label: 'Kegiatan', 
      icon: <LuClipboardList className="w-5 h-5" />,
      hasSubmenu: true,
      submenu: [
        { 
          href: '/koordinator/kegiatan/approval', 
          label: 'Approval', 
          icon: <LuClipboardCheck className="w-4 h-4" />
        },
        { 
          href: '/koordinator/kegiatan/monitoring', 
          label: 'Monitoring', 
          icon: <LuActivity className="w-4 h-4" />
        },
        { 
          href: '/koordinator/statistik', 
          label: 'Statistik Kinerja', 
          icon: <LuTrendingUp className="w-4 h-4" />
        },
      ]
    },
    { 
      href: '/koordinator/laporan', 
      label: 'Laporan', 
      icon: <LuCloudDownload className="w-5 h-5" />
    },
  ];

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/koordinator/profile');
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
      const res = await fetch('/api/koordinator/notifications');
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

  // Keyboard shortcut for ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotifOpen(false);
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  const getNotificationLink = (notif: Notification): string => {
    const id = notif.referenceId;
    const refType = notif.referenceType;
    
    if (refType === 'kegiatan' && id) {
      if (notif.type === 'approval_request') {
        return `/koordinator/kegiatan/approval/${id}`;
      }
      return `/koordinator/kegiatan/monitoring/${id}`;
    }
    
    switch (notif.type) {
      case 'approval_request':
        return '/koordinator/kegiatan/approval';
      case 'kegiatan':
        return id ? `/koordinator/kegiatan/monitoring/${id}` : '/koordinator/kegiatan/monitoring';
      default:
        return '/koordinator/dashboard';
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id);
    setIsNotifOpen(false);
    const link = getNotificationLink(notif);
    router.push(link);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'approval_request': return <LuClipboardList className="w-4 h-4" />;
      case 'approval': return <LuCircleCheck className="w-4 h-4" />;
      case 'rejection': return <LuCircleX className="w-4 h-4" />;
      case 'revision_request': return <LuFilePen className="w-4 h-4" />;
      case 'kegiatan': return <LuChartBar className="w-4 h-4" />;
      default: return <LuPin className="w-4 h-4" />;
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/koordinator/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/koordinator/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all notifications:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" suppressHydrationWarning>
      {/* First Login Modal */}
      {showFirstLoginModal && (
        <FirstLoginModal 
          isOpen={showFirstLoginModal}
          onSuccess={handleFirstLoginSuccess}
          apiEndpoint="/api/koordinator/change-password"
        />
      )}

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-gradient-to-b from-blue-500 via-blue-500 to-blue-600 text-white z-50
        transition-all duration-300 ease-in-out shadow-2xl
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
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
            const isActive = pathname === item.href || pathname.startsWith(item.href.split('?')[0] + '/') || pathname === item.href.split('?')[0];
            const hasSubmenu = 'hasSubmenu' in item && item.hasSubmenu;
            
            if (hasSubmenu && 'submenu' in item) {
              // Menu with submenu (Kegiatan)
              const isSubmenuActive = pathname.startsWith('/koordinator/kegiatan');
              return (
                <div key={item.href}>
                  <button
                    onClick={() => setIsKegiatanOpen(!isKegiatanOpen)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                      ${isSubmenuActive 
                        ? 'bg-white/20 text-white font-semibold' 
                        : 'text-white/90 hover:bg-white/15 hover:text-white'
                      }
                      ${isCollapsed ? 'justify-center' : 'justify-between'}
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </div>
                    {!isCollapsed && (
                      <LuChevronDown className={`w-4 h-4 transition-transform duration-200 ${isKegiatanOpen ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                  
                  {/* Submenu */}
                  {(isKegiatanOpen || isCollapsed) && !isCollapsed && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-white/20 pl-3">
                      {item.submenu.map((sub) => {
                        const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`
                              flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm
                              ${isSubActive 
                                ? 'bg-white text-indigo-600 shadow-md font-semibold' 
                                : 'text-white/80 hover:bg-white/15 hover:text-white'
                              }
                            `}
                          >
                            {sub.icon}
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            // Regular menu item
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-white text-indigo-600 shadow-lg font-semibold' 
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

      {/* Main content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-lg"
            >
              <LuMenu className="w-5 h-5" />
            </button>

            {/* Title for desktop */}
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold text-gray-900">Portal Koordinator</h1>
              {user?.tim_nama && (
                <p className="text-sm text-gray-500">{user.tim_nama}</p>
              )}
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all"
                >
                  <LuBell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full text-white text-xs flex items-center justify-center shadow-lg">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications dropdown */}
                {isNotifOpen && (
                  <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Notifikasi</h3>
                        <p className="text-xs text-white/80">{unreadCount} notifikasi baru</p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-colors"
                        >
                          Tandai semua
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            onClick={() => handleNotificationClick(notif)}
                            className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${notif.read ? 'opacity-60' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-xl">{getTypeIcon(notif.type)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={`font-medium text-gray-900 text-sm ${notif.read ? 'font-normal' : ''}`}>{notif.title}</p>
                                  {!notif.read && (
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                  )}
                                </div>
                                <p className="text-gray-600 text-xs truncate">{notif.message}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <p className="text-gray-400 text-xs">{formatTimeAgo(notif.time)}</p>
                                  {!notif.read && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                      className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
                                    >
                                      Tandai dibaca
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-400">
                          Tidak ada notifikasi
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 overflow-hidden">
                    {user?.foto ? (
                      <img src={user.foto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-semibold text-sm">{user?.username?.charAt(0)?.toUpperCase() || 'K'}</span>
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="font-medium text-gray-900 text-sm">{user?.nama_lengkap || user?.username || 'Loading...'}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role || '-'}</p>
                  </div>
                  <LuChevronDown className="w-4 h-4 text-gray-400 hidden lg:block" />
                </button>

                {/* Profile dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-14 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
                          {user?.foto ? (
                            <img src={user.foto} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-semibold text-lg">{user?.username?.charAt(0)?.toUpperCase() || 'K'}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{user?.nama_lengkap || user?.username}</p>
                          <p className="text-xs text-white/80">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/koordinator/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-700"
                      >
                        <LuUser className="w-5 h-5" />
                        Profil Saya
                      </Link>
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors text-red-600 w-full"
                      >
                        <LuLogOut className="w-5 h-5" />
                        Keluar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
