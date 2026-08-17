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

  const subject = `🎉 Welcome to AnveshakHub Enterprise — Your Account Credentials`;

  const html = renderBaseEmailTemplate({
    title: 'Account Credentials & Access Details',
    badgeText: 'EMPLOYEE ACCOUNT CREATED',
    badgeBgColor: '#dcfce7',
    badgeTextColor: '#15803d',
    contentHtml: `
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0;">Welcome aboard, ${safeName}!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">Your official employee account on <strong>AnveshakHub Enterprise ERP</strong> has been successfully provisioned${safeRole ? ` with role <strong>${safeRole}</strong>` : ''}.</p>
      
      <div style="background-color: #f1f5f9; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 24px; margin: 24px 0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
        <h3 style="margin-top: 0; color: #0f172a; font-size: 15px; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
          🔑 Your Login Credentials
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 12px;">
          ${safeCode ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 140px;">Employee ID:</td>
            <td style="padding: 8px 0; font-family: monospace; color: #d49b38; font-weight: 700; font-size: 15px;">${safeCode}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Work Email:</td>
            <td style="padding: 8px 0; font-family: monospace; color: #0f172a; font-weight: 600;">${safeEmail}</td>
          </tr>
          ${safePassword ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Password:</td>
            <td style="padding: 8px 0;">
              <span style="font-family: monospace; color: #0f172a; background: #ffffff; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; display: inline-block;">${safePassword}</span>
            </td>
          </tr>` : ''}
        </table>
      </div>

      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
        💡 <strong>Security & Recovery Tip:</strong> You can sign in immediately using your Work Email and Password above. If you want to change your password or update your security credentials at any time, click on <strong>"Forgot Password?"</strong> on the login page.
      </div>

      <p style="font-size: 13px; color: #475569; margin-top: 20px;">Click below to access your workspace and get started:</p>
    `,
    actionUrl: loginUrl,
    actionText: 'Sign In to Enterprise ERP',
  });

  const text = `Welcome to AnveshakHub Enterprise ERP, ${userName}!\n\nYour account credentials:\nWork Email: ${workEmail}\n${employeeCode ? `Employee ID: ${employeeCode}\n` : ''}${password ? `Initial Password: ${password}\n` : ''}\nSign in at: ${loginUrl}\n\nYou can reset or change your password anytime using the "Forgot Password" option on the login page.`;

  return { subject, html, text };
}
