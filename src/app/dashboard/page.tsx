'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Header from '@/components/layout/Header';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [showAddForm, setShowAddForm] = useState(false);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // User data from Clerk with fallbacks
  const userData = {
    name: user?.fullName || user?.firstName || 'User',
    email: user?.primaryEmailAddress?.emailAddress || 'user@email.com',
    plan: 'STARTER', // This would come from your database subscription table
    competitorsUsed: 3,
    competitorsLimit: 5,
    nextBilling: '2024-01-15'
  };

  // Show loading state while user data is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center">
            <h1 className="text-4xl font-bold text-black">LOADING...</h1>
            <p className="font-mono text-black mt-4">Getting your rival data ready</p>
          </Card>
        </main>
      </div>
    );
  }

  // Mock statistics
  const stats = {
    totalChanges: 47,
    priceChanges: 12,
    contentUpdates: 23,
    newFeatures: 12,
    alertsSent: 34
  };

  const mockCompetitors = [
    {
      id: '1',
      name: 'Competitor A',
      url: 'https://competitor-a.com',
      lastCrawled: '2 hours ago',
      status: 'active',
      changes: 3,
      health: 'healthy'
    },
    {
      id: '2',
      name: 'Competitor B', 
      url: 'https://competitor-b.com',
      lastCrawled: '1 day ago',
      status: 'active',
      changes: 1,
      health: 'warning'
    },
    {
      id: '3',
      name: 'Competitor C',
      url: 'https://competitor-c.com', 
      lastCrawled: '5 minutes ago',
      status: 'active',
      changes: 7,
      health: 'healthy'
    }
  ];

  const recentActivity = [
    {
      id: '1',
      type: 'PRICE_CHANGE',
      title: 'PRICING PAGE UPDATED',
      competitor: 'Competitor A',
      description: 'Starter plan price changed from $29 to $39',
      time: '2 hours ago',
      severity: 'high'
    },
    {
      id: '2', 
      type: 'CONTENT_UPDATE',
      title: 'NEW BLOG POST',
      competitor: 'Competitor B',
      description: 'Published "10 Ways to Scale Your Business"',
      time: '1 day ago',
      severity: 'medium'
    },
    {
      id: '3',
      type: 'FEATURE_ANNOUNCEMENT', 
      title: 'PRODUCT UPDATE',
      competitor: 'Competitor C',
      description: 'Launched new integration with Salesforce',
      time: '2 days ago',
      severity: 'high'
    },
    {
      id: '4',
      type: 'CONTENT_UPDATE',
      title: 'FEATURE PAGE UPDATED',
      competitor: 'Competitor A', 
      description: 'Added new API documentation section',
      time: '3 days ago',
      severity: 'low'
    }
  ];

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding competitor:', { name, url, description });
    setShowAddForm(false);
    setName('');
    setUrl('');
    setDescription('');
  };

  const handleCrawlNow = (competitorId: string) => {
    console.log('Crawling competitor:', competitorId);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold transform -rotate-1 text-black mb-2">
              WATCH CENTER
            </h1>
            <p className="font-mono text-lg text-black">
              Welcome back, <span className="font-bold">{userData.name}</span>
            </p>
          </div>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="transform rotate-1"
          >
            + ADD COMPETITOR
          </Button>
        </div>

        {/* User Plan Status */}
        <Card color="cyan" className="mb-8 transform -rotate-1">
          <div className="transform rotate-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-black">CURRENT PLAN: {userData.plan}</h2>
                <p className="font-mono text-black">
                  Monitoring {userData.competitorsUsed}/{userData.competitorsLimit} competitors
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  UPGRADE PLAN
                </Button>
                <Button variant="secondary" size="sm">
                  BILLING
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="bg-white border-4 border-black h-6">
                <div 
                  className="bg-brutalist-yellow h-full border-r-4 border-black"
                  style={{ width: `${(userData.competitorsUsed / userData.competitorsLimit) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="transform rotate-1">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-black">{stats.totalChanges}</h3>
              <p className="font-mono text-sm text-black">TOTAL CHANGES</p>
            </div>
          </Card>
          <Card color="yellow" className="transform -rotate-1">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-black">{stats.priceChanges}</h3>
              <p className="font-mono text-sm text-black">PRICE CHANGES</p>
            </div>
          </Card>
          <Card color="pink" className="transform rotate-1">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-black">{stats.contentUpdates}</h3>
              <p className="font-mono text-sm text-black">CONTENT UPDATES</p>
            </div>
          </Card>
          <Card color="green" className="transform -rotate-1">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-black">{stats.newFeatures}</h3>
              <p className="font-mono text-sm text-black">NEW FEATURES</p>
            </div>
          </Card>
          <Card className="transform rotate-1">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-black">{stats.alertsSent}</h3>
              <p className="font-mono text-sm text-black">ALERTS SENT</p>
            </div>
          </Card>
        </div>

        {/* Add Competitor Form */}
        {showAddForm && (
          <Card color="yellow" className="mb-8 transform rotate-1">
            <div className="transform -rotate-1">
              <h2 className="text-2xl font-bold mb-4 text-black">ADD NEW COMPETITOR</h2>
              <form onSubmit={handleAddCompetitor} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-2 text-black">COMPETITOR NAME</label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Competitor Inc."
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-2 text-black">WEBSITE URL</label>
                    <Input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://competitor.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold mb-2 text-black">DESCRIPTION (OPTIONAL)</label>
                  <Input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Main competitor in SaaS space"
                  />
                </div>
                <div className="flex space-x-4">
                  <Button type="submit">
                    START WATCHING
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost"
                    onClick={() => setShowAddForm(false)}
                  >
                    CANCEL
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        )}

        {/* Competitors Grid */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6 text-black transform rotate-1">
            YOUR RIVALS ({mockCompetitors.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockCompetitors.map((competitor, index) => (
              <Card 
                key={competitor.id} 
                className={`transform ${index % 3 === 0 ? 'rotate-1' : index % 3 === 1 ? '-rotate-1' : 'rotate-2'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-black">{competitor.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-bold border-2 border-black ${
                      competitor.health === 'healthy' ? 'bg-brutalist-green' : 'bg-brutalist-yellow'
                    }`}>
                      {competitor.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <p className="font-mono text-sm mb-2 break-all text-black">{competitor.url}</p>
                <p className="font-mono text-sm mb-4 text-black">
                  Last crawled: <span className="font-bold">{competitor.lastCrawled}</span>
                </p>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-black">
                    {competitor.changes} NEW CHANGES
                  </span>
                  {competitor.changes > 0 && (
                    <span className="bg-brutalist-red text-white px-3 py-1 text-xs font-bold animate-pulse">
                      NEW!
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <Button size="sm" className="w-full">
                    VIEW CHANGES
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => handleCrawlNow(competitor.id)}
                    >
                      CRAWL NOW
                    </Button>
                    <Button size="sm" variant="ghost">
                      SETTINGS
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card color="pink" className="transform -rotate-1">
          <div className="transform rotate-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-black">RECENT ACTIVITY</h2>
              <Button variant="ghost" size="sm">
                VIEW ALL
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div 
                  key={activity.id}
                  className={`border-l-4 border-black pl-4 pb-4 ${
                    index !== recentActivity.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-bold border-2 border-black ${
                        activity.severity === 'high' ? 'bg-brutalist-red text-white' :
                        activity.severity === 'medium' ? 'bg-brutalist-yellow text-black' :
                        'bg-brutalist-green text-black'
                      }`}>
                        {activity.type.replace('_', ' ')}
                      </span>
                      <h3 className="font-bold text-black">{activity.title}</h3>
                    </div>
                    <span className="font-mono text-xs text-black">{activity.time}</span>
                  </div>
                  <p className="font-mono text-sm text-black mb-1">
                    <span className="font-bold">{activity.competitor}:</span> {activity.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}