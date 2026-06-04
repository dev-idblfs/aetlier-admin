/**
 * Cross-app logout — clears admin session cookie, then returns to the public app.
 * Used by the frontend unified logout flow (different origin / port).
 */

'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { Spinner } from '@heroui/react';
import config from '@/config';

function getFrontendUrl() {
    return process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
}

function LogoutContent() {
    const searchParams = useSearchParams();

    useEffect(() => {
        Cookies.remove(config.tokenKey);
        Cookies.remove(config.refreshTokenKey);

        const redirect = searchParams.get('redirect') || getFrontendUrl();
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
