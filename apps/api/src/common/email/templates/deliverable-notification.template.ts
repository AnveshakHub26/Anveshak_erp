import { renderBaseEmailTemplate, escapeHtml } from './base.template';

export function renderDeliverableNotificationTemplate(deliverableTitle: string, status: string, feedback?: string, actionUrl?: string) {
  const safeTitle = escapeHtml(deliverableTitle);
  const safeStatus = escapeHtml(status);
  const safeFeedback = feedback ? escapeHtml(feedback) : '';
  const subject = `📦 Deliverable Update: ${safeTitle} (${safeStatus})`;

  const badgeBg = status === 'APPROVED' ? '#e6f4ea' : status === 'REJECTED' || status === 'REVISION_REQUESTED' ? '#fce8e6' : '#e0e7ff';
  const badgeText = status === 'APPROVED' ? '#137333' : status === 'REJECTED' || status === 'REVISION_REQUESTED' ? '#c5221f' : '#3730a3';

  const html = renderBaseEmailTemplate({
    title: `Deliverable Status — ${safeStatus}`,
    badgeText: `DELIVERABLE ${safeStatus}`,
    badgeBgColor: badgeBg,
    badgeTextColor: badgeText,
    contentHtml: `
      <h2>Deliverable Workflow Update</h2>
      <p>Deliverable <strong>${safeTitle}</strong> is now marked as <strong>${safeStatus}</strong>.</p>
      ${safeFeedback ? `<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;"><strong style="font-size: 12px; color: #64748b;">REVIEWER COMMENTS:</strong><p style="margin: 4px 0 0 0;">${safeFeedback}</p></div>` : ''}
    `,
    actionUrl,
    actionText: actionUrl ? 'View Deliverable Details' : undefined,
  });

  const text = `Deliverable Update: ${deliverableTitle}\nStatus: ${status}${feedback ? `\nComments: ${feedback}` : ''}`;

  return { subject, html, text };
}
