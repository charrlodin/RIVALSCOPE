import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        subscription: true,
        _count: {
          select: {
            competitors: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const plan = user.subscription?.plan || 'FREE';
    
    const limits = {
      FREE: 1,
      STARTER: 5,
      PRO: 20
    };

    return NextResponse.json({
      plan,
      competitorsUsed: user._count.competitors,
      competitorsLimit: limits[plan as keyof typeof limits],
      status: user.subscription?.status || 'active',
      stripeCurrentPeriodEnd: user.subscription?.stripeCurrentPeriodEnd
    });

  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}