import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Please provide both email and password' }, { status: 400 });
    }

    // Get backend URL
    const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || '';
    if (!backendUrl) {
      return NextResponse.json({ error: 'Backend URL not configured' }, { status: 500 });
    }

    // Proxy request to real backend
    const backendRes = await fetch(`${backendUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await backendRes.json().catch(() => ({}));

    // If backend returns 404 with notFound flag
    if (backendRes.status === 404 && data.notFound) {
      return NextResponse.json({
        error: data.error,
        notFound: true,
        email: email.trim().toLowerCase(),
      }, { status: 404 });
    }

    if (!backendRes.ok) {
      return NextResponse.json({ error: data.error || 'Login failed' }, { status: backendRes.status });
    }

    const response = NextResponse.json({
      message: 'Login successful',
      token: data.token,
      user: data.user,
    }, { status: 200 });

    if (data.token) {
      response.cookies.set('token', data.token, {
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
        sameSite: 'lax',
        httpOnly: false,
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error during authentication' }, { status: 500 });
  }
}
