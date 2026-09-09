import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ valid: false, error: 'No token provided' }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ valid: false, error: 'Token expired or invalid' }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: payload.uid,
        email: payload.email,
        role: payload.role,
      },
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: err.message || 'Verification error' }, { status: 500 });
  }
}
