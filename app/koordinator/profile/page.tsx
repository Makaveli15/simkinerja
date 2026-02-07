'use client';

import React, { useState, useEffect } from 'react';
import { 
  LuUser,
  LuMail,
  LuPhone,
  LuBuilding,
  LuPencil,
  LuSave,
  LuX,
  LuLock,
  LuEye,
  LuEyeOff,
  LuCircleCheck,
  LuTriangleAlert
} from 'react-icons/lu';

interface Profile {
  id: number;
  nama: string;
  username: string;
  email: string;
  nip: string;
  jabatan: string;
  telepon: string;
  foto: string;
  tim_id: number;
  tim_nama: string;
}

export default function KoordinatorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    nama: '',
    email: '',
    telepon: '',
    jabatan: ''
  });

  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/koordinator/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setEditForm({
          nama: data.user.nama || '',
          email: data.user.email || '',
          telepon: data.user.telepon || '',
          jabatan: data.user.jabatan || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/koordinator/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(prev => prev ? { ...prev, ...editForm } : null);
        setEditMode(false);
        alert('Profil berhasil diperbarui');
      } else {
        const error = await res.json();
        alert(error.error || 'Gagal memperbarui profil');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Password baru tidak cocok');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password minimal 6 karakter');
      return;
    }

    try {
      const res = await fetch('/api/koordinator/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (res.ok) {
        setPasswordSuccess('Password berhasil diubah');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        const error = await res.json();
        setPasswordError(error.error || 'Gagal mengubah password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Terjadi kesalahan');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Gagal memuat profil</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-600">Kelola informasi profil Anda</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-green-500 to-emerald-500"></div>

        {/* Profile Info */}
        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="absolute -top-12 left-6">
            <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden">
              {profile.foto ? (
                <img src={profile.foto} alt={profile.nama} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {profile.nama?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <div className="flex justify-end pt-4">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors"
              >
                <LuPencil className="w-4 h-4" />
                <span>Edit Profil</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditMode(false);
                    setEditForm({
                      nama: profile.nama || '',
                      email: profile.email || '',
                      telepon: profile.telepon || '',
                      jabatan: profile.jabatan || ''
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <LuX className="w-4 h-4" />
                  <span>Batal</span>
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <LuSave className="w-4 h-4" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Name & Role */}
          <div className="mt-8">
            {editMode ? (
              <input
                type="text"
                value={editForm.nama}
                onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                className="text-2xl font-bold text-gray-900 border-b-2 border-green-500 focus:outline-none w-full"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900">{profile.nama}</h2>
            )}
            <p className="text-green-600 font-medium mt-1">Koordinator Tim</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Username */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <LuUser className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="font-medium text-gray-900">{profile.username}</p>
              </div>
            </div>

            {/* NIP */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <LuBuilding className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">NIP</p>
                <p className="font-medium text-gray-900">{profile.nip || '-'}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <LuMail className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Email</p>
                {editMode ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="font-medium text-gray-900 border-b border-gray-300 focus:border-green-500 focus:outline-none w-full"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{profile.email || '-'}</p>
                )}
              </div>
            </div>

            {/* Telepon */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <LuPhone className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Telepon</p>
                {editMode ? (
                  <input
                    type="tel"
                    value={editForm.telepon}
                    onChange={(e) => setEditForm({ ...editForm, telepon: e.target.value })}
                    className="font-medium text-gray-900 border-b border-gray-300 focus:border-green-500 focus:outline-none w-full"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{profile.telepon || '-'}</p>
                )}
              </div>
            </div>

            {/* Tim */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <LuBuilding className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tim</p>
                <p className="font-medium text-gray-900">{profile.tim_nama}</p>
              </div>
            </div>

            {/* Jabatan */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <LuUser className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Jabatan</p>
                {editMode ? (
                  <input
                    type="text"
                    value={editForm.jabatan}
                    onChange={(e) => setEditForm({ ...editForm, jabatan: e.target.value })}
                    className="font-medium text-gray-900 border-b border-gray-300 focus:border-green-500 focus:outline-none w-full"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{profile.jabatan || '-'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Keamanan</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <LuLock className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Password</p>
              <p className="text-sm text-gray-500">Terakhir diubah: Tidak diketahui</p>
            </div>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors"
          >
            Ubah Password
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ubah Password</h3>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <LuX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
                <LuTriangleAlert className="w-5 h-5" />
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl flex items-center gap-2">
                <LuCircleCheck className="w-5 h-5" />
                {passwordSuccess}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password Saat Ini
                </label>
                <div className="relative">
                  <input
                    type={showPassword.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Masukkan password saat ini"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.current ? <LuEyeOff className="w-5 h-5" /> : <LuEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Masukkan password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.new ? <LuEyeOff className="w-5 h-5" /> : <LuEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Konfirmasi password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.confirm ? <LuEyeOff className="w-5 h-5" /> : <LuEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleChangePassword}
                className="w-full px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                Ubah Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
