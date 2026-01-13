/**
 * Admin Login Page - Redirects to Frontend Login
 * Admin panel uses unified login through the frontend
 */

'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { Spinner } from '@heroui/react';

export default function LoginPage() {
    const router = useRouter();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    useEffect(() => {
        // If already authenticated as admin, go to dashboard
        if (isAuthenticated && user) {
            if (['admin', 'super_admin', 'superadmin'].includes(user.role)) {
                router.push('/');
                return;
            }
        }

        // Redirect to frontend login
        const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
        const callbackUrl = `${adminUrl}/auth/callback`;

        // Redirect to frontend with login modal trigger and callback URL
        window.location.href = `${frontendUrl}?login=true&adminRedirect=${encodeURIComponent(callbackUrl)}`;
    }, [isAuthenticated, user, router]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center space-y-4">
                <Spinner size="lg" color="primary" />
                <h2 className="text-xl font-semibold text-gray-900">Redirecting to Login...</h2>
                <p className="text-gray-500">Please wait</p>
            </div>
        </div>
    );
}
