'use client';

import { Suspense } from 'react';
import { Spinner } from '@heroui/react';
import PlatformLayout from '@/components/platform/PlatformLayout';

export const dynamic = 'force-dynamic';

export default function PlatformConsoleLayout({ children }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Spinner size="lg" color="primary" />
        </div>
      }
    >
      <PlatformLayout>{children}</PlatformLayout>
    </Suspense>
  );
}
