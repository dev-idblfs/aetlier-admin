/**
 * Navigation Progress Bar
 * Shows a visual indicator during page transitions to prevent perceived full page reload
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        // Show progress bar when navigation starts
        setIsNavigating(true);

        // Hide progress bar after a short delay
        const timer = setTimeout(() => {
            setIsNavigating(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    if (!isNavigating) return null;

    return (
        <div
            className="navigation-progress"
            role="progressbar"
            aria-label="Page loading"
        />
    );
}
