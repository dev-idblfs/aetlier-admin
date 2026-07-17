'use client';

export const dynamic = 'force-dynamic';

import MobilePromotionManager from '@/features/mobile-promotions/components/MobilePromotionManager';
import { ListPageLayout } from '@/components/ui';

export default function MobileHomeSettingsPage() {
    return (
        <ListPageLayout
            title="Mobile Home"
            breadcrumbs={[
                { label: 'Settings', href: '/settings' },
                { label: 'Mobile Home' },
            ]}
        >
            <div className="rounded-xl border border-default-200 bg-content1 p-6 shadow-sm">
                <p className="mb-4 text-sm text-default-500">
                    Manage banners and offers on the Aetlier mobile home feed (`GET /api/mobile/home`).
                </p>
                <MobilePromotionManager />
            </div>
        </ListPageLayout>
    );
}
