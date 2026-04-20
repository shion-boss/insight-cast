export type NotificationPreferences = {
  interviewComplete: boolean
  articleReady: boolean
  monthlyReport: boolean
  productUpdates: boolean
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  interviewComplete: true,
  articleReady: true,
  monthlyReport: false,
  productUpdates: true,
}

export function normalizeNotificationPreferences(
  input: unknown,
): NotificationPreferences {
  if (!input || typeof input !== 'object') {
    return DEFAULT_NOTIFICATION_PREFERENCES
  }

  const source = input as Record<string, unknown>

  return {
    interviewComplete:
      typeof source.interviewComplete === 'boolean'
        ? source.interviewComplete
        : DEFAULT_NOTIFICATION_PREFERENCES.interviewComplete,
    articleReady:
      typeof source.articleReady === 'boolean'
        ? source.articleReady
        : DEFAULT_NOTIFICATION_PREFERENCES.articleReady,
    monthlyReport:
      typeof source.monthlyReport === 'boolean'
        ? source.monthlyReport
        : DEFAULT_NOTIFICATION_PREFERENCES.monthlyReport,
    productUpdates:
      typeof source.productUpdates === 'boolean'
        ? source.productUpdates
        : DEFAULT_NOTIFICATION_PREFERENCES.productUpdates,
  }
}
