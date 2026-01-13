/**
 * Reusable Stats Card Component
 */

'use client';

import { motion } from 'framer-motion';

/**
 * StatsCard - Display metric with icon
 * 
 * @param {Object} props
 * @param {string} props.title - Metric label
 * @param {string|number} props.value - Metric value
 * @param {React.ComponentType} props.icon - Lucide icon component
 * @param {string} props.trend - Trend text (e.g., "+12%")
 * @param {string} props.trendDirection - up, down, or neutral
 * @param {string} props.iconBg - Icon background color class
 * @param {string} props.iconColor - Icon color class
 */
export default function StatsCard({
    title,
    value,
    icon: Icon,
    trend,
    trendDirection = 'neutral',
    iconBg = 'bg-primary-100',
    iconColor = 'text-primary-600',
    className = '',
}) {
    const trendColors = {
        up: 'text-green-600 bg-green-50',
        down: 'text-red-600 bg-red-50',
        neutral: 'text-gray-600 bg-gray-50',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
        bg-white rounded-2xl p-6 border border-gray-100 shadow-sm
        hover:shadow-md transition-shadow
        ${className}
      `}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                    {trend && (
                        <div className={`
              inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium
              ${trendColors[trendDirection]}
            `}>
                            {trend}
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                )}
            </div>
        </motion.div>
    );
}
