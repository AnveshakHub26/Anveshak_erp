import { renderBaseEmailTemplate } from './base.template';

export function renderPasswordResetTemplate(resetUrl: string) {
  const subject = `🔐 Password Reset Request — AnveshakHub ERP`;

  const html = renderBaseEmailTemplate({
    title: 'Password Reset Request',
    badgeText: 'SECURITY ALERT',
    badgeBgColor: '#fef3c7',
    badgeTextColor: '#92400e',
    contentHtml: `
      <h2>Password Reset Request</h2>
      <p>We received a request to reset the password for your AnveshakHub Enterprise ERP account.</p>
      <p>Click the button below to specify a new password. This link is valid for 1 hour and can only be used once.</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; word-break: break-all; font-size: 12px; color: #64748b;">
        Direct link: <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
      </div>
      <p style="font-size: 12px; color: #64748b;">If you did not request a password reset, please ignore this email or contact your administrator immediately.</p>
    `,
    actionUrl: resetUrl,
    actionText: 'Reset Password Now',
  });

  const text = `Password Reset Request — AnveshakHub ERP\n\nClick here to reset your password (link valid for 1 hour): ${resetUrl}\n\nIf you did not request this, please ignore this message.`;

  return { subject, html, text };
}
