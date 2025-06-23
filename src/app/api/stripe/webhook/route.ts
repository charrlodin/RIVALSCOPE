import { NextRequest, NextResponse } from 'next/server';
import { stripe, getPlanFromPriceId } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: any) {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const priceId = subscription.items.data[0]?.price?.id;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  const status = subscription.status;

  const planType = getPlanFromPriceId(priceId);

  const userSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (userSubscription) {
    await prisma.subscription.update({
      where: { id: userSubscription.id },
      data: {
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: currentPeriodEnd,
        plan: planType || 'FREE',
        status
      }
    });
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  const customerId = subscription.customer;

  const userSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (userSubscription) {
    await prisma.subscription.update({
      where: { id: userSubscription.id },
      data: {
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
        plan: 'FREE',
        status: 'canceled'
      }
    });
  }
}

async function handlePaymentSucceeded(invoice: any) {
  const customerId = invoice.customer;
  
  const userSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (userSubscription) {
    await prisma.subscription.update({
      where: { id: userSubscription.id },
      data: {
        status: 'active'
      }
    });
  }
}

async function handlePaymentFailed(invoice: any) {
  const customerId = invoice.customer;
  
  const userSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (userSubscription) {
    await prisma.subscription.update({
      where: { id: userSubscription.id },
      data: {
        status: 'past_due'
      }
    });
  }
}