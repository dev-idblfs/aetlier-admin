'use client';

import { use } from 'react';
import ConsultationAuthGate from '@/components/consultation/ConsultationAuthGate';
import DoctorConsultationShell from '@/components/consultation/DoctorConsultationShell';

export default function ConsultationPage({ params }) {
  const { appointmentId } = use(params);

  return (
    <ConsultationAuthGate>
      <DoctorConsultationShell appointmentId={appointmentId} />
    </ConsultationAuthGate>
  );
}
