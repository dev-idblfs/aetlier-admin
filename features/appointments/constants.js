export const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'invoiced', label: 'Invoiced' },
]

export const STATUS_COLORS = {
  pending: 'warning',
  confirmed: 'primary',
  completed: 'success',
  cancelled: 'danger',
  rescheduled: 'warning',
  invoiced: 'secondary',
}

export const MODE_OPTIONS = [
  { value: 'all-modes', label: 'All Modes' },
  { value: 'in_person', label: 'In-clinic' },
  { value: 'online', label: 'Online' },
]

export const APPOINTMENT_STATUSES = [
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'rescheduled', label: 'Rescheduled' },
  { key: 'invoiced', label: 'Invoiced' },
]
