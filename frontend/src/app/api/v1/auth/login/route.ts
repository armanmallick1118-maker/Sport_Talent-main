import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Please provide both email and password' }, { status: 400 });
    }

    const result = authenticateUser(email, password);

    if (result.notFound) {
      return NextResponse.json({
        error: result.error,
        notFound: true,
        email: email.trim().toLowerCase(),
      }, { status: 404 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const response = NextResponse.json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
    }, { status: 200 });

    response.cookies.set('token', result.token!, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
      httpOnly: false,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error during authentication' }, { status: 500 });
  }
}
