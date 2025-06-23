'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const plans = [
  {
    name: 'FREE',
    price: '$0',
    period: 'forever',
    color: 'white',
    features: [
      '1 website monitoring',
      'Weekly checks',
      'Basic email alerts',
      'Change history (7 days)'
    ],
    planType: 'FREE'
  },
  {
    name: 'STARTER',
    price: '$49',
    period: 'per month',
    color: 'yellow',
    features: [
      '5 websites monitoring',
      'Daily checks',
      'Email alerts',
      'Change history (30 days)',
      'Basic reports'
    ],
    planType: 'STARTER',
    popular: true
  },
  {
    name: 'PRO',
    price: '$99',
    period: 'per month',
    color: 'pink',
    features: [
      '20 websites monitoring',
      'Hourly checks',
      'Priority email alerts',
      'Unlimited change history',
      'Advanced reports',
      'API access',
      'Slack/Discord notifications'
    ],
    planType: 'PRO'
  }
];

export default function Pricing() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (planType: string) => {
    if (planType === 'FREE') {
      window.location.href = '/auth/signup';
      return;
    }

    setIsLoading(planType);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        console.error('No checkout URL received');
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 transform -rotate-2 text-black">
            SIMPLE
            <br />
            <span className="text-brutalist-red">PRICING</span>
          </h1>
          <p className="text-xl md:text-2xl font-mono mb-8 max-w-3xl mx-auto">
            Choose the plan that fits your monitoring needs. No hidden fees, no surprises.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name}
              color={plan.color as any}
              className={`relative transform ${
                index === 0 ? 'rotate-1' : 
                index === 1 ? '-rotate-2 scale-105' : 
                'rotate-2'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-brutalist-red text-white px-4 py-2 font-bold border-4 border-black text-sm">
                    MOST POPULAR
                  </span>
                </div>
              )}
              
              <div className={`transform ${
                index === 1 ? 'rotate-2' : 
                index === 0 ? '-rotate-1' : 
                '-rotate-2'
              }`}>
                <h3 className="text-3xl font-bold mb-4 text-center">
                  {plan.name}
                </h3>
                
                <div className="text-center mb-6">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-lg font-mono ml-2">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center font-mono">
                      <span className="bg-brutalist-green w-4 h-4 border-2 border-black mr-3 flex-shrink-0"></span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.name === 'STARTER' ? 'primary' : plan.name === 'PRO' ? 'secondary' : 'ghost'}
                  onClick={() => handleSubscribe(plan.planType)}
                  disabled={isLoading === plan.planType}
                >
                  {isLoading === plan.planType ? 
                    'PROCESSING...' : 
                    plan.name === 'FREE' ? 'GET STARTED' : `SUBSCRIBE TO ${plan.name}`
                  }
                </Button>
              </div>
            </Card>
          ))}
        </section>

        <section className="bg-brutalist-black text-white p-12 border-4 border-black transform -rotate-1">
          <div className="transform rotate-1 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-brutalist-yellow">
              FREQUENTLY ASKED
              <br />
              QUESTIONS
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
              <div>
                <h3 className="font-bold text-brutalist-yellow mb-2">CAN I CHANGE PLANS ANYTIME?</h3>
                <p className="font-mono">Yes! Upgrade or downgrade your plan anytime from your dashboard. Changes take effect immediately.</p>
              </div>
              
              <div>
                <h3 className="font-bold text-brutalist-yellow mb-2">WHAT HAPPENS TO MY DATA?</h3>
                <p className="font-mono">Your competitor data and change history are preserved when changing plans. Only monitoring limits change.</p>
              </div>
              
              <div>
                <h3 className="font-bold text-brutalist-yellow mb-2">DO YOU OFFER REFUNDS?</h3>
                <p className="font-mono">We offer a 14-day money-back guarantee. If you&apos;re not satisfied, we&apos;ll refund your payment.</p>
              </div>
              
              <div>
                <h3 className="font-bold text-brutalist-yellow mb-2">NEED ENTERPRISE FEATURES?</h3>
                <p className="font-mono">Contact us for custom plans with higher limits, dedicated support, and additional integrations.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}