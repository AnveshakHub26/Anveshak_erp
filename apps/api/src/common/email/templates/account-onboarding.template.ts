import { renderBaseEmailTemplate, escapeHtml } from './base.template';

export function renderAccountOnboardingTemplate(
  userName: string,
  loginUrl: string,
  workEmail: string,
  password?: string,
  employeeCode?: string,
  roleName?: string,
) {
  const safeName = escapeHtml(userName);
  const safeEmail = escapeHtml(workEmail);
  const safeRole = roleName ? escapeHtml(roleName) : '';
  const safeCode = employeeCode ? escapeHtml(employeeCode) : '';
  const safePassword = password ? escapeHtml(password) : '';

  const subject = `🎉 Your AnveshakHub Account Credentials — ${safeName}`;

  const html = renderBaseEmailTemplate({
    title: 'Employee Account Provisioned',
    badgeText: 'ACCOUNT CREATED',
    badgeBgColor: '#d1fae5',
    badgeTextColor: '#065f46',
    contentHtml: `
      <h2>Welcome aboard, ${safeName}!</h2>
      <p>Your official employee account on <strong>AnveshakHub Enterprise ERP</strong> has been successfully created${safeRole ? ` (${safeRole})` : ''}.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #0f172a; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">🔑 Your Login Credentials</h3>
        ${safeCode ? `<p style="margin: 8px 0; font-size: 13px;"><strong>Employee ID:</strong> <span style="font-family: monospace; color: #d49b38; font-weight: bold;">${safeCode}</span></p>` : ''}
        <p style="margin: 8px 0; font-size: 13px;"><strong>Work Email:</strong> <span style="font-family: monospace; color: #0f172a;">${safeEmail}</span></p>
        ${safePassword ? `<p style="margin: 8px 0; font-size: 13px;"><strong>Password:</strong> <span style="font-family: monospace; color: #0f172a; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${safePassword}</span></p>` : ''}
      </div>

      <p>Use the button below to sign in directly with these credentials. Please change your password after logging in for security.</p>
    `,
    actionUrl: loginUrl,
    actionText: 'Sign In to Enterprise ERP',
  });

  const text = `Welcome to AnveshakHub Enterprise ERP, ${userName}!\n\nYour account has been created.\nWork Email: ${workEmail}\n${employeeCode ? `Employee ID: ${employeeCode}\n` : ''}${password ? `Password: ${password}\n` : ''}\nSign in at: ${loginUrl}`;

  return { subject, html, text };
}
