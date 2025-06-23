import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe, createCustomer, createCheckoutSession, PLANS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { planType } = await request.json();

    if (!planType || !(planType in PLANS)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    const plan = PLANS[planType as keyof typeof PLANS];

    if (!plan.stripePriceId) {
      return NextResponse.json(
        { error: 'Plan not available for purchase' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let customerId = user.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await createCustomer(user.email, user.name || '');
      customerId = customer.id;

      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: { stripeCustomerId: customerId },
        create: {
          userId: user.id,
          stripeCustomerId: customerId,
          plan: 'FREE'
        }
      });
    }

    const checkoutSession = await createCheckoutSession(
      customerId,
      plan.stripePriceId,
      `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
      `${process.env.NEXTAUTH_URL}/pricing?canceled=true`
    );

    return NextResponse.json({ 
      checkoutUrl: checkoutSession.url 
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}