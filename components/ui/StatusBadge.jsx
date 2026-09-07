/**
 * StatusBadge — one registry for appointment, invoice, lead, verification, doctor, boolean.
 */

'use client';

import { Chip } from '@/lib/heroui';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Circle,
  ShieldOff,
  FileText,
} from '@/lib/icons';

const statusConfig = {
  // Appointment
  pending: { color: 'warning', icon: Clock, label: 'Pending' },
  confirmed: { color: 'success', icon: CheckCircle, label: 'Confirmed' },
  completed: { color: 'primary', icon: CheckCircle, label: 'Completed' },
  cancelled: { color: 'danger', icon: XCircle, label: 'Cancelled' },
  canceled: { color: 'danger', icon: XCircle, label: 'Cancelled' },
  rescheduled: { color: 'secondary', icon: AlertCircle, label: 'Rescheduled' },
  invoiced: { color: 'secondary', icon: FileText, label: 'Invoiced' },
  no_show: { color: 'danger', icon: ShieldOff, label: 'No show' },

  // Invoice
  draft: { color: 'default', icon: Circle, label: 'Draft' },
  sent: { color: 'primary', icon: FileText, label: 'Sent' },
  paid: { color: 'success', icon: CheckCircle, label: 'Paid' },
  partially_paid: { color: 'warning', icon: Clock, label: 'Partially paid' },
  overdue: { color: 'danger', icon: AlertCircle, label: 'Overdue' },
  void: { color: 'default', icon: ShieldOff, label: 'Void' },
  refunded: { color: 'secondary', icon: AlertCircle, label: 'Refunded' },

  // Lead
  new: { color: 'primary', icon: Circle, label: 'New' },
  contacted: { color: 'secondary', icon: Clock, label: 'Contacted' },
  qualified: { color: 'success', icon: CheckCircle, label: 'Qualified' },
  converted: { color: 'success', icon: CheckCircle, label: 'Converted' },
  lost: { color: 'danger', icon: XCircle, label: 'Lost' },

  // Verification / doctor
  approved: { color: 'success', icon: CheckCircle, label: 'Approved' },
  rejected: { color: 'danger', icon: XCircle, label: 'Rejected' },
  under_review: { color: 'warning', icon: Clock, label: 'Under review' },
  submitted: { color: 'primary', icon: FileText, label: 'Submitted' },
  unverified: { color: 'default', icon: Circle, label: 'Unverified' },
  verified: { color: 'success', icon: CheckCircle, label: 'Verified' },
  published: { color: 'success', icon: CheckCircle, label: 'Published' },
  unpublished: { color: 'default', icon: Circle, label: 'Unpublished' },

  // User / boolean
  active: { color: 'success', icon: CheckCircle, label: 'Active' },
  inactive: { color: 'default', icon: Circle, label: 'Inactive' },
  suspended: { color: 'danger', icon: XCircle, label: 'Suspended' },
  true: { color: 'success', icon: CheckCircle, label: 'Yes' },
  false: { color: 'default', icon: XCircle, label: 'No' },
};

export default function StatusBadge({
  status,
  size = 'sm',
  showIcon = true,
  className = '',
  label,
}) {
  const normalizedStatus = String(status ?? '')
    .toLowerCase()
    .replace(/\s+/g, '_');
  const config = statusConfig[normalizedStatus] || {
    color: 'default',
    icon: Circle,
    label: label || status || 'Unknown',
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
      {label || config.label}
    </Chip>
  );
}
