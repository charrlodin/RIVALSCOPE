'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 transform -rotate-2 text-black">
            WATCH YOUR
            <br />
            <span className="text-brutalist-red animate-glitch">RIVALS</span>
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
          <h2 className="text-4xl font-bold mb-8 text-black">PRICING THAT MAKES SENSE</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="transform rotate-1">
              <h3 className="text-2xl font-bold mb-4 text-black">FREE</h3>
              <p className="text-4xl font-bold mb-4 text-black">$0</p>
              <p className="font-mono mb-6 text-black">1 website, weekly checks</p>
              <Button variant="ghost" className="w-full">
                START FREE
              </Button>
            </Card>
            <Card color="yellow" className="transform -rotate-2 scale-105">
              <h3 className="text-2xl font-bold mb-4 text-black">STARTER</h3>
              <p className="text-4xl font-bold mb-4 text-black">$49</p>
              <p className="font-mono mb-6 text-black">5 websites, daily checks, email alerts</p>
              <Button className="w-full">
                GET STARTED
              </Button>
            </Card>
            <Card className="transform rotate-2">
              <h3 className="text-2xl font-bold mb-4 text-black">PRO</h3>
              <p className="text-4xl font-bold mb-4 text-black">$99</p>
              <p className="font-mono mb-6 text-black">20 websites, hourly checks, advanced reports</p>
              <Button variant="secondary" className="w-full">
                GO PRO
              </Button>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
