import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Get backend URL
    const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || '';
    if (!backendUrl) {
      return NextResponse.json({ error: 'Backend URL not configured' }, { status: 500 });
    }
    
    // Proxy request to real backend
    const backendRes = await fetch(`${backendUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json({ error: data.error || 'Registration failed', details: data.details }, { status: backendRes.status });
    }

    const response = NextResponse.json({
      message: data.message || 'Account created successfully! Please complete your athlete profile.',
      userId: data.userId || (data.user && data.user.id),
      token: data.token,
      user: data.user,
    }, { status: 201 });

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
    return NextResponse.json({ error: err.message || 'Internal server error during registration' }, { status: 500 });
  }
}
