/**
 * Auth callback — dev-only token handoff when cookies are not shared across ports.
 */

'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Spinner } from '@/lib/heroui';
import { setCredentials } from '@/redux/slices/authSlice';
import { canAccessAdminPortal } from '@/utils/permissions';
import config from '@/config';
import { setAccessTokenCookie, removeAccessTokenCookie } from '@/lib/authCookies';
import { usesCookieAuth, storeRefreshToken } from '@/services/sessionApi';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      if (usesCookieAuth()) {
        router.replace('/');
        return;
      }

      const token = searchParams.get('token');
      const refresh = searchParams.get('refresh');
      const returnUrl = searchParams.get('returnUrl') || '/';

      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }

      if (!token) {
        setError('No authentication token provided');
        setTimeout(() => router.replace('/login'), 2000);
        return;
      }

      try {
        setAccessTokenCookie(token);
        if (refresh) {
          storeRefreshToken(refresh);
        }

        const response = await fetch(`${config.apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Invalid token: ${response.status}`);
        }

        const user = await response.json();

        if (!canAccessAdminPortal(user)) {
          setError('Access denied. Admin privileges required.');
          removeAccessTokenCookie();
          setTimeout(() => router.replace('/login'), 2000);
          return;
        }

        dispatch(
          setCredentials({
            user,
            permissions: user.permissions || [],
          })
        );

        router.push(returnUrl.startsWith('/') ? returnUrl : '/');
      } catch (err) {
        console.error('Auth callback failed:', err);
        setError('Authentication failed. Redirecting...');
        removeAccessTokenCookie();
        setTimeout(() => router.replace('/login'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, dispatch, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Spinner size="lg" color="primary" />
        <h2 className="text-xl font-semibold text-gray-900">
          {error || 'Completing sign in...'}
        </h2>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Spinner size="lg" color="primary" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
