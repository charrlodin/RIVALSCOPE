import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface NotificationData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
    };

    this.transporter = nodemailer.createTransporter(config);
  }

  async sendEmail(data: NotificationData): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@rivalscope.com',
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
      });
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  async sendChangeNotification(
    userEmail: string,
    competitorName: string,
    changeType: string,
    changeDescription: string,
    competitorUrl: string
  ): Promise<boolean> {
    const subject = `🔍 RivalScope Alert: ${competitorName} has changed!`;
    
    const html = `
      <div style="font-family: monospace; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 4px solid #000000; padding: 20px;">
        <div style="background-color: #ffff00; padding: 20px; border: 4px solid #000000; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold; text-transform: uppercase;">
            🔍 RIVAL ALERT!
          </h1>
        </div>
        
        <div style="padding: 20px; background-color: #ffffff; border: 4px solid #000000;">
          <h2 style="color: #000000; font-weight: bold; text-transform: uppercase;">
            ${competitorName} HAS CHANGED
          </h2>
          
          <div style="background-color: #ff69b4; padding: 15px; border: 2px solid #000000; margin: 15px 0;">
            <strong>CHANGE TYPE:</strong> ${changeType.toUpperCase()}
          </div>
          
          <div style="background-color: #00ffff; padding: 15px; border: 2px solid #000000; margin: 15px 0;">
            <strong>DESCRIPTION:</strong> ${changeDescription}
          </div>
          
          <div style="background-color: #00ff00; padding: 15px; border: 2px solid #000000; margin: 15px 0;">
            <strong>URL:</strong> <a href="${competitorUrl}" style="color: #000000; font-weight: bold;">${competitorUrl}</a>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" 
               style="background-color: #ffff00; color: #000000; padding: 15px 30px; text-decoration: none; font-weight: bold; border: 4px solid #000000; text-transform: uppercase;">
              VIEW DASHBOARD
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
          <p>You're receiving this because you're monitoring ${competitorName} on RivalScope.</p>
          <p>Manage your notifications in your <a href="${process.env.NEXTAUTH_URL}/settings">account settings</a>.</p>
        </div>
      </div>
    `;

    const text = `
      RivalScope Alert: ${competitorName} has changed!
      
      Change Type: ${changeType}
      Description: ${changeDescription}
      URL: ${competitorUrl}
      
      View your dashboard: ${process.env.NEXTAUTH_URL}/dashboard
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
      text,
    });
  }

  async sendWeeklyReport(
    userEmail: string,
    competitorChanges: Array<{
      competitorName: string;
      changeCount: number;
      url: string;
      changes: Array<{
        type: string;
        description: string;
        detectedAt: Date;
      }>;
    }>
  ): Promise<boolean> {
    const subject = '📊 Your Weekly RivalScope Report';
    
    const changesHtml = competitorChanges.map(competitor => `
      <div style="background-color: #ffffff; border: 4px solid #000000; margin: 15px 0; padding: 15px;">
        <h3 style="margin: 0 0 10px 0; font-weight: bold; text-transform: uppercase;">
          ${competitor.competitorName}
        </h3>
        <p style="margin: 5px 0; font-size: 14px;">
          <strong>Changes:</strong> ${competitor.changeCount}
        </p>
        <p style="margin: 5px 0; font-size: 14px;">
          <strong>URL:</strong> <a href="${competitor.url}" style="color: #000000;">${competitor.url}</a>
        </p>
        
        ${competitor.changes.slice(0, 3).map(change => `
          <div style="background-color: #f0f0f0; padding: 10px; margin: 10px 0; border-left: 4px solid #000000;">
            <strong>${change.type.toUpperCase()}:</strong> ${change.description}
            <br>
            <small>${change.detectedAt.toLocaleDateString()}</small>
          </div>
        `).join('')}
        
        ${competitor.changes.length > 3 ? `<p><em>...and ${competitor.changes.length - 3} more changes</em></p>` : ''}
      </div>
    `).join('');

    const html = `
      <div style="font-family: monospace; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 4px solid #000000; padding: 20px;">
        <div style="background-color: #ffff00; padding: 20px; border: 4px solid #000000; margin-bottom: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold; text-transform: uppercase;">
            📊 WEEKLY REPORT
          </h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your competitors have been busy!</p>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="text-transform: uppercase; font-weight: bold; margin-bottom: 20px;">
            Competitor Activity Summary
          </h2>
          
          ${changesHtml}
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" 
               style="background-color: #ff69b4; color: #000000; padding: 15px 30px; text-decoration: none; font-weight: bold; border: 4px solid #000000; text-transform: uppercase;">
              VIEW FULL DASHBOARD
            </a>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }
}

export const notificationService = new NotificationService();