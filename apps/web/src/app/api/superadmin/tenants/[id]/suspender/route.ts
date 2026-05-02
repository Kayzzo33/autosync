import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'my_admin_api_key_123';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.cookies.get('superToken')?.value;
  const { id } = params;

  if (!token) {
    return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/superadmin/tenants/${id}/suspender`, {
      method: 'PATCH',
      headers: {
        'x-admin-key': ADMIN_API_KEY,
        'Cookie': `superToken=${token}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao suspender inquilino' }, { status: 500 });
  }
}
