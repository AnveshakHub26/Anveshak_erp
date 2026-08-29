import { renderBaseEmailTemplate, escapeHtml } from './base.template';

export interface FieldChange {
  field: string;
  oldVal: string;
  newVal: string;
}

export function renderEmployeeProfileUpdatedTemplate(
  userName: string,
  employeeCode: string,
  loginUrl: string,
  changes: FieldChange[],
  newPassword?: string,
) {
  const safeName = escapeHtml(userName);
  const safeCode = escapeHtml(employeeCode);
  const safePassword = newPassword ? escapeHtml(newPassword) : '';

  const subject = newPassword
    ? `🔐 Your AnveshakHub Account Credentials & Profile Have Been Updated`
    : `📝 Employee Profile Update Notification — ${safeCode}`;

  const rowsHtml = changes
    .map(
      (c, i) => `
    <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155; font-size: 13px;">${escapeHtml(c.field)}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-family: monospace;">${escapeHtml(c.oldVal || '—')}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 700; font-size: 13px; font-family: monospace;">${escapeHtml(c.newVal)}</td>
    </tr>
  `,
    )
    .join('');

  const html = renderBaseEmailTemplate({
    title: newPassword ? 'Account Password & Profile Updated' : 'Employee Master Profile Updated',
    badgeText: newPassword ? 'CREDENTIALS UPDATED' : 'PROFILE UPDATED',
    badgeBgColor: newPassword ? '#fef3c7' : '#e0f2fe',
    badgeTextColor: newPassword ? '#92400e' : '#0369a1',
    contentHtml: `
      <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">Hello ${safeName},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Your official employee master record (<strong>${safeCode}</strong>) on <strong>AnveshakHub Enterprise ERP</strong> has been updated by administration.
      </p>

      ${
        safePassword
          ? `
      <div style="background-color: #fffbeb; border: 2px solid #fde68a; border-radius: 10px; padding: 18px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #92400e; font-size: 15px; font-weight: 700; border-bottom: 1px solid #fcd34d; padding-bottom: 8px;">
          🔑 Updated Account Login Password
        </h3>
        <p style="font-size: 13px; color: #78350f; margin: 8px 0 12px 0;">Your login password was updated by HR/Admin. Please use your new password below to sign in:</p>
        <div style="background-color: #ffffff; border: 1.5px solid #d97706; padding: 8px 16px; border-radius: 8px; font-family: 'Courier New', monospace; font-weight: 800; font-size: 16px; color: #0f172a; display: inline-block; letter-spacing: 0.5px;">
          ${safePassword}
        </div>
      </div>
      `
          : ''
      }

      <div style="margin: 24px 0; border: 1.5px solid #cbd5e1; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="background-color: #f1f5f9; padding: 12px 16px; border-bottom: 1.5px solid #cbd5e1; font-weight: 700; font-size: 14px; color: #0f172a; display: flex; items-center; justify-content: space-between;">
          <span>📋 Updated Master Profile Attributes</span>
          <span style="font-size: 11px; color: #64748b; font-weight: 600;">${changes.length} Field(s) Modified</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background-color: #e2e8f0; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 10px 14px; font-weight: 700; width: 30%;">Attribute Field</th>
              <th style="padding: 10px 14px; font-weight: 700; width: 35%;">Previous Record</th>
              <th style="padding: 10px 14px; font-weight: 700; width: 35%;">Updated Value</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
        💡 <strong>Security Notice:</strong> If you did not request these profile modifications, please contact your System Administrator or HR Operations team immediately.
      </div>

      <p style="font-size: 13px; color: #475569; margin-top: 20px;">Click below to access your workspace and verify your updated profile:</p>
    `,
    actionUrl: loginUrl,
    actionText: 'Sign In to Enterprise ERP',
  });

  const textRows = changes.map((c) => `- ${c.field}: ${c.oldVal || 'N/A'} -> ${c.newVal}`).join('\n');
  const text = `Hello ${userName},\n\nYour employee master record (${employeeCode}) has been updated.\n\nChanges Summary:\n${textRows}\n${newPassword ? `\nNew Password: ${newPassword}\n` : ''}\nSign in to access your portal: ${loginUrl}`;

  return { subject, html, text };
}
