import { Spinner } from '@/lib/heroui';

export default function AuditLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size="lg" label="Loading audit logs..." />
    </div>
  );
}
