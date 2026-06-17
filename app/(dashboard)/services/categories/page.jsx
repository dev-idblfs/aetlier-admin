'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import CategoryManager from '@/features/categories/components/CategoryManager';
import { ListPageLayout } from '@/components/ui';

export default function ServiceCategoriesPage() {
    return (
        <ListPageLayout
            title="Service Categories"
            breadcrumbs={[
                { label: 'Services', href: '/services' },
                { label: 'Categories' },
            ]}
        >
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <CategoryManager
                    type="SERVICE"
                />
            </div>
        </ListPageLayout>
    );
}
