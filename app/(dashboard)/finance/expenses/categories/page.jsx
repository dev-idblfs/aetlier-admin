'use client';

// Force dynamic rendering - no SSR/static optimization needed for admin
export const dynamic = 'force-dynamic';

import CategoryManager from '@/features/categories/components/CategoryManager';
import { PageHeader } from '@/components/ui';

export default function ExpenseCategoriesPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Expense Categories"
                description="Manage categories for business expenses"
                backUrl="/finance/expenses"
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <CategoryManager
                    type="EXPENSE"
                />
            </div>
        </div>
    );
}
