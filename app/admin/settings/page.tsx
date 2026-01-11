'use client';

import { useState, useEffect } from 'react';
import { LuSettings, LuLock, LuInfo, LuCircleCheck, LuCircleAlert, LuTriangleAlert, LuTrendingUp, LuLoader } from 'react-icons/lu';

interface Settings {
  namaAplikasi: string;
  namaInstansi: string;
  emailAdmin: string;
  tahunAnggaran: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('umum');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // General settings
  const [settings, setSettings] = useState<Settings>({
    namaAplikasi: 'SIMKINERJA',
    namaInstansi: 'Badan Pusat Statistik',
    emailAdmin: 'admin@bps.go.id',
    tahunAnggaran: '2025',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('simkinerja_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const tabs = [
    { id: 'umum', label: 'Umum', icon: <LuSettings className="w-5 h-5" /> },
    { id: 'keamanan', label: 'Keamanan', icon: <LuLock className="w-5 h-5" /> },
    { id: 'tentang', label: 'Tentang', icon: <LuInfo className="w-5 h-5" /> },
  ];

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Save to localStorage
      localStorage.setItem('simkinerja_settings', JSON.stringify(settings));
      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validate
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Semua field harus diisi' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password baru minimal 6 karakter' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' });
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Password berhasil diubah!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal mengubah password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    } finally {
      setChangingPassword(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-gray-500 mt-1">Kelola pengaturan aplikasi</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <LuCircleCheck className="w-5 h-5" />
          ) : (
            <LuCircleAlert className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <nav className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            {activeTab === 'umum' && (
              <div className="p-6 space-y-6">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Pengaturan Umum</h2>
                  <p className="text-sm text-gray-500 mt-1">Konfigurasi dasar aplikasi</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Aplikasi</label>
                    <input
                      type="text"
                      value={settings.namaAplikasi}
                      onChange={(e) => setSettings({ ...settings, namaAplikasi: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Instansi</label>
                    <input
                      type="text"
                      value={settings.namaInstansi}
                      onChange={(e) => setSettings({ ...settings, namaInstansi: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Admin</label>
                    <input
                      type="email"
                      value={settings.emailAdmin}
                      onChange={(e) => setSettings({ ...settings, emailAdmin: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tahun Anggaran</label>
                    <select 
                      value={settings.tahunAnggaran}
                      onChange={(e) => setSettings({ ...settings, tahunAnggaran: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                    >
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleSaveSettings}
                      disabled={saving}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium disabled:opacity-50"
                    >
                      {saving ? (
                        <span className="flex items-center gap-2">
                          <LuLoader className="animate-spin w-4 h-4" />
                          Menyimpan...
                        </span>
                      ) : 'Simpan Perubahan'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'keamanan' && (
              <div className="p-6 space-y-6">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Pengaturan Keamanan</h2>
                  <p className="text-sm text-gray-500 mt-1">Kelola keamanan akun Anda</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <LuTriangleAlert className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Password Default</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Password default untuk reset user adalah: <span className="font-mono font-bold">BPS5305</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Saat Ini</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Masukkan password saat ini"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Masukkan password baru (min. 6 karakter)"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password Baru</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Ulangi password baru"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium disabled:opacity-50"
                    >
                      {changingPassword ? (
                        <span className="flex items-center gap-2">
                          <LuLoader className="animate-spin w-4 h-4" />
                          Mengubah...
                        </span>
                      ) : 'Ubah Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'tentang' && (
              <div className="p-6 space-y-6">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Tentang Aplikasi</h2>
                  <p className="text-sm text-gray-500 mt-1">Informasi tentang SIMKINERJA</p>
                </div>

                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
                    <LuTrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mt-4">SIMKINERJA</h3>
                  <p className="text-gray-500">Sistem Informasi Monitoring Capaian Kinerja</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Versi</p>
                    <p className="font-semibold text-gray-900">1.0.0</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Framework</p>
                    <p className="font-semibold text-gray-900">Next.js 16</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Database</p>
                    <p className="font-semibold text-gray-900">MySQL</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Style</p>
                    <p className="font-semibold text-gray-900">Tailwind CSS</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <LuInfo className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">Dikembangkan untuk</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Badan Pusat Statistik (BPS) Timor Tengah Utara untuk memantau dan mengelola capaian kinerja secara efektif dan efisien.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-400 pt-4">
                  © 2025 SIMKINERJA. All rights reserved.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
