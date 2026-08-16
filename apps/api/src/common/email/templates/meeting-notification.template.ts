import { renderBaseEmailTemplate, escapeHtml } from './base.template';

export function renderMeetingNotificationTemplate(meetingSubject: string, eventType: string, scheduledAt: string, meetingLink?: string) {
  const safeSubject = escapeHtml(meetingSubject);
  const safeEventType = escapeHtml(eventType);
  const safeTime = escapeHtml(scheduledAt);
  const subject = `📅 Meeting Alert: ${safeSubject} (${safeEventType})`;

  const html = renderBaseEmailTemplate({
    title: `Meeting Notification — ${safeSubject}`,
    badgeText: `MEETING ${safeEventType.toUpperCase()}`,
    badgeBgColor: eventType === 'cancelled' ? '#fce8e6' : '#e0e7ff',
    badgeTextColor: eventType === 'cancelled' ? '#c5221f' : '#3730a3',
    contentHtml: `
      <h2>Meeting ${safeEventType}</h2>
      <p>The meeting <strong>${safeSubject}</strong> has been ${safeEventType}.</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Scheduled Time:</strong> ${safeTime}</p>
        ${meetingLink ? `<p style="margin: 4px 0;"><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
      </div>
    `,
    actionUrl: meetingLink,
    actionText: meetingLink ? 'Join Meeting' : undefined,
  });

  const text = `Meeting ${eventType}: ${meetingSubject}\nTime: ${scheduledAt}${meetingLink ? `\nLink: ${meetingLink}` : ''}`;

  return { subject, html, text };
}
