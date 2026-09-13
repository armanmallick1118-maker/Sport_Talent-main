import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set('token', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    sameSite: 'lax',
  });
  return response;
}

export async function GET() {
  return POST();
}
