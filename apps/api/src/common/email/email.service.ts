import { Injectable, Logger } from '@nestjs/common';
import { EmailQueueService } from './services/email-queue.service';
import { TransactionalEmailCategory } from './enums/email-category.enum';
import { EmailOptions } from './interfaces/email-provider.interface';

import { renderPasswordResetTemplate } from './templates/password-reset.template';
import { renderAccountOnboardingTemplate } from './templates/account-onboarding.template';
import { renderOrganizationApprovalTemplate } from './templates/organization-approval.template';
import { renderOrganizationRejectionTemplate } from './templates/organization-rejection.template';
import { renderOrganizationChangesTemplate } from './templates/organization-changes.template';
import { renderProjectNotificationTemplate } from './templates/project-notification.template';
import { renderDeliverableNotificationTemplate } from './templates/deliverable-notification.template';
import { renderMeetingNotificationTemplate } from './templates/meeting-notification.template';
import { renderSecurityAlertTemplate } from './templates/security-alert.template';
import { renderBaseEmailTemplate, escapeHtml } from './templates/base.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly queueService: EmailQueueService) {}

  /**
   * Generic entry point for enqueuing transactional emails.
   */
  async sendTransactionalEmail(options: EmailOptions) {
    return this.queueService.enqueueEmail(options);
  }

  /**
   * Category Helper 1: Organization Onboarding Approval Email
   */
  async sendOrganizationApprovalEmail(toEmail: string, orgName: string, orgNumber: string, customIdempotencyKey?: string) {
    const loginUrl = process.env.APP_URL ? `${process.env.APP_URL}/login` : 'http://localhost:3000/login';
    const idempotencyKey = customIdempotencyKey || `org-approval-${orgNumber}`;
    const tpl = renderOrganizationApprovalTemplate(toEmail, orgName, orgNumber, loginUrl);

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.ORGANIZATION_APPROVAL,
      idempotencyKey,
      metadata: { orgNumber, orgName },
    });
  }

  /**
   * Category Helper: Organization Rejection Email
   */
  async sendOrganizationRejectionEmail(toEmail: string, orgName: string, orgNumber: string, reason?: string) {
    const idempotencyKey = `org-reject-${orgNumber}-${Date.now()}`;
    const tpl = renderOrganizationRejectionTemplate(orgName, orgNumber, reason);

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.APPROVAL_DECISION,
      idempotencyKey,
      metadata: { orgNumber, orgName, decision: 'REJECT', reason },
    });
  }

  /**
   * Category Helper: Organization Changes Requested Email
   */
  async sendOrganizationChangesRequestedEmail(toEmail: string, orgName: string, orgNumber: string, reason?: string) {
    const idempotencyKey = `org-changes-${orgNumber}-${Date.now()}`;
    const tpl = renderOrganizationChangesTemplate(orgName, orgNumber, reason);

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.APPROVAL_DECISION,
      idempotencyKey,
      metadata: { orgNumber, orgName, decision: 'REQUEST_CHANGES', reason },
    });
  }

  /**
   * Category Helper: Organization Deletion Email
   */
  async sendOrganizationDeletedEmail(toEmail: string, orgName: string, orgNumber: string, reason?: string) {
    const idempotencyKey = `org-deleted-${orgNumber}-${Date.now()}`;
    const subject = `🗑️ Organization Registration Cancelled — ${orgNumber}`;
    const safeOrgName = escapeHtml(orgName);
    const safeOrgNumber = escapeHtml(orgNumber);
    const safeReason = reason ? escapeHtml(reason) : '';

    const html = renderBaseEmailTemplate({
      title: 'Registration Application Cancelled',
      badgeText: 'APPLICATION DELETED',
      badgeBgColor: '#fce8e6',
      badgeTextColor: '#c5221f',
      contentHtml: `
        <h2>Organization Registration Deleted</h2>
        <p>Your organization onboarding request (Reference Number: <strong>${safeOrgNumber}</strong>) for <strong>${safeOrgName}</strong> has been cancelled/deleted by the platform administration team.</p>
        ${safeReason ? `<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0; color: #991b1b;"><strong style="font-size: 12px; display: block; margin-bottom: 4px;">RATIONALE:</strong>${safeReason}</div>` : ''}
        <p>If you believe this record was removed in error, please contact system support.</p>
      `,
    });

    return this.sendTransactionalEmail({
      to: toEmail,
      subject,
      html,
      text: `Registration Application Cancelled for ${orgName} (${orgNumber}). ${reason ? `Reason: ${reason}` : ''}`,
      category: TransactionalEmailCategory.APPROVAL_DECISION,
      idempotencyKey,
      metadata: { orgNumber, orgName, decision: 'DELETE', reason },
    });
  }

  /**
   * Category Helper 2: Password Reset Email
   */
  async sendPasswordResetEmail(toEmail: string, resetToken: string) {
    const resetUrl = process.env.APP_URL
      ? `${process.env.APP_URL}/reset-password?token=${resetToken}`
      : `http://localhost:3000/reset-password?token=${resetToken}`;
    const idempotencyKey = `pwd-reset-${toEmail.toLowerCase().trim()}-${resetToken.substring(0, 12)}`;
    const tpl = renderPasswordResetTemplate(resetUrl);

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.PASSWORD_RESET,
      idempotencyKey,
      metadata: { recipientEmail: toEmail },
    });
  }

  /**
   * Category Helper 3: Account Onboarding Email with Credentials
   */
  async sendAccountOnboardingEmail(
    toEmail: string,
    userName: string,
    password?: string,
    employeeCode?: string,
    roleName?: string,
  ) {
    const loginUrl = process.env.APP_URL ? `${process.env.APP_URL}/login` : 'http://localhost:3000/login';
    const idempotencyKey = `onboard-${toEmail.toLowerCase().trim()}-${Date.now()}`;
    const tpl = renderAccountOnboardingTemplate(userName, loginUrl, toEmail, password, employeeCode, roleName);

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.ACCOUNT_ONBOARDING,
      idempotencyKey,
      metadata: { userName, roleName, employeeCode },
    });
  }

  /**
   * Category Helper 4: Project Notification Email
   */
  async sendProjectNotificationEmail(toEmail: string, projectTitle: string, eventDetails: string, actionUrl?: string) {
    const idempotencyKey = `project-notif-${projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`;
    const tpl = renderProjectNotificationTemplate(projectTitle, eventDetails, actionUrl);

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.PROJECT_NOTIFICATION,
      idempotencyKey,
      metadata: { projectTitle, eventDetails },
    });
  }

  /**
   * Category Helper 5: Deliverable Notification Email
   */
  async sendDeliverableNotificationEmail(
    toEmail: string,
    deliverableTitle: string,
    status: string,
    feedback?: string,
    actionUrl?: string,
  ) {
    const idempotencyKey = `deliv-notif-${deliverableTitle.replace(/[^a-zA-Z0-9]/g, '_')}-${status}-${Date.now()}`;
    const tpl = renderDeliverableNotificationTemplate(deliverableTitle, status, feedback, actionUrl);

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.DELIVERABLE_NOTIFICATION,
      idempotencyKey,
      metadata: { deliverableTitle, status, feedback },
    });
  }

  /**
   * Category Helper 6: Meeting Notification Email
   */
  async sendMeetingNotificationEmail(
    toEmail: string,
    meetingSubject: string,
    eventType: string,
    scheduledAt: string,
    meetingLink?: string,
  ) {
    const idempotencyKey = `meeting-notif-${meetingSubject.replace(/[^a-zA-Z0-9]/g, '_')}-${eventType}-${Date.now()}`;
    const tpl = renderMeetingNotificationTemplate(meetingSubject, eventType, scheduledAt, meetingLink);

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.MEETING_NOTIFICATION,
      idempotencyKey,
      metadata: { meetingSubject, eventType, scheduledAt },
    });
  }

  /**
   * Category Helper 7: Approval Decision Email (Generic)
   */
  async sendApprovalDecisionEmail(
    toEmail: string,
    requestType: string,
    decision: 'APPROVED' | 'REJECTED' | 'REQUEST_CHANGES',
    reason?: string,
  ) {
    const idempotencyKey = `approval-dec-${requestType.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`;
    const subject = `📋 Decision Update: ${requestType} (${decision})`;
    const html = renderBaseEmailTemplate({
      title: `Approval Decision — ${decision}`,
      badgeText: `DECISION ${decision}`,
      badgeBgColor: decision === 'APPROVED' ? '#e6f4ea' : decision === 'REJECTED' ? '#fce8e6' : '#feefc3',
      badgeTextColor: decision === 'APPROVED' ? '#137333' : decision === 'REJECTED' ? '#c5221f' : '#b06000',
      contentHtml: `
        <h2>Decision Rendered for ${escapeHtml(requestType)}</h2>
        <p>Status: <strong>${decision}</strong></p>
        ${reason ? `<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;"><strong>COMMENTS:</strong> ${escapeHtml(reason)}</div>` : ''}
      `,
    });

    return this.sendTransactionalEmail({
      to: toEmail,
      subject,
      html,
      text: `Decision for ${requestType}: ${decision}${reason ? ` Reason: ${reason}` : ''}`,
      category: TransactionalEmailCategory.APPROVAL_DECISION,
      idempotencyKey,
      metadata: { requestType, decision, reason },
    });
  }

  /**
   * Category Helper 8: Finance Notification Email
   */
  async sendFinanceNotificationEmail(toEmail: string, subject: string, detailsHtml: string) {
    return this.sendTransactionalEmail({
      to: toEmail,
      subject: `💰 Finance Alert: ${subject}`,
      html: detailsHtml,
      category: TransactionalEmailCategory.FINANCE_NOTIFICATION,
    });
  }

  /**
   * Category Helper 9: Purchase Notification Email
   */
  async sendPurchaseNotificationEmail(toEmail: string, subject: string, detailsHtml: string) {
    return this.sendTransactionalEmail({
      to: toEmail,
      subject: `🛒 Purchase Order Alert: ${subject}`,
      html: detailsHtml,
      category: TransactionalEmailCategory.PURCHASE_NOTIFICATION,
    });
  }

  /**
   * Category Helper 10: Sales Notification Email
   */
  async sendSalesNotificationEmail(toEmail: string, subject: string, detailsHtml: string) {
    return this.sendTransactionalEmail({
      to: toEmail,
      subject: `📊 Sales Alert: ${subject}`,
      html: detailsHtml,
      category: TransactionalEmailCategory.SALES_NOTIFICATION,
    });
  }

  /**
   * Category Helper 11: System & Security Alert Email
   */
  async sendSecurityAlertEmail(toEmail: string, alertTitle: string, detailsHtml: string) {
    const tpl = renderSecurityAlertTemplate(alertTitle, detailsHtml);

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.SYSTEM_SECURITY_ALERT,
      idempotencyKey: `security-alert-${Date.now()}`,
      metadata: { alertTitle },
    });
  }

  /**
   * Leave Category Helper: HR Leave Submission Email
   */
  async sendLeaveSubmittedHREmail(
    toEmail: string,
    employeeName: string,
    employeeCode: string,
    referenceCode: string,
    leaveType: string,
    isPaid: boolean,
    startDate: string,
    endDate: string,
    totalDays: number,
    reason: string,
  ) {
    const hrUrl = process.env.APP_URL ? `${process.env.APP_URL}/hr/leave` : 'http://localhost:3000/hr/leave';
    const { renderLeaveSubmittedHRTemplate } = await import('./templates/leave-notification.template');
    const tpl = renderLeaveSubmittedHRTemplate(
      employeeName,
      employeeCode,
      referenceCode,
      leaveType,
      isPaid,
      startDate,
      endDate,
      totalDays,
      reason,
      hrUrl,
    );

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.LEAVE_NOTIFICATION,
      idempotencyKey: `leave-sub-${referenceCode}-${Date.now()}`,
    });
  }

  /**
   * Leave Category Helper: Employee Leave Approval Email
   */
  async sendLeaveApprovedEmail(
    toEmail: string,
    employeeName: string,
    referenceCode: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    totalDays: number,
    reviewerName: string,
  ) {
    const leaveUrl = process.env.APP_URL ? `${process.env.APP_URL}/employee/leave` : 'http://localhost:3000/employee/leave';
    const { renderLeaveApprovedTemplate } = await import('./templates/leave-notification.template');
    const tpl = renderLeaveApprovedTemplate(
      employeeName,
      referenceCode,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reviewerName,
      leaveUrl,
    );

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.LEAVE_NOTIFICATION,
      idempotencyKey: `leave-appr-${referenceCode}-${Date.now()}`,
    });
  }

  /**
   * Leave Category Helper: Employee Leave Rejection Email
   */
  async sendLeaveRejectedEmail(
    toEmail: string,
    employeeName: string,
    referenceCode: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    rejectionReason: string,
  ) {
    const leaveUrl = process.env.APP_URL ? `${process.env.APP_URL}/employee/leave` : 'http://localhost:3000/employee/leave';
    const { renderLeaveRejectedTemplate } = await import('./templates/leave-notification.template');
    const tpl = renderLeaveRejectedTemplate(
      employeeName,
      referenceCode,
      leaveType,
      startDate,
      endDate,
      rejectionReason,
      leaveUrl,
    );

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.LEAVE_NOTIFICATION,
      idempotencyKey: `leave-rej-${referenceCode}-${Date.now()}`,
    });
  }

  /**
   * Employee Lifecycle Category Helper: Employee Rehire Email
   */
  async sendEmployeeRehireEmail(
    toEmail: string,
    employeeName: string,
    employeeCode: string,
    designation: string,
    department: string,
  ) {
    const loginUrl = process.env.APP_URL ? `${process.env.APP_URL}/login` : 'http://localhost:3000/login';
    const { renderEmployeeRehireTemplate } = await import('./templates/employee-lifecycle.template');
    const tpl = renderEmployeeRehireTemplate(
      employeeName,
      employeeCode,
      designation,
      department,
      loginUrl,
    );

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.EMPLOYEE_LIFECYCLE,
      idempotencyKey: `emp-rehire-${employeeCode}-${Date.now()}`,
    });
  }

  /**
   * Employee Lifecycle Category Helper: Employee Exit Email
   */
  async sendEmployeeExitEmail(
    toEmail: string,
    employeeName: string,
    employeeCode: string,
    exitDate: string,
  ) {
    const { renderEmployeeExitTemplate } = await import('./templates/employee-lifecycle.template');
    const tpl = renderEmployeeExitTemplate(employeeName, employeeCode, exitDate);

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.EMPLOYEE_LIFECYCLE,
      idempotencyKey: `emp-exit-${employeeCode}-${Date.now()}`,
    });
  }
}
