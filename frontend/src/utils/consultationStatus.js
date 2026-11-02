/**
 * Standardized status mappings and visual badge styles for DentaAI Consultations.
 * Maps DB statuses (Pending, Accepted, In Consultation, Completed, Rejected) to
 * user-friendly medical workflow statuses (Booked, Confirmed, In Progress, Completed, Cancelled).
 */
export const getConsultationStatusMeta = (status) => {
  switch (status) {
    case 'Pending':
    case 'Booked':
      return {
        label: status === 'Booked' ? 'Booked' : 'Pending',
        displayStatus: 'Pending',
        description: 'Awaiting doctor acceptance',
        badgeClass: 'badge-warning',
        bg: 'rgba(245, 158, 11, 0.12)',
        color: '#b45309',
        border: 'rgba(245, 158, 11, 0.35)'
      };
    case 'Accepted':
    case 'Confirmed':
      return {
        label: status === 'Confirmed' ? 'Confirmed' : 'Accepted',
        displayStatus: status || 'Accepted',
        description: 'Confirmed by doctor',
        badgeClass: 'badge-primary',
        bg: 'rgba(22, 119, 255, 0.12)',
        color: '#1677FF',
        border: 'rgba(22, 119, 255, 0.35)'
      };
    case 'In Consultation':
    case 'In Progress':
      return {
        label: 'In Progress',
        displayStatus: 'In Progress',
        description: 'Consultation underway',
        badgeClass: 'badge-info',
        bg: 'rgba(0, 166, 166, 0.12)',
        color: '#0f766e',
        border: 'rgba(0, 166, 166, 0.35)'
      };
    case 'Completed':
    case 'Verified':
      return {
        label: 'Completed',
        displayStatus: 'Completed',
        description: 'Clinical assessment complete',
        badgeClass: 'badge-success',
        bg: 'rgba(22, 163, 74, 0.12)',
        color: '#15803d',
        border: 'rgba(22, 163, 74, 0.35)'
      };
    case 'Rejected':
    case 'Cancelled':
      return {
        label: status === 'Cancelled' ? 'Cancelled' : 'Rejected',
        displayStatus: status || 'Rejected',
        description: 'Consultation cancelled',
        badgeClass: 'badge-danger',
        bg: 'rgba(220, 38, 38, 0.12)',
        color: '#b91c1c',
        border: 'rgba(220, 38, 38, 0.35)'
      };
    default:
      return {
        label: status || 'Pending',
        displayStatus: status || 'Pending',
        description: '',
        badgeClass: 'badge-secondary',
        bg: 'rgba(100, 116, 139, 0.12)',
        color: '#475569',
        border: 'rgba(100, 116, 139, 0.35)'
      };
  }
};

export const isMessagingActive = (status) => {
  return ['Accepted', 'Confirmed', 'In Consultation', 'In Progress'].includes(status);
};

export const isMessagingPending = (status) => {
  return !status || ['Pending', 'Booked'].includes(status);
};

export const isMessagingCompleted = (status) => {
  return ['Completed', 'Verified'].includes(status);
};

export const isMessagingCancelled = (status) => {
  return ['Rejected', 'Cancelled'].includes(status);
};

export const getMessagingNotice = (status) => {
  if (isMessagingPending(status)) {
    return 'Your doctor has not accepted this consultation yet. Messaging will unlock after acceptance.';
  }
  if (isMessagingCompleted(status)) {
    return 'This consultation has been completed. New messages cannot be sent.';
  }
  if (isMessagingCancelled(status)) {
    return 'This consultation has been cancelled. New messages cannot be sent.';
  }
  return '';
};
