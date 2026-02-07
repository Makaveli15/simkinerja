'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KegiatanPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/koordinator/kegiatan/approval');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>
  );
}
