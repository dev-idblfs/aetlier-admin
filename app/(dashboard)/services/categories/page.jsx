'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import CategoryManager from '@/components/shared/CategoryManager';
import { PageHeader } from '@/components/ui';

export default function ServiceCategoriesPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Service Categories"
                description="Manage categories for services offered"
                backUrl="/services"
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <CategoryManager
                    type="SERVICE"
                />
            </div>
        </div>
    );
}
