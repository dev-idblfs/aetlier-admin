'use client';

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { Spinner } from '@heroui/react';
import Cookies from 'js-cookie';
import config from '@/config';
import { fetchUserProfile } from '@/redux/slices/authSlice';
import { canAccessAdminPortal } from '@/utils/permissions';

/**
 * Thin auth gate for full-bleed consultation (outside dashboard chrome).
 * Does not poll /auth/me when there is no token (avoids 401 loops).
 */
export default function ConsultationAuthGate({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const redirectedRef = useRef(false);
  const { user, isLoading, isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => {
    const token = Cookies.get(config.tokenKey);
    if (!token) {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      const returnTo =
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '/consultation';
      router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    dispatch(fetchUserProfile());
  }, [dispatch, router]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      const returnTo =
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '/consultation';
      router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (user && !canAccessAdminPortal(user)) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-950">
        <Spinner size="lg" color="warning" />
      </div>
    );
  }

  if (!canAccessAdminPortal(user)) {
    return null;
  }

  return children;
}
