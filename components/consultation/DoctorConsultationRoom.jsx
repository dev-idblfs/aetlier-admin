'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, ConnectionState, Track } from 'livekit-client';
import { Button, Spinner } from '@heroui/react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useGetConsultationTokenMutation,
  useStartConsultationMutation,
  useEndConsultationMutation,
} from '@/redux/services/api';

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatError(err) {
  const detail = err?.data?.detail ?? err?.message;
  if (!detail) return 'Unable to connect. Check your connection and try again.';
  if (detail === 'consultation_access_denied') {
    return 'You do not have access to this consultation.';
  }
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg || String(d)).join(', ');
  return String(detail);
}

function VideoTile({ track, muted, className, mirror }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !track) return;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);

  if (!track) {
    return (
      <div className={`flex items-center justify-center bg-zinc-900 text-white/50 text-sm ${className || ''}`}>
        No video
      </div>
    );
  }

  return (
    <video
      ref={ref}
      muted={muted}
      playsInline
      autoPlay
      className={`${className || ''} ${mirror ? 'scale-x-[-1]' : ''} object-cover`}
    />
  );
}

export default function DoctorConsultationRoom({
  appointmentId,
  patientName = 'Patient',
  mediaMode = 'video',
}) {
  const router = useRouter();
  const [room] = useState(() => new Room({ adaptiveStream: true, dynacast: true }));
  const [phase, setPhase] = useState('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(mediaMode === 'audio');
  const [elapsed, setElapsed] = useState(0);
  const [remoteVideo, setRemoteVideo] = useState(null);
  const [localVideo, setLocalVideo] = useState(null);
  const [connectAttempt, setConnectAttempt] = useState(0);

  const timerRef = useRef(null);
  const startRef = useRef(null);

  const [getToken] = useGetConsultationTokenMutation();
  const [startConsultation] = useStartConsultationMutation();
  const [endConsultation] = useEndConsultationMutation();

  const getTokenRef = useRef(getToken);
  const startConsultationRef = useRef(startConsultation);
  getTokenRef.current = getToken;
  startConsultationRef.current = startConsultation;

  const refreshTracks = useCallback(() => {
    let remote = null;
    for (const participant of room.remoteParticipants.values()) {
      for (const pub of participant.videoTrackPublications.values()) {
        if (pub.source === Track.Source.ScreenShare) continue;
        if (pub.track) {
          remote = pub.track;
          break;
        }
      }
      if (remote) break;
    }
    setRemoteVideo(remote);

    const localPub = room.localParticipant?.getTrackPublication(Track.Source.Camera);
    setLocalVideo(localPub?.track || null);
  }, [room]);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const onState = (state) => {
      if (state === ConnectionState.Reconnecting) setPhase('reconnecting');
      if (state === ConnectionState.Connected) {
        setPhase((p) => (p === 'error' ? p : 'active'));
        startTimer();
        refreshTracks();
      }
      if (state === ConnectionState.Disconnected) stopTimer();
    };

    room.on(RoomEvent.ConnectionStateChanged, onState);
    room.on(RoomEvent.TrackSubscribed, refreshTracks);
    room.on(RoomEvent.TrackUnsubscribed, refreshTracks);
    room.on(RoomEvent.LocalTrackPublished, refreshTracks);
    room.on(RoomEvent.ParticipantConnected, () => {
      refreshTracks();
      setPhase('active');
    });
    room.on(RoomEvent.ParticipantDisconnected, refreshTracks);

    return () => {
      room.off(RoomEvent.ConnectionStateChanged, onState);
      room.off(RoomEvent.TrackSubscribed, refreshTracks);
      room.off(RoomEvent.TrackUnsubscribed, refreshTracks);
      room.off(RoomEvent.LocalTrackPublished, refreshTracks);
    };
  }, [room, refreshTracks, startTimer, stopTimer]);

  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      setPhase('connecting');
      setErrorMessage('');
      try {
        const tokenData = await getTokenRef
          .current({ appointmentId, media_mode: mediaMode })
          .unwrap();
        const url = tokenData.livekit_url || tokenData.url || tokenData.server_url;
        if (!url || !tokenData.token) {
          throw new Error('Missing LiveKit credentials');
        }

        await room.connect(url, tokenData.token);
        if (cancelled) return;

        try {
          await startConsultationRef.current({ appointmentId }).unwrap();
        } catch (e) {
          console.warn('Start consultation API failed:', e);
        }

        await room.localParticipant.setMicrophoneEnabled(true);
        if (mediaMode === 'video') {
          await room.localParticipant.setCameraEnabled(true);
        } else {
          await room.localParticipant.setCameraEnabled(false);
        }

        refreshTracks();
        if (room.remoteParticipants.size === 0) {
          setPhase('waiting');
        } else {
          setPhase('active');
          startTimer();
        }
      } catch (err) {
        console.error('Consultation connect failed:', err);
        setErrorMessage(formatError(err));
        setPhase('error');
        stopTimer();
      }
    };

    connect();

    return () => {
      cancelled = true;
      stopTimer();
      room.disconnect();
    };
  }, [appointmentId, mediaMode, connectAttempt, room, refreshTracks, startTimer, stopTimer]);

  const handleToggleMute = async () => {
    const next = !isMuted;
    await room.localParticipant.setMicrophoneEnabled(!next);
    setIsMuted(next);
  };

  const handleToggleCamera = async () => {
    const next = !isCameraOff;
    await room.localParticipant.setCameraEnabled(!next);
    setIsCameraOff(next);
    refreshTracks();
  };

  const handleEndCall = async () => {
    stopTimer();
    try {
      await endConsultation({ appointmentId }).unwrap();
    } catch (e) {
      console.warn('End consultation API failed:', e);
    }
    await room.disconnect();
    router.push('/appointments');
  };

  if (phase === 'connecting') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
        <Spinner size="lg" color="warning" className="mb-6" />
        <p className="text-lg font-medium">Connecting to secure room…</p>
        <p className="mt-2 text-sm text-white/50">Waiting for LiveKit session</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
          <AlertCircle className="h-8 w-8 text-red-400" aria-hidden />
        </div>
        <h1 className="mb-2 text-xl font-semibold">Unable to connect</h1>
        <p className="mb-8 max-w-sm text-sm text-white/70">{errorMessage}</p>
        <div className="flex w-full max-w-xs flex-col gap-3 sm:flex-row">
          <Button
            className="min-h-12 flex-1 rounded-full bg-[#db924b] font-semibold text-white"
            startContent={<RefreshCw className="h-4 w-4" />}
            onPress={() => setConnectAttempt((n) => n + 1)}
          >
            Try again
          </Button>
          <Button
            variant="bordered"
            className="min-h-12 flex-1 rounded-full border-white/30 text-white"
            onPress={() => router.push('/appointments')}
          >
            Back to appointments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-zinc-950 text-white">
      {phase === 'reconnecting' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-zinc-900 px-6 py-5">
            <Spinner color="warning" />
            <p className="text-sm">Reconnecting…</p>
            <Button
              size="sm"
              variant="bordered"
              className="border-white/40 text-white"
              onPress={() => setConnectAttempt((n) => n + 1)}
            >
              Retry now
            </Button>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm font-medium">
            {phase === 'waiting' ? `Waiting for ${patientName}` : patientName}
          </p>
          <p className="text-xs text-white/50 tabular-nums">{formatElapsed(elapsed)}</p>
        </div>
        <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
          {phase === 'waiting' ? 'Waiting' : 'In call'}
        </span>
      </header>

      <div className="relative flex-1 overflow-hidden">
        {remoteVideo ? (
          <VideoTile track={remoteVideo} className="h-full w-full" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-white/60">
            <Spinner color="warning" />
            <p className="text-sm">Waiting for patient video…</p>
          </div>
        )}

        {!isCameraOff && localVideo && (
          <div className="absolute bottom-24 right-4 h-36 w-28 overflow-hidden rounded-2xl border border-white/20 shadow-lg sm:h-40 sm:w-32">
            <VideoTile track={localVideo} muted mirror className="h-full w-full" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 px-4 py-6">
        <Button
          isIconOnly
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          className="h-14 w-14 rounded-full bg-white/10"
          onPress={handleToggleMute}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        {mediaMode === 'video' && (
          <Button
            isIconOnly
            aria-label={isCameraOff ? 'Camera on' : 'Camera off'}
            className="h-14 w-14 rounded-full bg-white/10"
            onPress={handleToggleCamera}
          >
            {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>
        )}
        <Button
          isIconOnly
          aria-label="End call"
          className="h-14 w-14 rounded-full bg-red-600"
          onPress={handleEndCall}
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
