import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private resend: Resend | null = null;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly frontendUrl: string;
  private readonly isEmailEnabled: boolean;

  constructor(private configService: ConfigService) {
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');

    this.fromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'Restaurant App';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4000';

    // Resend free tier uses onboarding@resend.dev for testing
    // Once you verify your domain, you can use your own email
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'onboarding@resend.dev';

    // Log configuration status
    this.logger.log(`Email Configuration: Resend API Key=${resendApiKey ? 'Configured' : 'Missing'}, Frontend=${this.frontendUrl}`);

    // Enable email only if API key is provided
    this.isEmailEnabled = !!resendApiKey;

    if (this.isEmailEnabled) {
      this.resend = new Resend(resendApiKey);
      this.logger.log('Resend email service initialized successfully');
    } else {
      this.logger.warn('RESEND_API_KEY not configured. Emails will be logged to console.');
    }
  }

  private async sendMail(options: EmailOptions): Promise<boolean> {
    if (!this.isEmailEnabled || !this.resend) {
      // Log email to console for development
      this.logger.log('='.repeat(60));
      this.logger.log('📧 EMAIL (Development Mode - No Resend API Key)');
      this.logger.log(`To: ${options.to}`);
      this.logger.log(`Subject: ${options.subject}`);
      this.logger.log('-'.repeat(60));
      // Extract important links from HTML
      const linkMatch = options.html.match(/href="([^"]+)"/g);
      if (linkMatch) {
        linkMatch.forEach(link => {
          const url = link.replace('href="', '').replace('"', '');
          if (url.includes('verify-email') || url.includes('reset-password')) {
            this.logger.log(`🔗 ACTION LINK: ${url}`);
          }
        });
      }
      this.logger.log('='.repeat(60));
      return true;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        this.logger.error(`Resend error for ${options.to}: ${error.message}`);
        return false;
      }

      this.logger.log(`Email sent successfully to ${options.to} (ID: ${data?.id})`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error.message);
      return false;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verifyUrl = `${this.frontendUrl}/c/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🍽️ Restaurant App</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #2c3e50; margin: 0 0 20px; font-size: 24px;">Verify Your Email Address</h2>
              <p style="color: #7f8c8d; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Thank you for registering! Please click the button below to verify your email address and activate your account.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}"
                   style="display: inline-block; background: #e74c3c; color: #ffffff; text-decoration: none;
                          padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;
                          box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);">
                  Verify Email Address
                </a>
              </div>

              <p style="color: #95a5a6; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
                If you didn't create an account, you can safely ignore this email.
              </p>

              <p style="color: #95a5a6; font-size: 14px; line-height: 1.6; margin: 10px 0 0;">
                This link will expire in 24 hours.
              </p>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

              <p style="color: #bdc3c7; font-size: 12px; margin: 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verifyUrl}" style="color: #e74c3c; word-break: break-all;">${verifyUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
              <p style="color: #95a5a6; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Restaurant App. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendMail({
      to: email,
      subject: 'Verify Your Email - Restaurant App',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `${this.frontendUrl}/c/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🍽️ Restaurant App</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #2c3e50; margin: 0 0 20px; font-size: 24px;">Reset Your Password</h2>
              <p style="color: #7f8c8d; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}"
                   style="display: inline-block; background: #e74c3c; color: #ffffff; text-decoration: none;
                          padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;
                          box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);">
                  Reset Password
                </a>
              </div>

              <div style="background-color: #fff3cd; border-left: 4px solid #f39c12; padding: 15px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #856404; font-size: 14px; margin: 0;">
                  ⚠️ If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                </p>
              </div>

              <p style="color: #95a5a6; font-size: 14px; line-height: 1.6; margin: 10px 0 0;">
                This link will expire in 1 hour for security reasons.
              </p>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

              <p style="color: #bdc3c7; font-size: 12px; margin: 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #e74c3c; word-break: break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
              <p style="color: #95a5a6; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Restaurant App. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendMail({
      to: email,
      subject: 'Reset Your Password - Restaurant App',
      html,
    });
  }
}
