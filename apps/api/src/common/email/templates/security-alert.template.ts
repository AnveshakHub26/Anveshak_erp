import { renderBaseEmailTemplate } from './base.template';

export function renderSecurityAlertTemplate(alertTitle: string, detailsHtml: string) {
  const subject = `⚠️ Security Alert: ${alertTitle}`;

  const html = renderBaseEmailTemplate({
    title: 'Security Alert',
    badgeText: 'SECURITY ALERT',
    badgeBgColor: '#fef2f2',
    badgeTextColor: '#991b1b',
    contentHtml: `
      <h2>Security Notice: ${alertTitle}</h2>
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0; color: #991b1b;">
        ${detailsHtml}
      </div>
      <p style="font-size: 12px; color: #64748b;">If you did not perform this action, please secure your account immediately.</p>
    `,
  });

  const text = `Security Alert: ${alertTitle}\n\n${detailsHtml.replace(/<[^>]*>?/gm, '')}`;

  return { subject, html, text };
}
