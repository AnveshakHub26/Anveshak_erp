import { renderBaseEmailTemplate, escapeHtml } from './base.template';

export function renderLeaveSubmittedHRTemplate(
  employeeName: string,
  employeeCode: string,
  referenceCode: string,
  leaveType: string,
  isPaid: boolean,
  startDate: string,
  endDate: string,
  totalDays: number,
  reason: string,
  hrUrl: string,
) {
  const subject = `Leave Request Submitted: ${escapeHtml(employeeName)} (${referenceCode})`;

  const contentHtml = `
    <h2 style="margin-top: 0; color: #151c2e; font-size: 18px;">New Leave Request Pending Review</h2>
    <p style="color: #475569; font-size: 14px; line-height: 1.5;">
      An employee has submitted a new leave request that requires HR review and approval.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Employee:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${escapeHtml(employeeName)} (${escapeHtml(employeeCode)})</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Reference:</td>
          <td style="padding: 6px 0; color: #d49b38; font-weight: bold;">${escapeHtml(referenceCode)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Leave Type:</td>
          <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(leaveType)} (${isPaid ? 'Paid' : 'Unpaid'})</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Duration:</td>
          <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(startDate)} to ${escapeHtml(endDate)} (${totalDays} day(s))</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Reason:</td>
          <td style="padding: 6px 0; color: #334155; font-style: italic;">${escapeHtml(reason)}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${escapeHtml(hrUrl)}" style="background-color: #151c2e; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block;">
        Review Leave Request
      </a>
    </div>
  `;

  const text = `New Leave Request Submitted\nEmployee: ${employeeName} (${employeeCode})\nReference: ${referenceCode}\nType: ${leaveType} (${isPaid ? 'Paid' : 'Unpaid'})\nDates: ${startDate} to ${endDate} (${totalDays} day(s))\nReason: ${reason}\n\nReview at: ${hrUrl}`;

  return {
    subject,
    html: renderBaseEmailTemplate({ title: 'Leave Request Notification', contentHtml }),
    text,
  };
}

export function renderLeaveApprovedTemplate(
  employeeName: string,
  referenceCode: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  totalDays: number,
  reviewerName: string,
  leaveUrl: string,
) {
  const subject = `Leave Request Approved: ${referenceCode}`;

  const contentHtml = `
    <h2 style="margin-top: 0; color: #065f46; font-size: 18px;">Your Leave Request Has Been Approved</h2>
    <p style="color: #475569; font-size: 14px; line-height: 1.5;">
      Dear ${escapeHtml(employeeName)}, your leave request has been reviewed and approved by HR.
    </p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #166534; font-weight: 600; width: 140px;">Reference Code:</td>
          <td style="padding: 6px 0; color: #15803d; font-weight: bold;">${escapeHtml(referenceCode)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #166534; font-weight: 600;">Leave Type:</td>
          <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(leaveType)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #166534; font-weight: 600;">Dates:</td>
          <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(startDate)} to ${escapeHtml(endDate)} (${totalDays} day(s))</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #166534; font-weight: 600;">Status:</td>
          <td style="padding: 6px 0; color: #15803d; font-weight: bold;">APPROVED</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #166534; font-weight: 600;">Reviewed By:</td>
          <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(reviewerName)}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${escapeHtml(leaveUrl)}" style="background-color: #151c2e; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block;">
        View My Leave Requests
      </a>
    </div>
  `;

  const text = `Leave Approved: ${referenceCode}\nDear ${employeeName}, your leave request (${leaveType}, ${startDate} to ${endDate}, ${totalDays} day(s)) has been APPROVED by ${reviewerName}.\nView details at: ${leaveUrl}`;

  return {
    subject,
    html: renderBaseEmailTemplate({ title: 'Leave Request Approved', contentHtml }),
    text,
  };
}

export function renderLeaveRejectedTemplate(
  employeeName: string,
  referenceCode: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  rejectionReason: string,
  leaveUrl: string,
) {
  const subject = `Leave Request Decision: ${referenceCode}`;

  const contentHtml = `
    <h2 style="margin-top: 0; color: #991b1b; font-size: 18px;">Your Leave Request Was Rejected</h2>
    <p style="color: #475569; font-size: 14px; line-height: 1.5;">
      Dear ${escapeHtml(employeeName)}, your leave request has been reviewed by HR and could not be approved.
    </p>

    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #991b1b; font-weight: 600; width: 140px;">Reference Code:</td>
          <td style="padding: 6px 0; color: #b91c1c; font-weight: bold;">${escapeHtml(referenceCode)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #991b1b; font-weight: 600;">Leave Type:</td>
          <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(leaveType)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #991b1b; font-weight: 600;">Requested Dates:</td>
          <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(startDate)} to ${escapeHtml(endDate)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #991b1b; font-weight: 600;">Rejection Reason:</td>
          <td style="padding: 6px 0; color: #b91c1c; font-weight: bold;">${escapeHtml(rejectionReason)}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${escapeHtml(leaveUrl)}" style="background-color: #151c2e; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block;">
        View My Leave Requests
      </a>
    </div>
  `;

  const text = `Leave Rejected: ${referenceCode}\nDear ${employeeName}, your leave request (${leaveType}, ${startDate} to ${endDate}) was REJECTED.\nReason: ${rejectionReason}\nView details at: ${leaveUrl}`;

  return {
    subject,
    html: renderBaseEmailTemplate({ title: 'Leave Request Decision', contentHtml }),
    text,
  };
}
