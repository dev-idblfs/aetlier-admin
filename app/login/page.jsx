/**
 * Admin login — native form + SSO via shared session cookie (prod).
 */

'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Spinner } from '@heroui/react';
import Cookies from 'js-cookie';
import AdminSignIn from '@/components/auth/AdminSignIn';
import { canAccessAdminPortal } from '@/utils/permissions';
import { refreshAccessToken, canRefreshSession } from '@/services/sessionApi';
import apiClient from '@/lib/apiClient';
import config from '@/config';
import { setLoading } from '@/redux/slices/authSlice';

function resolveReturnTo(searchParams) {
  const raw = searchParams.get('returnTo');
  if (raw?.startsWith('/') && !raw.startsWith('//') && raw !== '/login') {
    return raw;
  }
  return '/';
}

function LoginContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState('checking');
  const [accessDenied, setAccessDenied] = useState(false);

  const returnTo = resolveReturnTo(searchParams);

  const showLoginForm = useCallback(() => {
    dispatch(setLoading(false));
    setPhase('form');
  }, [dispatch]);

  const enterDashboard = useCallback(() => {
    router.replace(returnTo);
  }, [router, returnTo]);

  const trySsoBootstrap = useCallback(async () => {
    setPhase('checking');
    setAccessDenied(false);

    let accessToken = Cookies.get(config.tokenKey);
    if (!accessToken && canRefreshSession()) {
      try {
        const refreshed = await refreshAccessToken();
        accessToken = refreshed?.tokens?.access_token;
        if (accessToken) {
          Cookies.set(config.tokenKey, accessToken, { expires: 7 });
        }
      } catch {
        accessToken = null;
      }
    }

    if (!accessToken) {
      showLoginForm();
      return;
    }

    try {
      const { data: user } = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
        skipAuthRedirect: true,
      });

      if (!canAccessAdminPortal(user)) {
        setAccessDenied(true);
        showLoginForm();
        return;
      }

      enterDashboard();
    } catch {
      Cookies.remove(config.tokenKey);
      showLoginForm();
    }
  }, [enterDashboard, showLoginForm]);

  useEffect(() => {
    trySsoBootstrap();
  }, [trySsoBootstrap]);

  const handleSignInSuccess = async (signInResult) => {
    const user = signInResult?.user;
    if (!user) {
      setAccessDenied(false);
      return;
    }

    if (!canAccessAdminPortal(user)) {
      setAccessDenied(true);
      return;
    }

    enterDashboard();
  };

  if (phase === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="lg" color="primary" />
          <p className="text-gray-600">Checking your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Aetlier Admin</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to the staff portal</p>
        </div>

        {accessDenied && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            This account does not have admin portal access. Contact your
            administrator if you believe this is an error.
          </div>
        )}

        <AdminSignIn onSuccess={handleSignInSuccess} />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Spinner size="lg" color="primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
