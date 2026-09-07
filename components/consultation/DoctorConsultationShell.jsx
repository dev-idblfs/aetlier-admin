'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Spinner } from '@/lib/heroui';
import { Video, Phone } from '@/lib/icons';
import {
  useGetAppointmentQuery,
  useGetConsultationQuery,
  useSetMediaModeMutation,
} from '@/redux/services/api';
import {
  canJoinConsultation,
  getJoinWindowHint,
  getAppointmentDateTime,
} from '@/utils/consultationJoinWindow';
import { formatDate, formatTime } from '@/utils/dateFormatters';
import {
  formatDoctorConsultationError,
  preflightMediaPermissions,
} from '@/utils/consultationErrors';
import DoctorConsultationRoom from './DoctorConsultationRoom';

const PHASE = {
  LOBBY: 'lobby',
  CALL: 'call',
};

export default function DoctorConsultationShell({ appointmentId }) {
  const router = useRouter();
  const [phase, setPhase] = useState(PHASE.LOBBY);
  const [mediaMode, setMediaMode] = useState('video');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const {
    data: appointment,
    isLoading,
    isError,
    error,
  } = useGetAppointmentQuery(appointmentId, { skip: !appointmentId });

  const { data: consultation } = useGetConsultationQuery(appointmentId, {
    skip: !appointmentId,
  });

  const [setMediaModeApi] = useSetMediaModeMutation();

  const patientName = useMemo(() => {
    return (
      appointment?.patient_info?.full_name ||
      appointment?.user?.name ||
      appointment?.patient_name ||
      consultation?.patient_name ||
      'Patient'
    );
  }, [appointment, consultation]);

  const joinAvailable = useMemo(
    () => canJoinConsultation(appointment),
    [appointment]
  );

  const { date, time } = getAppointmentDateTime(appointment);

  const handleJoin = async () => {
    setIsJoining(true);
    setJoinError('');
    try {
      const media = await preflightMediaPermissions(mediaMode);
      if (!media.ok) {
        setJoinError(formatDoctorConsultationError(media.error));
        return;
      }
      try {
        await setMediaModeApi({ appointmentId, media_mode: mediaMode }).unwrap();
      } catch {
        // non-fatal
      }
      setPhase(PHASE.CALL);
    } catch (e) {
      setJoinError(formatDoctorConsultationError(e));
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-950">
        <Spinner size="lg" color="warning" />
      </div>
    );
  }

  if (isError) {
    const status = error?.status;
    const isDenied = status === 403;
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
        <p className="mb-2 font-semibold">
          {isDenied
            ? 'Access denied'
            : status === 404
              ? 'Appointment not found'
              : 'Unable to load appointment'}
        </p>
        <p className="mb-6 max-w-sm text-sm text-white/60">
          {isDenied
            ? 'Only the assigned doctor can join this consultation.'
            : 'Check the link or return to appointments.'}
        </p>
        <Button
          className="rounded-full bg-[#db924b] text-white"
          onPress={() => router.push('/appointments')}
        >
          Back to appointments
        </Button>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
        <p className="mb-2 font-semibold">Appointment not found</p>
        <Button
          className="rounded-full bg-[#db924b] text-white"
          onPress={() => router.push('/appointments')}
        >
          Back to appointments
        </Button>
      </div>
    );
  }

  if (appointment.consultation_mode !== 'online') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
        <p className="mb-2 font-semibold">This is an in-clinic appointment</p>
        <Button
          className="rounded-full bg-[#db924b] text-white"
          onPress={() => router.push('/appointments')}
        >
          Back to appointments
        </Button>
      </div>
    );
  }

  if (phase === PHASE.CALL) {
    return (
      <DoctorConsultationRoom
        appointmentId={appointmentId}
        patientName={patientName}
        mediaMode={mediaMode}
      />
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
      <h1 className="mb-2 font-serif text-2xl font-medium">Video consultation</h1>
      <p className="mb-1 text-white/80">{patientName}</p>
      <p className="mb-8 text-sm text-white/50">
        {formatDate(date)} · {formatTime(time)}
      </p>

      <div className="mb-8 flex gap-3">
        <button
          type="button"
          onClick={() => setMediaMode('video')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
            mediaMode === 'video'
              ? 'bg-[#db924b] text-white'
              : 'bg-white/10 text-white/70'
          }`}
          aria-pressed={mediaMode === 'video'}
        >
          <Video className="h-4 w-4" />
          Video
        </button>
        <button
          type="button"
          onClick={() => setMediaMode('audio')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
            mediaMode === 'audio'
              ? 'bg-[#db924b] text-white'
              : 'bg-white/10 text-white/70'
          }`}
          aria-pressed={mediaMode === 'audio'}
        >
          <Phone className="h-4 w-4" />
          Audio
        </button>
      </div>

      {joinError ? (
        <p className="mb-4 max-w-sm text-sm text-red-400" role="alert">
          {joinError}
        </p>
      ) : null}

      <Button
        className="min-h-12 w-full max-w-xs rounded-full bg-[#db924b] font-semibold text-white"
        isDisabled={!joinAvailable || isJoining}
        isLoading={isJoining}
        onPress={handleJoin}
        startContent={<Video className="h-4 w-4" />}
      >
        Join secure consultation
      </Button>
      <p className="mt-4 text-xs text-white/40">{getJoinWindowHint()}</p>
      {!joinAvailable && (
        <p className="mt-2 text-xs text-amber-400/80">Outside join window</p>
      )}
      <p className="mt-3 max-w-xs text-[10px] text-white/35">
        Browser will request camera and microphone before connecting.
      </p>
      <button
        type="button"
        className="mt-6 text-sm text-white/40 underline hover:text-white/70"
        onClick={() => router.push('/appointments')}
      >
        Cancel
      </button>
    </div>
  );
}
