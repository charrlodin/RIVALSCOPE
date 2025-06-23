import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EmailService } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { emailType, userEmail, userName } = await request.json();

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    let result;

    if (emailType === 'welcome') {
      result = await EmailService.sendWelcomeEmail(userEmail, userName || 'User');
    } else if (emailType === 'change') {
      result = await EmailService.sendChangeNotification({
        competitorName: 'Test Competitor Inc.',
        competitorUrl: 'https://testcompetitor.com',
        changeType: 'PRICE_CHANGE',
        changeDescription: 'Starter plan price changed from $29 to $39/month',
        severity: 'high',
        detectedAt: new Date(),
        changesUrl: 'http://localhost:3000/competitors/test-id/changes',
        userEmail,
        userName: userName || 'User'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid email type. Use "welcome" or "change"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: result,
      message: result ? 'Email sent successfully' : 'Failed to send email'
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}