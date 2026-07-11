'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Spinner } from '@heroui/react';
import Cookies from 'js-cookie';
import PlatformSignIn from '@/components/platform/PlatformSignIn';
import platformApiClient from '@/lib/platformApiClient';
import config from '@/config';
import { setPlatformLoading } from '@/redux/slices/platformAuthSlice';

function resolveReturnTo(searchParams) {
  const raw = searchParams.get('returnTo');
  if (
    raw?.startsWith('/platform') &&
    !raw.startsWith('//') &&
    raw !== '/platform/login'
  ) {
    return raw;
  }
  return '/platform/tenants';
}

function PlatformLoginContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState('checking');
  const returnTo = resolveReturnTo(searchParams);

  const showLoginForm = useCallback(() => {
    dispatch(setPlatformLoading(false));
    setPhase('form');
  }, [dispatch]);

  useEffect(() => {
    const token = Cookies.get(config.platformTokenKey);
    if (!token) {
      showLoginForm();
      return;
    }

    platformApiClient
      .get('/platform/auth/me')
      .then(() => {
        router.replace(returnTo);
      })
      .catch(() => {
        Cookies.remove(config.platformTokenKey);
        showLoginForm();
      });
  }, [router, returnTo, showLoginForm]);

  const handleSignInSuccess = () => {
    router.replace(returnTo);
  };

  if (phase === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="lg" color="primary" />
          <p className="text-gray-600">Checking platform session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Platform console</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in as a platform operator
          </p>
        </div>
        <PlatformSignIn onSuccess={handleSignInSuccess} />
      </div>
    </div>
  );
}

export default function PlatformLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Spinner size="lg" color="primary" />
        </div>
      }
    >
      <PlatformLoginContent />
    </Suspense>
  );
}
