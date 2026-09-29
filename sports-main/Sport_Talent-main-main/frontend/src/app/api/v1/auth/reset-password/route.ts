import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Get backend URL with safe local fallback
    const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

    // Proxy request to real backend
    const backendRes = await fetch(`${backendUrl}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json({ error: data.error || 'Reset password error' }, { status: backendRes.status });
    }

    return NextResponse.json({ message: data.message || 'Password reset successfully' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Reset password error' }, { status: 500 });
  }
}
