/**
 * Auth Callback Page
 * Receives authentication token from frontend login and stores it
 * URL: /auth/callback?token=xxx
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Spinner } from '@heroui/react';
import Cookies from 'js-cookie';
import { setCredentials } from '@/redux/slices/authSlice';
import config from '@/config';

// URL helpers
const getFrontendUrl = () => {
    return process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
};

const getFrontendLoginUrl = () => {
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
    return `${getFrontendUrl()}?login=true&adminRedirect=${encodeURIComponent(adminUrl + '/auth/callback')}`;
};

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useDispatch();
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');
            const returnUrl = searchParams.get('returnUrl') || '/';

            if (!token) {
                setError('No authentication token provided');
                setTimeout(() => {
                    window.location.href = getFrontendLoginUrl();
                }, 2000);
                return;
            }

            try {
                // Store token in cookies
                Cookies.set(config.tokenKey, token, { expires: 7 });

                // Fetch user profile to verify token and get user data
                const response = await fetch(`${config.apiUrl}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) throw new Error('Invalid token');

                const user = await response.json();

                // Verify user has admin access
                if (!['admin', 'super_admin', 'superadmin'].includes(user.role)) {
                    setError('Access denied. Admin privileges required.');
                    Cookies.remove(config.tokenKey);
                    setTimeout(() => {
                        window.location.href = getFrontendUrl();
                    }, 2000);
                    return;
                }

                // Update Redux state
                dispatch(setCredentials({ user, token }));

                // Redirect to dashboard
                router.push(returnUrl);
            } catch (err) {
                console.error('Auth callback error:', err);
                setError('Authentication failed. Please try again.');
                Cookies.remove(config.tokenKey);
                setTimeout(() => {
                    window.location.href = getFrontendLoginUrl();
                }, 2000);
            }
        };

        handleCallback();
    }, [searchParams, dispatch, router]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                {error ? (
                    <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-red-600 text-2xl">!</span>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">{error}</h2>
                        <p className="text-gray-500">Redirecting you back...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Spinner size="lg" color="primary" />
                        <h2 className="text-xl font-semibold text-gray-900">Authenticating...</h2>
                        <p className="text-gray-500">Please wait while we verify your credentials</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Spinner size="lg" color="primary" />
                    <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
                </div>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
