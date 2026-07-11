'use client';

import { Spinner } from '@heroui/react';

export default function PlatformLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Spinner size="lg" color="primary" />
    </div>
  );
}
