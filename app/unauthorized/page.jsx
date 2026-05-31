/**
 * Unauthorized Page
 * Shown when an authenticated user lacks admin portal access.
 */

'use client';

export const dynamic = 'force-dynamic';

import { Button } from '@heroui/react';
import { ShieldAlert } from 'lucide-react';

const getFrontendUrl = () =>
    process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="text-center space-y-5 max-w-md">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                    <ShieldAlert className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    Access denied
                </h1>
                <p className="text-gray-500">
                    Your account does not have permission to access the admin
                    portal. If you believe this is a mistake, contact a system
                    administrator.
                </p>
                <Button
                    color="primary"
                    onPress={() => {
                        window.location.href = getFrontendUrl();
                    }}
                >
                    Go to Aetlier
                </Button>
            </div>
        </div>
    );
}
