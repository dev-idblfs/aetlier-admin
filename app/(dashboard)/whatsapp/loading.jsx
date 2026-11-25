import { Spinner } from '@/lib/heroui';

export default function WhatsAppLoading() {
  return <div className="flex min-h-64 items-center justify-center"><Spinner label="Loading WhatsApp workspace…" /></div>;
}
