'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '../services/api';

type UserInfo = {
  id: string;
  tenant_id: string;
  role: string;
  nome?: string;
  tenant_slug?: string;
};

type AuthContextType = {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: UserInfo) => void;
  logout: () => void;
};

export const AuthContext = createContext({} as AuthContextType);

// Rotas que não exigem verificação de jwt
const publicRoutes = ['/login', '/cadastro'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Checa se tem o token no carregamento
    const token = Cookies.get('autosync_token');
    
    const isPublicRoute = publicRoutes.includes(pathname || '') || pathname?.startsWith('/tv');

    if (token) {
      if (user) {
        setIsLoading(false);
        if (isPublicRoute && !pathname?.startsWith('/tv')) router.replace('/');
        return;
      }

      api.get('/auth/me')
        .then((response) => {
          if (response.data?.user) {
            setUser(response.data.user);
            if (isPublicRoute && !pathname?.startsWith('/tv')) {
              router.replace('/');
            }
          } else {
            throw new Error('Usuário inválido');
          }
        })
        .catch((err) => {
          console.error('[AUTH ERROR] Falha na validação da sessão:', err.response?.data || err.message);
          setUser(null);
          Cookies.remove('autosync_token');
          if (!isPublicRoute) router.replace('/login');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
      setUser(null);
      if (!isPublicRoute) {
        router.replace('/login');
      }
    }
  }, [pathname]);

  const login = (token: string, userInfo: UserInfo) => {
    Cookies.set('autosync_token', token, { path: '/' });
    setUser(userInfo);
    router.replace('/');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout'); // Invalida refresh no banco
    } catch (err) {}
    Cookies.remove('autosync_token');
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
