import { renderBaseEmailTemplate, escapeHtml } from './base.template';

export function renderProjectNotificationTemplate(projectTitle: string, eventDetails: string, actionUrl?: string) {
  const safeTitle = escapeHtml(projectTitle);
  const safeDetails = escapeHtml(eventDetails);
  const subject = `📁 Project Alert: ${safeTitle}`;

  const html = renderBaseEmailTemplate({
    title: `Project Update — ${safeTitle}`,
    badgeText: 'PROJECT UPDATE',
    badgeBgColor: '#e0e7ff',
    badgeTextColor: '#3730a3',
    contentHtml: `
      <h2>Project Activity Update</h2>
      <p>An event occurred on project <strong>${safeTitle}</strong>:</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; color: #1e293b;">
        ${safeDetails}
      </div>
    `,
    actionUrl,
    actionText: actionUrl ? 'View Project Workspace' : undefined,
  });

  const text = `Project Update: ${projectTitle}\n\n${eventDetails}`;

  return { subject, html, text };
}
