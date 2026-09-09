import { NextRequest, NextResponse } from 'next/server';
import { registerNewUser } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, full_name, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const result = registerNewUser(email, password, full_name, role || 'athlete');

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      message: 'Account created successfully! Please complete your athlete profile.',
      userId: result.user.id,
      token: result.token,
      user: result.user,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error during registration' }, { status: 500 });
  }
}
