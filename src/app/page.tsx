'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect authenticated users to dashboard (unless they specifically want to stay on landing)
  useEffect(() => {
    if (isLoaded && isSignedIn && !searchParams.get('stay')) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router, searchParams]);
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 transform -rotate-2 text-black">
            <span className="px-4 py-2 border-4 border-black transform rotate-1 inline-block text-black" style={{ backgroundColor: '#fde047' }}>WATCH</span> YOUR
            <br />
            RIVALS
          </h1>
          <p className="text-xl md:text-2xl font-mono mb-8 max-w-3xl mx-auto text-black">
            Automated competitor monitoring that never sleeps. Get instant alerts when your competition moves.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="transform rotate-1">
              START WATCHING NOW
            </Button>
            <Button variant="ghost" size="lg" className="transform -rotate-1">
              VIEW DEMO
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card color="yellow" className="transform rotate-2">
            <h3 className="text-2xl font-bold mb-4 text-black">PRICE TRACKING</h3>
            <p className="font-mono text-black">Monitor competitor pricing changes in real-time. Never miss a price drop or increase again.</p>
          </Card>
          <Card color="pink" className="transform -rotate-1">
            <h3 className="text-2xl font-bold mb-4 text-black">CONTENT ALERTS</h3>
            <p className="font-mono text-black">Track new blog posts, feature announcements, and product updates automatically.</p>
          </Card>
          <Card color="cyan" className="transform rotate-1">
            <h3 className="text-2xl font-bold mb-4 text-black">SMART REPORTS</h3>
            <p className="font-mono text-black">Get digestible summaries of all competitor activity delivered to your inbox.</p>
          </Card>
        </section>

        <section className="bg-brutalist-black text-white p-12 border-4 border-black transform -rotate-1 mb-16">
          <div className="transform rotate-1">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-brutalist-yellow">
              STOP GUESSING.
              <br />
              START KNOWING.
            </h2>
            <p className="text-xl font-mono mb-8 max-w-2xl">
              While you&apos;re sleeping, your competitors are moving. RivalScope keeps you ahead of the game with 24/7 monitoring.
            </p>
            <Button variant="primary" size="lg">
              JOIN THE WATCHERS
            </Button>
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-4xl font-bold mb-8 text-black">PAY-AS-YOU-GO SIGNALS</h2>
          <p className="text-lg font-mono mb-8 text-black max-w-3xl mx-auto">
            No monthly subscriptions. Buy signal packs once, use them for 12 months. 
            Only pay for what you actually monitor.
          </p>
          
          {/* Free Trial */}
          <Card color="green" className="transform rotate-1 mb-8 max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold mb-4 text-black">FREE TRIAL</h3>
            <p className="text-5xl font-bold mb-4 text-black">50 SIGNALS</p>
            <p className="font-mono mb-6 text-black">
              Try all features • Monitor 50 pages OR 5 sections • Valid for 12 months
            </p>
            <Button className="w-full">
              START FREE TRIAL
            </Button>
          </Card>

          {/* Signal Costs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card color="cyan" className="transform -rotate-1">
              <h3 className="text-2xl font-bold mb-4 text-black">SINGLE PAGE</h3>
              <p className="text-4xl font-bold mb-4 text-black">1 SIGNAL</p>
              <p className="font-mono mb-6 text-black">
                Monitor one specific URL<br />
                (homepage, pricing page, careers page)
              </p>
              <div className="bg-white border-4 border-black p-3">
                <p className="font-mono text-sm text-black">
                  <strong>Perfect for:</strong> Pricing pages, specific product pages, contact info
                </p>
              </div>
            </Card>
            
            <Card color="pink" className="transform rotate-1">
              <h3 className="text-2xl font-bold mb-4 text-black">SECTION CRAWL</h3>
              <p className="text-4xl font-bold mb-4 text-black">10 SIGNALS</p>
              <p className="font-mono mb-6 text-black">
                Monitor dynamic sections<br />
                (blog, changelog, news) + up to 5 pages
              </p>
              <div className="bg-white border-4 border-black p-3">
                <p className="font-mono text-sm text-black">
                  <strong>Perfect for:</strong> Blogs, changelogs, news sections, job postings
                </p>
              </div>
            </Card>
          </div>

          {/* Signal Packs */}
          <h3 className="text-3xl font-bold mb-8 text-black">SIGNAL PACKS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="transform rotate-1">
              <div className="bg-green-500 text-white p-2 mb-4 border-4 border-black transform -rotate-2">
                <h4 className="font-bold">DEVELOPER</h4>
              </div>
              <p className="text-3xl font-bold mb-2 text-black">$10</p>
              <p className="text-xl font-bold mb-4 text-black">100 SIGNALS</p>
              <p className="font-mono mb-6 text-black text-sm">
                $0.10 per signal<br />
                Valid for 12 months<br />
                Perfect for personal projects
              </p>
              <Button variant="ghost" className="w-full">
                BUY NOW
              </Button>
            </Card>

            <Card color="yellow" className="transform -rotate-1 scale-105">
              <div className="bg-brutalist-red text-white p-2 mb-4 border-4 border-black transform rotate-2">
                <h4 className="font-bold">MOST POPULAR</h4>
              </div>
              <div className="bg-blue-500 text-white p-2 mb-4 border-4 border-black transform -rotate-1">
                <h4 className="font-bold">STARTUP</h4>
              </div>
              <p className="text-3xl font-bold mb-2 text-black">$45</p>
              <p className="text-xl font-bold mb-4 text-black">500 SIGNALS</p>
              <p className="font-mono mb-6 text-black text-sm">
                $0.09 per signal • 10% DISCOUNT<br />
                Valid for 12 months<br />
                Great for small teams
              </p>
              <Button className="w-full">
                BUY NOW
              </Button>
            </Card>

            <Card color="cyan" className="transform rotate-2">
              <div className="bg-purple-500 text-white p-2 mb-4 border-4 border-black transform -rotate-1">
                <h4 className="font-bold">GROWTH</h4>
              </div>
              <p className="text-3xl font-bold mb-2 text-black">$80</p>
              <p className="text-xl font-bold mb-4 text-black">1,000 SIGNALS</p>
              <p className="font-mono mb-6 text-black text-sm">
                $0.08 per signal • 20% DISCOUNT<br />
                Valid for 12 months<br />
                Ideal for growing businesses
              </p>
              <Button variant="secondary" className="w-full">
                BUY NOW
              </Button>
            </Card>

            <Card color="pink" className="transform -rotate-2">
              <div className="bg-brutalist-black text-white p-2 mb-4 border-4 border-black transform rotate-1">
                <h4 className="font-bold">SCALE</h4>
              </div>
              <p className="text-3xl font-bold mb-2 text-black">$350</p>
              <p className="text-xl font-bold mb-4 text-black">5,000 SIGNALS</p>
              <p className="font-mono mb-6 text-black text-sm">
                $0.07 per signal • 30% DISCOUNT<br />
                Valid for 12 months<br />
                Enterprise monitoring
              </p>
              <Button variant="ghost" className="w-full">
                BUY NOW
              </Button>
            </Card>
          </div>

          {/* Why Signals */}
          <Card color="yellow" className="transform rotate-1 mt-12 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-black">WHY SIGNALS MAKE SENSE</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div>
                <h4 className="font-bold text-black mb-2">💰 TRANSPARENT PRICING</h4>
                <p className="font-mono text-sm text-black">
                  See exactly what each monitoring action costs. No hidden fees or surprise charges.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-black mb-2">🎯 PAY FOR WHAT YOU USE</h4>
                <p className="font-mono text-sm text-black">
                  Mix single page monitoring (1 signal) with section crawls (10 signals) as needed.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-black mb-2">⏰ NO EXPIRY PRESSURE</h4>
                <p className="font-mono text-sm text-black">
                  Signals last 12 months. Use them when you need them, not when a subscription renews.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
