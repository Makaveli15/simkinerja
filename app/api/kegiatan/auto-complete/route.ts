import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  checkCompletionConditions, 
  checkAndAutoCompleteKegiatan, 
  updateOutputAndCheckComplete,
  checkAllRunningKegiatan
} from '@/lib/services/autoCompleteService';

interface AuthPayload {
  id: number;
  username: string;
  role: string;
}

async function getAuth(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth')?.value;
  if (!authCookie) return null;
  try {
    return JSON.parse(decodeURIComponent(authCookie)) as AuthPayload;
  } catch {
    return null;
  }
}

// GET - Cek status penyelesaian kegiatan
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kegiatanId = searchParams.get('kegiatan_id');

    if (!kegiatanId) {
      return NextResponse.json({ error: 'kegiatan_id is required' }, { status: 400 });
    }

    const completionStatus = await checkCompletionConditions(parseInt(kegiatanId));

    if (!completionStatus) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      completion_status: completionStatus
    });
  } catch (error) {
    console.error('Error checking completion status:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST - Trigger auto-complete untuk kegiatan
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hanya role tertentu yang bisa trigger auto-complete
    if (!['admin', 'pimpinan', 'koordinator', 'ppk'].includes(auth.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { kegiatan_id, action } = body;

    // Batch update all running kegiatan
    if (action === 'batch_update_all') {
      const results = await checkAllRunningKegiatan();
      return NextResponse.json({ 
        success: true, 
        message: `Processed ${results.length} kegiatan`,
        results 
      });
    }

    if (!kegiatan_id) {
      return NextResponse.json({ error: 'kegiatan_id is required' }, { status: 400 });
    }

    let result;
    
    if (action === 'update_and_check') {
      // Update output dan cek auto-complete
      result = await updateOutputAndCheckComplete(parseInt(kegiatan_id));
    } else {
      // Default: cek dan auto-complete
      result = await checkAndAutoCompleteKegiatan(parseInt(kegiatan_id));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in auto-complete:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Terjadi kesalahan server' 
    }, { status: 500 });
  }
}
