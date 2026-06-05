/**
 * Admin Login Page - unified login via the public app /login page
 */

'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@heroui/react';
import { canAccessAdminPortal } from '@/utils/permissions';
import apiClient from '@/lib/apiClient';
import { refreshAccessToken } from '@/services/sessionApi';
import Cookies from 'js-cookie';
import config from '@/config';

function getFrontendLoginUrl(returnTo = '/') {
    const frontendUrl = (
        process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
    ).replace(/\/$/, '');
    const params = new URLSearchParams({ from: 'admin' });
    if (returnTo?.startsWith('/')) {
        params.set('returnTo', returnTo);
    }
    return `${frontendUrl}/login?${params.toString()}`;
}

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState(null);

    useEffect(() => {
        const bootstrap = async () => {
            const returnTo = searchParams.get('returnTo') || '/';
            try {
                let accessToken = Cookies.get(config.tokenKey);
                if (!accessToken) {
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
                    window.location.href = getFrontendLoginUrl(returnTo);
                    return;
                }

                const { data: user } = await apiClient.get('/auth/me', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (!canAccessAdminPortal(user)) {
                    const frontendUrl =
                        process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
                    window.location.href = `${frontendUrl.replace(/\/$/, '')}/`;
                    return;
                }

                await apiClient.patch(
                    '/auth/session',
                    { active_context: 'admin' },
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );

                const destination =
                    returnTo.startsWith('/') && returnTo !== '/login'
                        ? returnTo
                        : '/';
                router.push(destination);
            } catch (err) {
                console.error('Admin login bootstrap failed:', err);
                setError('Unable to sign in. Redirecting to the public app...');
                setTimeout(() => {
                    window.location.href = getFrontendLoginUrl(returnTo);
                }, 1500);
            }
        };

        bootstrap();
    }, [router, searchParams]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center space-y-4">
                <Spinner size="lg" color="primary" />
                <h2 className="text-xl font-semibold text-gray-900">
                    {error || 'Checking your session...'}
                </h2>
                {!error && <p className="text-gray-500">Please wait</p>}
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
