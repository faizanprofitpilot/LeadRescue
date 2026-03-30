/** No em dashes in customer-facing copy (product convention). */

export const STALE_THREAD_INACTIVE_MS = 24 * 60 * 60 * 1000;

/** Recent messages passed to extraction + reply models (full thread stays in DB). */
export const AI_CHAT_MESSAGE_WINDOW = 12;

export const SMS_FALLBACK_NO_THREAD =
  "Sorry, we couldn't match this text to a recent missed call. Please call the business again and we'll follow up if they miss you.";

export const SMS_FALLBACK_COMPLETED =
  "Your request has already been sent to the business. Please call again if you need immediate help.";

export const SMS_FALLBACK_STALE =
  "It looks like your previous request is no longer active. Please call the business again if you still need help.";

export const SMS_FALLBACK_CLOSED = SMS_FALLBACK_COMPLETED;
