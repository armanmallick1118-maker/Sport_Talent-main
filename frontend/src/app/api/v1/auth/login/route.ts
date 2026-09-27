import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Please provide both email and password' }, { status: 400 });
    }

    // Get backend URL
    const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // Proxy request to real backend
    let backendRes;
    try {
      backendRes = await fetch(`${backendUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
    } catch (fetchErr: any) {
      // If backend is unreachable, check known demo accounts for offline fallback
      const cleanEmail = email.trim().toLowerCase();
      const isKnownDemo =
        cleanEmail === 'athlete@prana.ai' ||
        cleanEmail === 'scout@prana.ai' ||
        cleanEmail === 'arman.mallick1118@gmail.com' ||
        password === 'Athlete123!' ||
        password === 'PRANA2026!' ||
        password === 'Liza@2107';

      if (isKnownDemo) {
        const isArman = cleanEmail === 'arman.mallick1118@gmail.com';
        const isScout = cleanEmail.includes('scout');
        const token = 'prana_offline_' + Date.now();
        const user = {
          id: isArman ? 'usr_arman' : 'usr_demo',
          email: cleanEmail,
          role: isScout ? 'scout' : 'athlete',
          fullName: isArman ? 'Arman Mallick' : (isScout ? 'Coach Jack' : 'PRANA Athlete'),
          profileComplete: true,
          profileCompletionPercentage: 100,
        };
        const response = NextResponse.json({
          message: 'Login successful (Offline mode)',
          token,
          user,
        }, { status: 200 });
        response.cookies.set('token', token, {
          path: '/',
          maxAge: 30 * 24 * 60 * 60,
          sameSite: 'lax',
          httpOnly: false,
        });
        return response;
      }
      return NextResponse.json({ error: 'Backend server is unreachable at ' + backendUrl + '. Please ensure the backend is running.' }, { status: 503 });
    }

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
