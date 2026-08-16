import { Injectable, Logger } from '@nestjs/common';
import { EmailQueueService } from './services/email-queue.service';
import { TransactionalEmailCategory } from './enums/email-category.enum';
import { EmailOptions } from './interfaces/email-provider.interface';

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

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
          .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
          .logo { background: #151c2e; color: #d49b38; display: inline-block; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 18px; }
          .badge { display: inline-block; background-color: #e6f4ea; color: #137333; font-weight: 600; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 12px; }
          .content { font-size: 14px; line-height: 1.6; }
          .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .btn { display: block; width: 100%; text-align: center; background-color: #151c2e; color: #ffffff !important; font-weight: bold; padding: 14px 0; border-radius: 8px; text-decoration: none; margin-top: 24px; font-size: 14px; }
          .footer { margin-top: 32px; font-size: 11px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">AH AnveshakHub Enterprise</div>
            <div><span class="badge">APPLICATION APPROVED</span></div>
          </div>
          <div class="content">
            <h2>Welcome to AnveshakHub Enterprise ERP, ${orgName}!</h2>
            <p>We are delighted to inform you that your organization onboarding application (Reference: <strong>${orgNumber}</strong>) has been verified and <strong>APPROVED</strong> by the AnveshakHub Administration team.</p>
            
            <div class="info-box">
              <p style="margin:0 0 8px 0; font-size: 12px; color: #64748b; font-weight: bold;">YOUR ACCOUNT LOGIN DETAILS</p>
              <p style="margin: 4px 0;"><strong>Primary Contact Email:</strong> ${toEmail}</p>
              <p style="margin: 4px 0;"><strong>Account Status:</strong> <span style="color: #10B981; font-weight: bold;">ACTIVE</span></p>
              <p style="margin: 4px 0;"><strong>Password:</strong> Use the secure password specified during registration.</p>
            </div>

            <p>You can now sign in to access your organization dashboard, manage enterprise profiles, and collaborate across modules.</p>

            <a href="${loginUrl}" class="btn">Sign In to AnveshakHub ERP</a>
          </div>
          <div class="footer">
            <p>AnveshakHub Enterprise Platform • Bridging Innovation, Enterprise & Academia</p>
            <p>This is an automated system notification.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendTransactionalEmail({
      to: toEmail,
      subject: `🎉 Your AnveshakHub Enterprise Account Has Been Approved! (${orgNumber})`,
      html: htmlContent,
      category: TransactionalEmailCategory.ORGANIZATION_APPROVAL,
      idempotencyKey,
      metadata: { orgNumber, orgName },
    });
  }

  /**
   * Category Helper 2: Password Reset Email
   */
  async sendPasswordResetEmail(toEmail: string, resetToken: string) {
    const resetUrl = process.env.APP_URL ? `${process.env.APP_URL}/reset-password?token=${resetToken}` : `http://localhost:3000/reset-password?token=${resetToken}`;
    
    return this.sendTransactionalEmail({
      to: toEmail,
      subject: `🔐 Password Reset Request — AnveshakHub ERP`,
      html: `<p>Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
      category: TransactionalEmailCategory.PASSWORD_RESET,
      metadata: { resetToken },
    });
  }

  /**
   * Category Helper 3: Account Onboarding Email
   */
  async sendAccountOnboardingEmail(toEmail: string, userName: string) {
    return this.sendTransactionalEmail({
      to: toEmail,
      subject: `👋 Welcome to AnveshakHub Enterprise ERP, ${userName}!`,
      html: `<p>Hello ${userName}, welcome to AnveshakHub Enterprise ERP.</p>`,
      category: TransactionalEmailCategory.ACCOUNT_ONBOARDING,
      metadata: { userName },
    });
  }

  /**
   * Category Helper 4: Project Notification Email
   */
  async sendProjectNotificationEmail(toEmail: string, projectTitle: string, message: string) {
    return this.sendTransactionalEmail({
      to: toEmail,
      subject: `📁 Project Update: ${projectTitle}`,
      html: `<p>${message}</p>`,
      category: TransactionalEmailCategory.PROJECT_NOTIFICATION,
      metadata: { projectTitle },
    });
  }

  /**
   * Category Helper 5: Meeting Notification Email
   */
  async sendMeetingNotificationEmail(toEmail: string, meetingSubject: string, scheduledAt: string) {
    return this.sendTransactionalEmail({
      to: toEmail,
      subject: `📅 Meeting Scheduled: ${meetingSubject}`,
      html: `<p>You have a meeting scheduled for: ${scheduledAt}</p>`,
      category: TransactionalEmailCategory.MEETING_NOTIFICATION,
      metadata: { meetingSubject, scheduledAt },
    });
  }

  /**
   * Category Helper 6: Deliverable Notification Email
   */
  async sendDeliverableNotificationEmail(toEmail: string, deliverableTitle: string, status: string) {
    return this.sendTransactionalEmail({
      to: toEmail,
      subject: `📦 Deliverable Update: ${deliverableTitle} (${status})`,
      html: `<p>Deliverable <strong>${deliverableTitle}</strong> status is now: <strong>${status}</strong>.</p>`,
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
    return this.sendTransactionalEmail({
      to: toEmail,
      subject: `⚠️ Security Alert: ${alertTitle}`,
      html: detailsHtml,
      category: TransactionalEmailCategory.SYSTEM_SECURITY_ALERT,
      metadata: { alertTitle },
    });
  }
}
