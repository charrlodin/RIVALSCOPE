import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface ChangeNotificationData {
  competitorName: string;
  competitorUrl: string;
  changeType: string;
  changeDescription: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
  changesUrl: string;
  userEmail: string;
  userName: string;
}

export class EmailService {
  static async sendChangeNotification(data: ChangeNotificationData): Promise<boolean> {
    try {
      const template = this.generateChangeNotificationTemplate(data);
      
      const response = await resend.emails.send({
        from: 'RivalScope <notifications@rivalscope.com>',
        to: [data.userEmail],
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log('Email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  static generateChangeNotificationTemplate(data: ChangeNotificationData): EmailTemplate {
    const severityColors = {
      high: '#ff0000', // Red
      medium: '#ffff00', // Yellow  
      low: '#00ff00' // Green
    };

    const severityBackgrounds = {
      high: '#ff0000',
      medium: '#ffff00',
      low: '#00ff00'
    };

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RivalScope Alert</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: 'Courier New', monospace;
            background-color: #ffffff;
            color: #000000;
            line-height: 1.4;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            border: 4px solid #000000;
            background-color: #ffffff;
            transform: rotate(-1deg);
          }
          .email-content {
            padding: 30px;
            transform: rotate(1deg);
          }
          .header {
            border-bottom: 4px solid #000000;
            padding-bottom: 20px;
            margin-bottom: 30px;
            transform: rotate(1deg);
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #000000;
            text-decoration: none;
            text-transform: uppercase;
          }
          .alert-badge {
            display: inline-block;
            padding: 8px 16px;
            border: 4px solid #000000;
            background-color: ${severityBackgrounds[data.severity]};
            color: ${data.severity === 'medium' ? '#000000' : '#ffffff'};
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            transform: rotate(-2deg);
            margin-bottom: 20px;
          }
          .main-title {
            font-size: 28px;
            font-weight: bold;
            color: #000000;
            margin: 20px 0;
            text-transform: uppercase;
            transform: rotate(1deg);
          }
          .competitor-info {
            background-color: #00ffff;
            border: 4px solid #000000;
            padding: 20px;
            margin: 20px 0;
            transform: rotate(-1deg);
          }
          .competitor-info h2 {
            margin: 0 0 10px 0;
            font-size: 20px;
            font-weight: bold;
            color: #000000;
            text-transform: uppercase;
          }
          .competitor-url {
            color: #000000;
            text-decoration: underline;
            font-weight: bold;
            word-break: break-all;
          }
          .change-details {
            background-color: #ff69b4;
            border: 4px solid #000000;
            padding: 20px;
            margin: 20px 0;
            transform: rotate(1deg);
          }
          .change-details h3 {
            margin: 0 0 15px 0;
            font-size: 18px;
            font-weight: bold;
            color: #000000;
            text-transform: uppercase;
          }
          .change-type {
            background-color: #000000;
            color: #ffffff;
            padding: 6px 12px;
            border: 2px solid #000000;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
            display: inline-block;
            margin-bottom: 15px;
          }
          .timestamp {
            background-color: #ffff00;
            border: 4px solid #000000;
            padding: 15px;
            margin: 20px 0;
            font-weight: bold;
            color: #000000;
            text-align: center;
            transform: rotate(-1deg);
          }
          .cta-button {
            display: inline-block;
            background-color: #000000;
            color: #ffffff;
            border: 4px solid #000000;
            padding: 15px 30px;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
            text-transform: uppercase;
            transform: rotate(2deg);
            margin: 20px 0;
            transition: all 0.2s ease;
          }
          .cta-button:hover {
            background-color: #ff69b4;
            color: #000000;
            transform: rotate(-2deg);
          }
          .footer {
            border-top: 4px solid #000000;
            padding-top: 20px;
            margin-top: 30px;
            font-size: 12px;
            color: #000000;
            text-align: center;
          }
          .brutalist-divider {
            height: 8px;
            background-color: #000000;
            margin: 20px 0;
            transform: rotate(1deg);
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-content">
            <div class="header">
              <div class="logo">RIVALSCOPE</div>
              <div style="font-size: 14px; margin-top: 10px; color: #000000;">
                COMPETITOR MONITORING ALERT
              </div>
            </div>

            <div class="alert-badge">
              ${data.severity.toUpperCase()} PRIORITY
            </div>

            <h1 class="main-title">
              NEW CHANGE DETECTED!
            </h1>

            <div class="competitor-info">
              <h2>TARGET IDENTIFIED:</h2>
              <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
                ${data.competitorName}
              </div>
              <a href="${data.competitorUrl}" class="competitor-url">
                ${data.competitorUrl}
              </a>
            </div>

            <div class="change-details">
              <h3>CHANGE DETAILS:</h3>
              <div class="change-type">${data.changeType.replace('_', ' ')}</div>
              <div style="font-size: 16px; line-height: 1.5; color: #000000;">
                ${data.changeDescription}
              </div>
            </div>

            <div class="timestamp">
              DETECTED: ${data.detectedAt.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })}
            </div>

            <div class="brutalist-divider"></div>

            <div style="text-align: center;">
              <a href="${data.changesUrl}" class="cta-button">
                VIEW FULL CHANGES
              </a>
            </div>

            <div style="margin: 30px 0; padding: 20px; border: 2px solid #000000; background-color: #f0f0f0;">
              <div style="font-size: 14px; color: #000000; line-height: 1.5;">
                <strong>Hey ${data.userName},</strong><br><br>
                Your rival just made a move! We detected ${data.changeType.toLowerCase().replace('_', ' ')} 
                on their website. Click the button above to see exactly what changed and stay ahead of the competition.
                <br><br>
                Keep watching,<br>
                <strong>The RivalScope Team</strong>
              </div>
            </div>

            <div class="footer">
              <div style="margin-bottom: 10px;">
                <strong>RIVALSCOPE</strong> - COMPETITOR MONITORING PLATFORM
              </div>
              <div style="font-size: 11px;">
                You're receiving this because you're monitoring competitor changes.<br>
                <a href="#" style="color: #000000;">Manage notifications</a> | 
                <a href="#" style="color: #000000;">Unsubscribe</a>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
RIVALSCOPE ALERT - ${data.severity.toUpperCase()} PRIORITY

NEW CHANGE DETECTED!

TARGET: ${data.competitorName}
URL: ${data.competitorUrl}

CHANGE TYPE: ${data.changeType.replace('_', ' ')}
DESCRIPTION: ${data.changeDescription}

DETECTED: ${data.detectedAt.toLocaleString()}

View full changes: ${data.changesUrl}

Hey ${data.userName},

Your rival just made a move! We detected ${data.changeType.toLowerCase().replace('_', ' ')} on their website. 
Click the link above to see exactly what changed and stay ahead of the competition.

Keep watching,
The RivalScope Team

---
RIVALSCOPE - COMPETITOR MONITORING PLATFORM
You're receiving this because you're monitoring competitor changes.
    `;

    const subject = `🚨 ${data.severity.toUpperCase()} ALERT: ${data.competitorName} - ${data.changeType.replace('_', ' ')}`;

    return { subject, html, text };
  }

  static async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    try {
      const template = this.generateWelcomeTemplate(userName);
      
      const response = await resend.emails.send({
        from: 'RivalScope <welcome@rivalscope.com>',
        to: [userEmail],
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log('Welcome email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  static generateWelcomeTemplate(userName: string): EmailTemplate {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to RivalScope</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: 'Courier New', monospace;
            background-color: #ffffff;
            color: #000000;
            line-height: 1.4;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            border: 4px solid #000000;
            background-color: #ffffff;
            transform: rotate(1deg);
          }
          .email-content {
            padding: 30px;
            transform: rotate(-1deg);
          }
          .header {
            text-align: center;
            border-bottom: 4px solid #000000;
            padding-bottom: 20px;
            margin-bottom: 30px;
            background-color: #ffff00;
            margin: -30px -30px 30px -30px;
            padding: 30px;
            transform: rotate(1deg);
          }
          .logo {
            font-size: 36px;
            font-weight: bold;
            color: #000000;
            text-transform: uppercase;
            margin-bottom: 10px;
          }
          .welcome-badge {
            background-color: #ff69b4;
            border: 4px solid #000000;
            padding: 10px 20px;
            font-weight: bold;
            font-size: 16px;
            text-transform: uppercase;
            display: inline-block;
            transform: rotate(-2deg);
            margin: 20px 0;
          }
          .main-title {
            font-size: 32px;
            font-weight: bold;
            color: #000000;
            margin: 20px 0;
            text-transform: uppercase;
            transform: rotate(1deg);
            text-align: center;
          }
          .feature-box {
            border: 4px solid #000000;
            padding: 20px;
            margin: 20px 0;
            transform: rotate(-1deg);
          }
          .feature-box.cyan { background-color: #00ffff; }
          .feature-box.green { background-color: #00ff00; }
          .feature-box.pink { background-color: #ff69b4; }
          .feature-title {
            font-size: 18px;
            font-weight: bold;
            color: #000000;
            text-transform: uppercase;
            margin-bottom: 10px;
          }
          .cta-button {
            display: inline-block;
            background-color: #000000;
            color: #ffffff;
            border: 4px solid #000000;
            padding: 15px 30px;
            text-decoration: none;
            font-weight: bold;
            font-size: 18px;
            text-transform: uppercase;
            transform: rotate(2deg);
            margin: 20px 0;
          }
          .footer {
            border-top: 4px solid #000000;
            padding-top: 20px;
            margin-top: 30px;
            font-size: 12px;
            color: #000000;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-content">
            <div class="header">
              <div class="logo">RIVALSCOPE</div>
              <div style="font-size: 16px; color: #000000;">
                COMPETITOR MONITORING PLATFORM
              </div>
            </div>

            <div class="welcome-badge">
              WELCOME ABOARD!
            </div>

            <h1 class="main-title">
              READY TO WATCH YOUR RIVALS?
            </h1>

            <div style="font-size: 18px; margin: 30px 0; text-align: center; color: #000000;">
              Hey <strong>${userName}</strong>! 🎯<br><br>
              Welcome to the ultimate competitor monitoring platform. 
              You're now equipped to stay ahead of your competition!
            </div>

            <div class="feature-box cyan">
              <div class="feature-title">🔍 AUTOMATIC MONITORING</div>
              <div>We'll watch your competitors 24/7 and alert you the moment they make changes to pricing, features, or content.</div>
            </div>

            <div class="feature-box green">
              <div class="feature-title">⚡ INSTANT ALERTS</div>
              <div>Get real-time notifications via email when competitors update their websites. Never miss a competitive move again!</div>
            </div>

            <div class="feature-box pink">
              <div class="feature-title">📊 DETAILED REPORTS</div>
              <div>Access comprehensive change histories and analytics to understand your competitive landscape better.</div>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <a href="https://rivalscope.com/dashboard" class="cta-button">
                START MONITORING NOW
              </a>
            </div>

            <div style="margin: 30px 0; padding: 20px; border: 2px solid #000000; background-color: #f0f0f0;">
              <div style="font-size: 14px; color: #000000; line-height: 1.5;">
                <strong>Quick Start Guide:</strong><br>
                1. Add your first competitor in the dashboard<br>
                2. We'll start monitoring their website immediately<br>
                3. Get alerted when they make changes<br>
                4. Stay ahead of the competition! 🚀
              </div>
            </div>

            <div class="footer">
              <div style="margin-bottom: 10px;">
                <strong>RIVALSCOPE</strong> - KNOW YOUR COMPETITION
              </div>
              <div style="font-size: 11px;">
                Questions? Reply to this email or contact support@rivalscope.com<br>
                <a href="#" style="color: #000000;">Visit Dashboard</a> | 
                <a href="#" style="color: #000000;">Documentation</a>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
WELCOME TO RIVALSCOPE!

Hey ${userName}!

Welcome to the ultimate competitor monitoring platform. You're now equipped to stay ahead of your competition!

WHAT YOU GET:
🔍 AUTOMATIC MONITORING - We'll watch your competitors 24/7
⚡ INSTANT ALERTS - Get real-time notifications via email  
📊 DETAILED REPORTS - Access comprehensive change histories

QUICK START GUIDE:
1. Add your first competitor in the dashboard
2. We'll start monitoring their website immediately
3. Get alerted when they make changes
4. Stay ahead of the competition! 🚀

Get started: https://rivalscope.com/dashboard

Questions? Reply to this email or contact support@rivalscope.com

RIVALSCOPE - KNOW YOUR COMPETITION
    `;

    const subject = `🚀 Welcome to RivalScope, ${userName}! Your competitive edge starts now`;

    return { subject, html, text };
  }
}