import { Spinner } from '@/lib/heroui';

export default function VerificationLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size="lg" label="Loading verifications..." />
    </div>
  );
}
