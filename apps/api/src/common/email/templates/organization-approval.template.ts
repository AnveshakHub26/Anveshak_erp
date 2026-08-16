import { renderBaseEmailTemplate, escapeHtml } from './base.template';

export function renderOrganizationApprovalTemplate(toEmail: string, orgName: string, orgNumber: string, loginUrl: string) {
  const safeOrgName = escapeHtml(orgName);
  const safeOrgNumber = escapeHtml(orgNumber);
  const safeEmail = escapeHtml(toEmail);
  const subject = `🎉 Your AnveshakHub Enterprise Account Has Been Approved! (${safeOrgNumber})`;

  const html = renderBaseEmailTemplate({
    title: 'Organization Application Approved',
    badgeText: 'APPLICATION APPROVED',
    badgeBgColor: '#e6f4ea',
    badgeTextColor: '#137333',
    contentHtml: `
      <h2>Welcome to AnveshakHub Enterprise ERP, ${safeOrgName}!</h2>
      <p>We are delighted to inform you that your organization onboarding application (Reference: <strong>${safeOrgNumber}</strong>) has been verified and <strong>APPROVED</strong> by the AnveshakHub Administration team.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin:0 0 8px 0; font-size: 12px; color: #64748b; font-weight: bold;">ACCOUNT DETAILS</p>
        <p style="margin: 4px 0;"><strong>Primary Contact Email:</strong> ${safeEmail}</p>
        <p style="margin: 4px 0;"><strong>Account Status:</strong> <span style="color: #10B981; font-weight: bold;">ACTIVE</span></p>
        <p style="margin: 4px 0;"><strong>Password:</strong> Use the secure password specified during registration.</p>
      </div>

      <p>You can now sign in to access your organization dashboard, manage enterprise profiles, and collaborate across modules.</p>
    `,
    actionUrl: loginUrl,
    actionText: 'Sign In to AnveshakHub ERP',
  });

  const text = `Welcome to AnveshakHub Enterprise ERP, ${orgName}!\n\nYour application (${orgNumber}) has been APPROVED. Account status: ACTIVE.\nSign in at ${loginUrl} using email: ${toEmail}`;

  return { subject, html, text };
}
