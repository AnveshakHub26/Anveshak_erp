import { renderBaseEmailTemplate, escapeHtml } from './base.template';

export function renderOrganizationChangesTemplate(orgName: string, orgNumber: string, reason?: string) {
  const safeOrgName = escapeHtml(orgName);
  const safeOrgNumber = escapeHtml(orgNumber);
  const safeReason = reason ? escapeHtml(reason) : '';
  const subject = `Action Required: Changes Requested for Your AnveshakHub Application (${safeOrgNumber})`;

  const html = renderBaseEmailTemplate({
    title: 'Changes Requested',
    badgeText: 'ACTION REQUIRED',
    badgeBgColor: '#feefc3',
    badgeTextColor: '#b06000',
    contentHtml: `
      <h2>Changes Requested for Application ${safeOrgNumber}</h2>
      <p>Our review team evaluated your onboarding submission for <strong>${safeOrgName}</strong> and requires additional information or updates before proceeding with approval.</p>
      ${safeReason ? `<div style="background-color: #fffbebf7; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0; color: #92400e;"><strong style="font-size: 12px; display: block; margin-bottom: 4px;">REVIEW FEEDBACK:</strong>${safeReason}</div>` : ''}
      <p>Please review the feedback above and update your submission details.</p>
    `,
  });

  const text = `Changes Requested for ${orgName} (${orgNumber})\n\nFeedback: ${reason || 'Additional verification required.'}`;

  return { subject, html, text };
}
