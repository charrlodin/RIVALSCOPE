import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    stripePriceId: null,
    maxWebsites: 1,
    crawlFrequency: 'WEEKLY',
    features: [
      '1 website monitoring',
      'Weekly checks',
      'Basic email alerts',
      'Change history (7 days)'
    ]
  },
  STARTER: {
    name: 'Starter',
    price: 49,
    stripePriceId: 'price_starter_monthly', // Replace with actual Stripe price ID
    maxWebsites: 5,
    crawlFrequency: 'DAILY',
    features: [
      '5 websites monitoring',
      'Daily checks',
      'Email alerts',
      'Change history (30 days)',
      'Basic reports'
    ]
  },
  PRO: {
    name: 'Pro',
    price: 99,
    stripePriceId: 'price_pro_monthly', // Replace with actual Stripe price ID
    maxWebsites: 20,
    crawlFrequency: 'HOURLY',
    features: [
      '20 websites monitoring',
      'Hourly checks',
      'Priority email alerts',
      'Unlimited change history',
      'Advanced reports',
      'API access',
      'Slack/Discord notifications'
    ]
  }
} as const;

export type PlanType = keyof typeof PLANS;

export async function createCustomer(email: string, name: string) {
  return await stripe.customers.create({
    email,
    name,
  });
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        customerId,
      },
    },
  });
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

export function getPlanFromPriceId(priceId: string): PlanType | null {
  for (const [planKey, plan] of Object.entries(PLANS)) {
    if (plan.stripePriceId === priceId) {
      return planKey as PlanType;
    }
  }
  return null;
}