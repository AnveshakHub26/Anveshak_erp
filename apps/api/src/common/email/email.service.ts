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
  async sendOrganizationApprovalEmail(toEmail: string, orgName: string, orgNumber: string) {
    const loginUrl = process.env.APP_URL ? `${process.env.APP_URL}/login` : 'http://localhost:3000/login';
    const idempotencyKey = `org-approval-${orgNumber}`;
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
   * Category Helper 3: Account Onboarding Email
   */
  async sendAccountOnboardingEmail(toEmail: string, userName: string, roleName?: string) {
    const loginUrl = process.env.APP_URL ? `${process.env.APP_URL}/login` : 'http://localhost:3000/login';
    const idempotencyKey = `onboard-${toEmail.toLowerCase().trim()}`;
    const tpl = renderAccountOnboardingTemplate(userName, loginUrl, roleName);

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.ACCOUNT_ONBOARDING,
      idempotencyKey,
      metadata: { userName, roleName },
    });
  }

  /**
   * Category Helper 4: Project Notification Email
   */
  async sendProjectNotificationEmail(toEmail: string, projectTitle: string, eventDetails: string, actionUrl?: string) {
    const tpl = renderProjectNotificationTemplate(projectTitle, eventDetails, actionUrl);

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.PROJECT_NOTIFICATION,
      metadata: { projectTitle },
    });
  }

  /**
   * Category Helper 5: Meeting Notification Email
   */
  async sendMeetingNotificationEmail(toEmail: string, meetingSubject: string, eventType: string, scheduledAt: string, meetingLink?: string) {
    const tpl = renderMeetingNotificationTemplate(meetingSubject, eventType, scheduledAt, meetingLink);

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.MEETING_NOTIFICATION,
      metadata: { meetingSubject, eventType, scheduledAt },
    });
  }

  /**
   * Category Helper 6: Deliverable Notification Email
   */
  async sendDeliverableNotificationEmail(toEmail: string, deliverableTitle: string, status: string, feedback?: string, actionUrl?: string) {
    const tpl = renderDeliverableNotificationTemplate(deliverableTitle, status, feedback, actionUrl);

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      category: TransactionalEmailCategory.DELIVERABLE_NOTIFICATION,
      metadata: { deliverableTitle, status },
    });
  }

  /**
   * Category Helper 7: Approval Decision Email
   */
  async sendApprovalDecisionEmail(toEmail: string, requestType: string, decision: string, reason?: string) {
    return this.sendTransactionalEmail({
      to: toEmail,
      subject: `📋 Approval Decision: ${requestType} - ${decision}`,
      html: `<p>Your request for ${requestType} was <strong>${decision}</strong>.${reason ? `<br>Reason: ${reason}` : ''}</p>`,
      category: TransactionalEmailCategory.APPROVAL_DECISION,
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
      metadata: { alertTitle },
    });
  }
}
