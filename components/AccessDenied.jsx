'use client';

import Link from 'next/link';
import { ShieldOff } from 'lucide-react';
import { Button } from '@heroui/react';

export default function AccessDenied({ title = 'Access denied', message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <ShieldOff className="w-7 h-7 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-500 max-w-md mb-6">
        {message ||
          "You don't have permission to view this module. Ask a super admin to assign the required permissions to your role."}
      </p>
      <Button as={Link} href="/" color="primary" variant="flat">
        Back to dashboard
      </Button>
    </div>
  );
}
