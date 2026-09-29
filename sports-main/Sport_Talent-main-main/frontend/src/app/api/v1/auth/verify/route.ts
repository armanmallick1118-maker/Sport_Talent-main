import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    
    // Get backend URL with safe local fallback
    const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

    // Proxy request to real backend (backend expects GET for verify)
    const backendRes = await fetch(`${backendUrl}/api/v1/auth/verify`, {
      method: 'GET',
      headers: {
        'authorization': authHeader,
      },
      cache: 'no-store', // Prevent Next.js from caching the backend's response!
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json({ valid: false, error: data.error || 'Verification error' }, { status: backendRes.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: err.message || 'Verification error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
