/**
 * Standar warna untuk status di seluruh aplikasi
 * 
 * Status Kegiatan:
 * - selesai    : Hijau (green) - positif/sukses
 * - berjalan   : Biru (blue) - aktif/sedang proses
 * - belum_mulai: Abu (gray) - netral/belum dimulai
 * - tertunda   : Kuning/Amber (yellow/amber) - peringatan/ditunda
 * - bermasalah : Merah (red) - negatif/bermasalah
 * 
 * Status Kinerja:
 * - Sukses         : Hijau (green) - positif
 * - Perlu Perhatian: Kuning (yellow) - peringatan
 * - Bermasalah     : Merah (red) - negatif
 */

// Badge styles untuk status kegiatan (digunakan di badge/label)
export const getStatusBadge = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'selesai':
      return 'bg-green-100 text-green-700';
    case 'berjalan':
      return 'bg-blue-100 text-blue-700';
    case 'belum_mulai':
      return 'bg-gray-100 text-gray-700';
    case 'tertunda':
      return 'bg-amber-100 text-amber-700';
    case 'bermasalah':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// Badge styles dengan border (untuk jadwal/calendar)
export const getStatusBadgeWithBorder = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'selesai':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'berjalan':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'belum_mulai':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'tertunda':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'bermasalah':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Background color solid (untuk kalender/progress bar)
export const getStatusBgColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'selesai':
      return 'bg-green-500';
    case 'berjalan':
      return 'bg-blue-500';
    case 'belum_mulai':
      return 'bg-gray-400';
    case 'tertunda':
      return 'bg-amber-500';
    case 'bermasalah':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};

// Hex color untuk chart
export const getStatusChartColor = (status: string): string => {
  switch (status) {
    case 'Selesai':
      return '#10B981'; // green-500
    case 'Berjalan':
      return '#3B82F6'; // blue-500
    case 'Belum Mulai':
      return '#9CA3AF'; // gray-400
    case 'Tertunda':
      return '#F59E0B'; // amber-500
    case 'Bermasalah':
      return '#EF4444'; // red-500
    default:
      return '#9CA3AF'; // gray-400
  }
};

// Label untuk status
export const getStatusLabel = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'selesai': return 'Selesai';
    case 'berjalan': return 'Berjalan';
    case 'belum_mulai': return 'Belum Mulai';
    case 'tertunda': return 'Tertunda';
    case 'bermasalah': return 'Bermasalah';
    default: return status || 'Tidak Diketahui';
  }
};

// Status Kinerja badge
export const getStatusKinerjaBadge = (status: string): string => {
  switch (status) {
    case 'Sukses':
      return 'bg-green-100 text-green-700';
    case 'Perlu Perhatian':
      return 'bg-amber-100 text-amber-700';
    case 'Bermasalah':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// Status Kinerja hex color untuk chart
export const getStatusKinerjaChartColor = (status: string): string => {
  switch (status) {
    case 'Sukses':
      return '#10B981'; // green-500
    case 'Perlu Perhatian':
      return '#F59E0B'; // amber-500
    case 'Bermasalah':
      return '#EF4444'; // red-500
    default:
      return '#9CA3AF'; // gray-400
  }
};

// Prioritas/Dampak badge
export const getPrioritasBadge = (prioritas: string): string => {
  switch (prioritas?.toLowerCase()) {
    case 'tinggi':
      return 'bg-red-100 text-red-700';
    case 'sedang':
      return 'bg-amber-100 text-amber-700';
    case 'rendah':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// Verifikasi badge
export const getVerifikasiBadge = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'valid':
      return 'bg-green-100 text-green-700';
    case 'revisi':
      return 'bg-amber-100 text-amber-700';
    case 'pending':
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

// Skor kinerja color
export const getSkorColor = (skor: number): string => {
  if (skor >= 80) return 'text-green-600';
  if (skor >= 60) return 'text-amber-600';
  if (skor > 0) return 'text-red-600';
  return 'text-gray-400';
};

// Status tindak lanjut badge
export const getTindakLanjutBadge = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'resolved':
    case 'done':
    case 'selesai':
      return 'bg-green-100 text-green-700';
    case 'in_progress':
    case 'proses':
      return 'bg-blue-100 text-blue-700';
    case 'open':
    case 'terbuka':
      return 'bg-red-100 text-red-700';
    case 'pending':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// Status tindak lanjut label
export const getTindakLanjutLabel = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'resolved': return 'Selesai';
    case 'in_progress': return 'Proses';
    case 'open': return 'Terbuka';
    case 'done': return 'Selesai';
    case 'pending': return 'Pending';
    default: return status || 'Tidak Diketahui';
  }
};
