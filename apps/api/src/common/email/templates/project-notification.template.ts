import { renderBaseEmailTemplate } from './base.template';

export function renderProjectNotificationTemplate(projectTitle: string, eventDetails: string, actionUrl?: string) {
  const subject = `📁 Project Alert: ${projectTitle}`;

  const html = renderBaseEmailTemplate({
    title: `Project Update — ${projectTitle}`,
    badgeText: 'PROJECT UPDATE',
    badgeBgColor: '#e0e7ff',
    badgeTextColor: '#3730a3',
    contentHtml: `
      <h2>Project Activity Update</h2>
      <p>An event occurred on project <strong>${projectTitle}</strong>:</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; color: #1e293b;">
        ${eventDetails}
      </div>
    `,
    actionUrl,
    actionText: actionUrl ? 'View Project Workspace' : undefined,
  });

  const text = `Project Update: ${projectTitle}\n\n${eventDetails}`;

  return { subject, html, text };
}
