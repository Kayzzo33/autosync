'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'my_admin_api_key_123'; // Puxa do .env

export async function superadminLogin(email: string, password: string) {
  try {
    const res = await fetch(`${API_URL}/superadmin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      // Importante para não usar cache no Next.js
      cache: 'no-store'
    });

    const data = await res.json();
    
    if (!res.ok) {
      return { error: data.error || 'Erro ao autenticar' };
    }

    // O backend Fastify retornou o token no JSON, vamos definir o cookie no frontend Next.js
    cookies().set('superToken', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 horas
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Erro de comunicação com o servidor interno' };
  }
}

export async function superadminLogout() {
  cookies().delete('superToken');
  return { success: true };
}

export async function getTenants() {
  const token = cookies().get('superToken')?.value;
  if (!token) return { error: 'Não autorizado' };

  try {
    const res = await fetch(`${API_URL}/superadmin/tenants`, {
      headers: {
        'x-admin-key': ADMIN_API_KEY,
        'Cookie': `superToken=${token}`
      },
      cache: 'no-store'
    });
    if (!res.ok) return { error: 'Não autorizado' };
    return { data: await res.json() };
  } catch (error) {
    return { error: 'Erro de comunicação' };
  }
}

export async function generateInvite() {
  const token = cookies().get('superToken')?.value;
  if (!token) return { error: 'Não autorizado' };

  try {
    const res = await fetch(`${API_URL}/superadmin/convites`, {
      method: 'POST',
      headers: {
        'x-admin-key': ADMIN_API_KEY,
        'Cookie': `superToken=${token}`
      },
      cache: 'no-store'
    });
    if (!res.ok) return { error: 'Falha ao gerar convite' };
    return { data: await res.json() };
  } catch (error) {
    return { error: 'Erro de comunicação' };
  }
}

export async function toggleTenantStatus(id: string) {
  const token = cookies().get('superToken')?.value;
  if (!token) return { error: 'Não autorizado' };

  try {
    const res = await fetch(`${API_URL}/superadmin/tenants/${id}/suspender`, {
      method: 'PATCH',
      headers: {
        'x-admin-key': ADMIN_API_KEY,
        'Cookie': `superToken=${token}`
      },
      cache: 'no-store'
    });
    if (!res.ok) return { error: 'Falha ao alterar status' };
    return { success: true };
  } catch (error) {
    return { error: 'Erro de comunicação' };
  }
}

export async function getLogs() {
  const token = cookies().get('superToken')?.value;
  if (!token) return { error: 'Não autorizado' };

  try {
    const res = await fetch(`${API_URL}/superadmin/logs`, {
      headers: {
        'x-admin-key': ADMIN_API_KEY,
        'Cookie': `superToken=${token}`
      },
      cache: 'no-store'
    });
    if (!res.ok) return { error: 'Não autorizado' };
    return { data: await res.json() };
  } catch (error) {
    return { error: 'Erro de comunicação' };
  }
}
