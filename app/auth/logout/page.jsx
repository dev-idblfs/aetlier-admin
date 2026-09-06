/**
 * Cross-app logout — clears admin session cookie, then returns to the public app.
 * Used by the frontend unified logout flow (different origin / port).
 */

'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { removeAccessTokenCookie } from '@/lib/authCookies';
import { clearRefreshToken } from '@/services/sessionApi';
import { Spinner } from '@heroui/react';

function getFrontendUrl() {
    return process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
}

function isSafeRedirect(url) {
    if (!url) return false;
    try {
        const frontend = new URL(getFrontendUrl());
        const target = new URL(url, frontend.origin);
        if (target.origin === frontend.origin) return true;
        if (typeof window !== 'undefined' && target.origin === window.location.origin) {
            return target.pathname.startsWith('/');
        }
        return false;
    } catch {
        return false;
    }
}

function LogoutContent() {
    const searchParams = useSearchParams();

    useEffect(() => {
        removeAccessTokenCookie();
        clearRefreshToken();

        const requested = searchParams.get('redirect');
        const redirect = isSafeRedirect(requested) ? requested : getFrontendUrl();
        window.location.replace(redirect);
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center space-y-4">
                <Spinner size="lg" color="primary" />
                <p className="text-gray-600">Signing out...</p>
            </div>
        </div>
    );
}

export default function AuthLogoutPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <Spinner size="lg" color="primary" />
                </div>
            }
        >
            <LogoutContent />
        </Suspense>
    );
}
