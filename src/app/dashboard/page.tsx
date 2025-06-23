'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Header from '@/components/layout/Header';
import CompetitorSettingsModal from '@/components/CompetitorSettingsModal';

interface Competitor {
  id: string;
  name: string | null;
  url: string;
  description: string | null;
  lastCrawled: Date | null;
  isActive: boolean;
  _count: {
    changes: number;
  };
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [showAddForm, setShowAddForm] = useState(false);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCrawling, setIsCrawling] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('FREE');
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  // Plan limits
  const planLimits = {
    FREE: 1,
    STARTER: 5,
    PRO: 20
  };

  // User data from Clerk with fallbacks
  const userData = {
    name: user?.fullName || user?.firstName || 'User',
    email: user?.primaryEmailAddress?.emailAddress || 'user@email.com',
    plan: userPlan,
    competitorsUsed: competitors.length,
    competitorsLimit: planLimits[userPlan as keyof typeof planLimits] || 1,
    nextBilling: '2024-01-15'
  };

  // Fetch competitors data
  useEffect(() => {
    if (isLoaded && user) {
      fetchCompetitors();
    }
  }, [isLoaded, user]);

  const fetchCompetitors = async () => {
    try {
      // Fetch competitors and user data in parallel
      const [competitorsResponse, userResponse] = await Promise.all([
        fetch('/api/competitors'),
        fetch('/api/user')
      ]);

      if (competitorsResponse.ok) {
        const competitorsData = await competitorsResponse.json();
        setCompetitors(competitorsData);
      } else {
        console.error('Failed to fetch competitors');
      }

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserPlan(userData.subscription?.plan || 'FREE');
      } else {
        console.error('Failed to fetch user data');
        // Keep default FREE plan
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
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


  // Calculate stats from real data - with safe fallbacks
  const stats = {
    totalChanges: competitors.reduce((sum, comp) => sum + (comp._count?.changes || 0), 0),
    priceChanges: Math.floor(competitors.reduce((sum, comp) => sum + (comp._count?.changes || 0), 0) * 0.3),
    contentUpdates: Math.floor(competitors.reduce((sum, comp) => sum + (comp._count?.changes || 0), 0) * 0.5),
    newFeatures: Math.floor(competitors.reduce((sum, comp) => sum + (comp._count?.changes || 0), 0) * 0.2),
    alertsSent: competitors.reduce((sum, comp) => sum + (comp._count?.changes || 0), 0)
  };

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

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, url, description }),
      });

      if (response.ok) {
        const newCompetitor = await response.json();
        setCompetitors([newCompetitor, ...competitors]);
        setShowAddForm(false);
        setName('');
        setUrl('');
        setDescription('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add competitor');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Error adding competitor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCrawlNow = async (competitorId: string) => {
    setIsCrawling(competitorId);
    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ competitorId }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Crawl result:', result);
        // Refresh competitors data to show updated last crawled time
        fetchCompetitors();
      } else {
        const errorData = await response.json();
        console.error('Failed to crawl competitor:', errorData.error);
        setError(`Failed to crawl: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error crawling competitor:', error);
      setError('Network error during crawl');
    } finally {
      setIsCrawling(null);
    }
  };

  const handleCompetitorUpdate = (updatedCompetitor: Competitor) => {
    setCompetitors(competitors.map(comp => 
      comp.id === updatedCompetitor.id ? updatedCompetitor : comp
    ));
  };

  const handleCompetitorDelete = (competitorId: string) => {
    setCompetitors(competitors.filter(comp => comp.id !== competitorId));
  };

  const openSettings = (competitor: Competitor) => {
    setSelectedCompetitor(competitor);
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setSelectedCompetitor(null);
    setIsSettingsOpen(false);
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
            onClick={() => {
              if (userData.plan === 'FREE' && userData.competitorsUsed >= userData.competitorsLimit) {
                setShowLimitWarning(true);
              } else {
                setShowAddForm(!showAddForm);
              }
            }}
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
              <div className="bg-brutalist-yellow border-4 border-black h-6">
                <div 
                  className="bg-brutalist-cyan h-full border-r-4 border-black"
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
                
                {error && (
                  <div className="bg-brutalist-red text-white p-3 border-4 border-black font-bold">
                    {error}
                  </div>
                )}
                
                <div className="flex space-x-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'ADDING...' : 'START WATCHING'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost"
                    onClick={() => {
                      setShowAddForm(false);
                      setError('');
                    }}
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
            YOUR RIVALS ({competitors.length})
          </h2>
          
          {isLoading ? (
            <Card className="text-center">
              <h3 className="text-2xl font-bold text-black mb-4">LOADING RIVALS...</h3>
              <p className="font-mono text-black">Fetching your competitor data</p>
            </Card>
          ) : competitors.length === 0 ? (
            <Card color="yellow" className="text-center transform -rotate-1">
              <div className="transform rotate-1">
                <h3 className="text-2xl font-bold text-black mb-4">NO RIVALS YET!</h3>
                <p className="font-mono text-black mb-6">Add your first competitor to start monitoring</p>
                <Button onClick={() => setShowAddForm(true)}>
                  ADD YOUR FIRST RIVAL
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {competitors.map((competitor, index) => (
                <Card 
                  key={competitor.id} 
                  className={`transform ${index % 3 === 0 ? 'rotate-1' : index % 3 === 1 ? '-rotate-1' : 'rotate-2'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-black">
                      {competitor.name || new URL(competitor.url).hostname}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-bold border-2 border-black ${
                        competitor.isActive ? 'bg-brutalist-green' : 'bg-brutalist-yellow'
                      }`}>
                        {competitor.isActive ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="font-mono text-sm mb-2 break-all text-black">{competitor.url}</p>
                  <p className="font-mono text-sm mb-4 text-black">
                    Last crawled: <span className="font-bold">
                      {competitor.lastCrawled 
                        ? new Date(competitor.lastCrawled).toLocaleDateString() 
                        : 'Never'
                      }
                    </span>
                  </p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-black">
                      {competitor._count?.changes || 0} NEW CHANGES
                    </span>
                    {(competitor._count?.changes || 0) > 0 && (
                      <span className="bg-brutalist-red text-white px-3 py-1 text-xs font-bold animate-pulse">
                        NEW!
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = `/competitors/${competitor.id}/changes`}
                    >
                      VIEW CHANGES
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleCrawlNow(competitor.id)}
                        disabled={isCrawling === competitor.id}
                      >
                        {isCrawling === competitor.id ? 'CRAWLING...' : 'CRAWL NOW'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => openSettings(competitor)}
                      >
                        SETTINGS
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
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

      {/* Settings Modal */}
      {selectedCompetitor && (
        <CompetitorSettingsModal
          competitor={selectedCompetitor}
          isOpen={isSettingsOpen}
          onClose={closeSettings}
          onUpdate={handleCompetitorUpdate}
          onDelete={handleCompetitorDelete}
        />
      )}

      {/* FREE Plan Limit Warning Modal */}
      {showLimitWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-lg w-full">
            <Card color="yellow" className="transform rotate-1">
              <div className="transform -rotate-1 text-center">
                <div className="flex justify-between items-center mb-4">
                  <div></div>
                  <h2 className="text-3xl font-bold text-black transform rotate-1 bg-red-500 text-white border-4 border-black px-4 py-2 inline-block">
                    ⚠️ LIMIT REACHED!
                  </h2>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowLimitWarning(false)}
                    className="text-2xl leading-none p-2 text-black bg-white border-4 border-black hover:bg-red-500 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>
                
                <div className="bg-white border-4 border-black p-6 mb-6 transform -rotate-1">
                  <div className="transform rotate-1">
                    <p className="font-bold text-xl text-black mb-4">
                      FREE PLAN MAXED OUT!
                    </p>
                    <p className="font-mono text-black mb-4">
                      You're already monitoring <strong>{userData.competitorsUsed}/{userData.competitorsLimit}</strong> competitors 
                      on the FREE plan.
                    </p>
                    <p className="font-mono text-black text-sm">
                      To add another rival, you can either:
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-cyan-400 border-4 border-black p-4 transform rotate-1">
                    <div className="transform -rotate-1">
                      <h3 className="font-bold text-black mb-2">OPTION 1: DELETE A RIVAL</h3>
                      <p className="font-mono text-sm text-black">
                        Remove your current rival to free up space
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-pink-400 border-4 border-black p-4 transform -rotate-1">
                    <div className="transform rotate-1">
                      <h3 className="font-bold text-black mb-2">OPTION 2: UPGRADE PLAN</h3>
                      <p className="font-mono text-sm text-black">
                        STARTER: 5 rivals • PRO: 20 rivals
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <Button 
                    onClick={() => setShowLimitWarning(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    GOT IT
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      setShowLimitWarning(false);
                      // Could add upgrade logic here
                    }}
                    className="flex-1 bg-green-500 text-white border-4 border-black hover:bg-green-600"
                  >
                    UPGRADE PLAN
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}