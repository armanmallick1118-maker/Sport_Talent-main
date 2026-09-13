import { NextRequest, NextResponse } from 'next/server';
import { resetUserPassword } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const result = resetUserPassword(email, password);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ message: result.message }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Reset password error' }, { status: 500 });
  }
}
