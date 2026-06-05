/**
 * Auth callback — prod uses shared session cookie; dev receives ?token= from frontend.
 */

'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Spinner } from '@heroui/react';
import Cookies from 'js-cookie';
import { setCredentials } from '@/redux/slices/authSlice';
import { canAccessAdminPortal } from '@/utils/permissions';
import { usesCookieAuth } from '@/services/sessionApi';
import config from '@/config';

const getFrontendUrl = () =>
    process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

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
            const returnUrl = searchParams.get('returnUrl') || '/';

            if (!token) {
                setError('No authentication token provided');
                setTimeout(() => {
                    window.location.href = `${getFrontendUrl()}/login?from=admin`;
                }, 2000);
                return;
            }

            try {
                Cookies.set(config.tokenKey, token, { expires: 7 });

                const response = await fetch(`${config.apiUrl}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) {
                    throw new Error(`Invalid token: ${response.status}`);
                }

                const user = await response.json();

                if (!canAccessAdminPortal(user)) {
                    setError('Access denied. Admin privileges required.');
                    Cookies.remove(config.tokenKey);
                    setTimeout(() => {
                        window.location.href = getFrontendUrl();
                    }, 2000);
                    return;
                }

                dispatch(
                    setCredentials({
                        user,
                        token,
                        permissions: user.permissions || [],
                    })
                );

                router.push(returnUrl);
            } catch (err) {
                console.error('Auth callback failed:', err);
                setError('Authentication failed. Redirecting...');
                Cookies.remove(config.tokenKey);
                setTimeout(() => {
                    window.location.href = `${getFrontendUrl()}/login?from=admin`;
                }, 2000);
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
