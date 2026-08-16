import { renderBaseEmailTemplate } from './base.template';

export function renderOrganizationRejectionTemplate(orgName: string, orgNumber: string, reason?: string) {
  const subject = `Update Regarding Your AnveshakHub Application (${orgNumber})`;

  const html = renderBaseEmailTemplate({
    title: 'Organization Application Decision',
    badgeText: 'APPLICATION DECLINED',
    badgeBgColor: '#fce8e6',
    badgeTextColor: '#c5221f',
    contentHtml: `
      <h2>Application Status Update</h2>
      <p>Thank you for submitting your organization onboarding application (Reference: <strong>${orgNumber}</strong>) for <strong>${orgName}</strong>.</p>
      <p>After reviewing your application details, our administration team is unable to approve your application at this time.</p>
      ${reason ? `<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0; color: #991b1b;"><strong style="font-size: 12px; display: block; margin-bottom: 4px;">REASON / FEEDBACK:</strong>${reason}</div>` : ''}
      <p>If you believe this decision was made in error or if you have updated credentials to provide, please contact system support.</p>
    `,
  });

  const text = `Application Status Update for ${orgName} (${orgNumber})\n\nYour onboarding application was declined.${reason ? ` Reason: ${reason}` : ''}`;

  return { subject, html, text };
}
