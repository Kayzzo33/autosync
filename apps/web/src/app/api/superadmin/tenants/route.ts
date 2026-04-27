import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'my_admin_api_key_123';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('superToken')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Cookie não encontrado' }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/superadmin/tenants`, {
      headers: {
        'x-admin-key': ADMIN_API_KEY,
        'Cookie': `superToken=${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Railway retornou ${res.status}: ${err}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: `Erro de comunicação: ${err.message}` }, { status: 500 });
  }
}
