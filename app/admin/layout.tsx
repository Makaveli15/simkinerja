'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LuLayoutDashboard, 
  LuUsers, 
  LuBuilding2, 
  LuFileText, 
  LuBriefcase, 
  LuSettings,
  LuSearch,
  LuBell,
  LuChevronLeft,
  LuChevronDown,
  LuMenu,
  LuUser,
  LuLogOut,
  LuX,
  LuGauge
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

interface SearchResult {
  label: string;
  sublabel: string;
  href: string;
  type: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      href: '/admin/dashboard', 
      label: 'Dashboard', 
      icon: <LuLayoutDashboard className="w-5 h-5" />
    },
    { 
      href: '/admin/users', 
      label: 'Data Pengguna', 
      icon: <LuUsers className="w-5 h-5" />
    },
    { 
      href: '/admin/tim', 
      label: 'Data Tim', 
      icon: <LuBuilding2 className="w-5 h-5" />
    },
    { 
      href: '/admin/kro', 
      label: 'Data KRO', 
      icon: <LuFileText className="w-5 h-5" />
    },
    { 
      href: '/admin/mitra', 
      label: 'Data Mitra', 
      icon: <LuBriefcase className="w-5 h-5" />
    },
    { 
      href: '/admin/indikator', 
      label: 'Indikator Kinerja', 
      icon: <LuGauge className="w-5 h-5" />
    },
    { 
      href: '/admin/settings', 
      label: 'Pengaturan', 
      icon: <LuSettings className="w-5 h-5" />
    },
  ];

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile, pathname]); // Refetch when pathname changes (e.g., after profile update)

  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchProfile();
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, [fetchProfile]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
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
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
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

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotifOpen(false);
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
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
    const id = notif.referenceId || notif.id.split('-')[1];
    switch (notif.type) {
      case 'user':
        return '/admin/users';
      case 'kegiatan':
        return '/admin/kegiatan';
      case 'mitra':
        return '/admin/mitra';
      case 'tim':
        return '/admin/tim';
      case 'kro':
        return '/admin/kro';
      default:
        return '/admin/dashboard';
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
      case 'user':
        return '👤';
      case 'kegiatan':
        return '📋';
      case 'mitra':
        return '🤝';
      case 'tim':
        return '👥';
      case 'kro':
        return '📊';
      default:
        return '📌';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50">
      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <LuSearch className="w-5 h-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari pengguna, tim, mitra, kegiatan..."
                  className="flex-1 text-lg outline-none placeholder-gray-400"
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm px-2 py-1 bg-gray-100 rounded-lg"
                >
                  ESC
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Mencari...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="p-2">
                  {searchResults.map((result, index) => (
                    <Link
                      key={index}
                      href={result.href}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-sky-50 transition-all"
                    >
                      <span className="text-2xl">{getTypeIcon(result.type)}</span>
                      <div>
                        <div className="font-medium text-gray-900">{result.label}</div>
                        <div className="text-sm text-gray-500">{result.sublabel}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="p-8 text-center text-gray-500">
                  Tidak ada hasil untuk &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <p className="text-sm">Ketik untuk mulai mencari</p>
                  <p className="text-xs mt-2">Tekan <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">K</kbd> untuk membuka pencarian</p>
                </div>
              )}
            </div>
          </div>
        </div>
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
            const isActive = pathname === item.href;
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
              <h1 className="text-lg font-semibold text-gray-900">Portal Admin</h1>
            </div>

            {/* Search button */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all text-gray-500 min-w-[280px]"
            >
              <LuSearch className="w-4 h-4" />
              <span className="text-sm">Cari...</span>
              <kbd className="ml-auto text-xs bg-white px-2 py-1 rounded shadow">Ctrl+K</kbd>
            </button>

            <div className="flex items-center gap-2 lg:gap-4">
              {/* Mobile search button */}
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="md:hidden w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all"
              >
                <LuSearch className="w-5 h-5 text-gray-600" />
              </button>

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
                      <span className="font-semibold text-sm">{user?.username?.charAt(0)?.toUpperCase() || 'A'}</span>
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="font-medium text-gray-900 text-sm">{user?.username || 'Loading...'}</p>
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
                            <span className="font-semibold text-lg">{user?.username?.charAt(0)?.toUpperCase() || 'A'}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{user?.username}</p>
                          <p className="text-xs text-white/80">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/admin/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-700"
                      >
                        <LuUser className="w-5 h-5" />
                        Profil Saya
                      </Link>
                      <Link
                        href="/admin/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-700"
                      >
                        <LuSettings className="w-5 h-5" />
                        Pengaturan
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
