/**
 * Secure same-origin consultation join window (admin / doctor).
 * Desktop: named popup so appointments list stays open.
 * Mobile / blocked: caller falls back to same-tab navigation.
 */

export const CONSULTATION_CHANNEL = 'aetlier-consultation';

const POPUP_FEATURES =
  'popup=yes,width=1080,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';

export const shouldUseConsultationPopup = () => {
  if (typeof window === 'undefined') return false;
  if (typeof window.open !== 'function') return false;
  const ua = window.navigator?.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  if (isIOS) return false;
  const coarse =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.innerWidth < 768;
  if (coarse && narrow) return false;
  return true;
};

export const consultationWindowName = (appointmentId) =>
  `aetlier-consult-${appointmentId}`;

/**
 * @param {string} appointmentId
 * @returns {{ mode: 'popup' | 'same-tab', window: Window | null }}
 */
export const openConsultationWindow = (appointmentId) => {
  const path = `/consultation/${appointmentId}`;
  if (!shouldUseConsultationPopup()) {
    return { mode: 'same-tab', window: null };
  }
  const name = consultationWindowName(appointmentId);
  const popup = window.open(path, name, POPUP_FEATURES);
  if (!popup) {
    return { mode: 'same-tab', window: null };
  }
  try {
    popup.focus();
  } catch {
    // ignore
  }
  return { mode: 'popup', window: popup };
};

export const notifyConsultationEnded = (appointmentId) => {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return;
  }
  try {
    const channel = new BroadcastChannel(CONSULTATION_CHANNEL);
    channel.postMessage({
      type: 'consultation-ended',
      appointmentId: String(appointmentId),
    });
    channel.close();
  } catch {
    // ignore
  }
};

export const subscribeConsultationEvents = (handler) => {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return () => {};
  }
  const channel = new BroadcastChannel(CONSULTATION_CHANNEL);
  const onMessage = (event) => {
    handler(event.data);
  };
  channel.addEventListener('message', onMessage);
  return () => {
    channel.removeEventListener('message', onMessage);
    channel.close();
  };
};
