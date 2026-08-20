import { renderBaseEmailTemplate, escapeHtml } from './base.template';

export function renderEmployeeRehireTemplate(
  employeeName: string,
  employeeCode: string,
  designation: string,
  department: string,
  loginUrl: string,
) {
  const subject = `Account Reactivated: Welcome Back, ${escapeHtml(employeeName)}`;

  const contentHtml = `
    <h2 style="margin-top: 0; color: #151c2e; font-size: 18px;">Welcome Back to AnveshakHub</h2>
    <p style="color: #475569; font-size: 14px; line-height: 1.5;">
      Dear ${escapeHtml(employeeName)}, your employee account has been reactivated.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Employee Code:</td>
          <td style="padding: 6px 0; color: #d49b38; font-weight: bold;">${escapeHtml(employeeCode)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Designation:</td>
          <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(designation)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Department:</td>
          <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(department)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Status:</td>
          <td style="padding: 6px 0; color: #15803d; font-weight: bold;">ACTIVE</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${escapeHtml(loginUrl)}" style="background-color: #151c2e; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block;">
        Log In to Employee Workspace
      </a>
    </div>
  `;

  const text = `Welcome Back ${employeeName}\nYour employee account (${employeeCode}) as ${designation} in ${department} has been reactivated.\nLog in at: ${loginUrl}`;

  return {
    subject,
    html: renderBaseEmailTemplate({ title: 'Account Reactivated', contentHtml }),
    text,
  };
}

export function renderEmployeeExitTemplate(
  employeeName: string,
  employeeCode: string,
  exitDate: string,
) {
  const subject = `Employee Exit Notice: ${escapeHtml(employeeName)} (${employeeCode})`;

  const contentHtml = `
    <h2 style="margin-top: 0; color: #151c2e; font-size: 18px;">Employee Exit Confirmation</h2>
    <p style="color: #475569; font-size: 14px; line-height: 1.5;">
      Dear ${escapeHtml(employeeName)}, your employee offboarding and exit processing has been registered.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Employee Code:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${escapeHtml(employeeCode)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Exit Effective Date:</td>
          <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(exitDate)}</td>
        </tr>
      </table>
    </div>
  `;

  const text = `Employee Exit Notice\nDear ${employeeName}, your offboarding effective ${exitDate} has been processed.`;

  return {
    subject,
    html: renderBaseEmailTemplate({ title: 'Employee Exit Notice', contentHtml }),
    text,
  };
}
