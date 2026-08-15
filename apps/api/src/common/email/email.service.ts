import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private async initTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

    if (smtpHost && smtpHost !== 'localhost' && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
        tls: { rejectUnauthorized: false },
      });
      this.logger.log(`📧 SMTP Transporter configured for ${smtpHost}:${smtpPort}`);
    } else {
      this.logger.warn(`⚠️ No external SMTP credentials in environment. Fallback enabled.`);
    }
  }

  async sendApprovalEmail(toEmail: string, orgName: string, orgNumber: string) {
    const fromAddress = process.env.SMTP_FROM || `"AnveshakHub Enterprise ERP" <anveshakhub26@gmail.com>`;
    const loginUrl = process.env.APP_URL ? `${process.env.APP_URL}/login` : 'http://localhost:3000/login';

    const subject = `🎉 Your AnveshakHub Enterprise Account Has Been Approved! (${orgNumber})`;

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
              <p style="margin: 4px 0;"><strong>Password:</strong> Use the secure password you specified during registration.</p>
            </div>

            <p>You can now sign in to access your organization dashboard, manage enterprise profiles, and collaborate across modules.</p>

            <a href="${loginUrl}" class="btn">Sign In to AnveshakHub ERP</a>
          </div>
          <div class="footer">
            <p>AnveshakHub Enterprise Platform • Bridging Innovation, Enterprise & Academia</p>
            <p>This is an automated system notification. If you have questions, please contact support.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 1. Check Resend HTTP API Key
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: process.env.SMTP_FROM || 'AnveshakHub ERP <onboarding@resend.dev>',
            to: [toEmail],
            subject,
            html: htmlContent,
          }),
        });
        const resData = await res.json();
        if (res.ok) {
          this.logger.log(`📧 Approval email delivered via Resend API to ${toEmail} (ID: ${resData.id})`);
          return { success: true, messageId: resData.id };
        } else {
          this.logger.warn(`Resend API response error: ${JSON.stringify(resData)}`);
        }
      } catch (err: any) {
        this.logger.error(`Resend API error: ${err.message}`);
      }
    }

    // 2. SMTP Transporter
    try {
      let activeTransporter = this.transporter;
      if (!activeTransporter) {
        const testAccount = await nodemailer.createTestAccount();
        activeTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
      }

      const info = await activeTransporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        html: htmlContent,
        text: `Welcome to AnveshakHub Enterprise ERP! Your organization application (${orgNumber}) for ${orgName} has been APPROVED. You can now log in at ${loginUrl} using email: ${toEmail} and the password specified during registration.`,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      this.logger.log(`📧 Approval email dispatched to ${toEmail}. Message ID: ${info.messageId}`);
      if (previewUrl) {
        this.logger.log(`🔗 Ethereal Live Email Preview URL: ${previewUrl}`);
      }

      return { success: true, messageId: info.messageId, previewUrl: previewUrl || undefined };
    } catch (err: any) {
      this.logger.error(`Failed to dispatch approval email to ${toEmail}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
