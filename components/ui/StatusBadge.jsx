/**
 * Reusable Status Badge Component
 */

'use client';

import { Chip } from '@heroui/react';
import {
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Circle
} from 'lucide-react';

const statusConfig = {
    // Appointment statuses
    pending: { color: 'warning', icon: Clock, label: 'Pending' },
    confirmed: { color: 'success', icon: CheckCircle, label: 'Confirmed' },
    completed: { color: 'primary', icon: CheckCircle, label: 'Completed' },
    cancelled: { color: 'danger', icon: XCircle, label: 'Cancelled' },
    rescheduled: { color: 'secondary', icon: AlertCircle, label: 'Rescheduled' },

    // User statuses
    active: { color: 'success', icon: CheckCircle, label: 'Active' },
    inactive: { color: 'default', icon: Circle, label: 'Inactive' },
    suspended: { color: 'danger', icon: XCircle, label: 'Suspended' },

    // Generic
    true: { color: 'success', icon: CheckCircle, label: 'Yes' },
    false: { color: 'default', icon: XCircle, label: 'No' },
};

/**
 * StatusBadge - Displays status with icon and color
 * 
 * @param {Object} props
 * @param {string} props.status - Status key
 * @param {string} props.size - Badge size (sm, md, lg)
 * @param {boolean} props.showIcon - Show status icon
 */
export default function StatusBadge({
    status,
    size = 'sm',
    showIcon = true,
    className = ''
}) {
    const normalizedStatus = String(status).toLowerCase();
    const config = statusConfig[normalizedStatus] || {
        color: 'default',
        icon: Circle,
        label: status,
    };

    const Icon = config.icon;

    return (
        <Chip
            size={size}
            color={config.color}
            variant="flat"
            startContent={showIcon ? <Icon className="w-3.5 h-3.5" /> : null}
            classNames={{
                content: 'capitalize font-medium',
            }}
            className={className}
        >
            {config.label}
        </Chip>
    );
}
