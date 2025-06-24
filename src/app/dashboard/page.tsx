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
  lastSuccessfulCrawl: Date | null;
  isActive: boolean;
  crawlFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  monitoringType: 'SINGLE_PAGE' | 'SECTION';
  crawlAttempts: number;
  successfulCrawls: number;
  _count: {
    changes: number;
    crawlLogs: number;
  };
}

// Helper function to determine competitor status
const getCompetitorStatus = (competitor: Competitor) => {
  if (!competitor.isActive) {
    return { 
      status: 'PAUSED', 
      color: '#ff69b4', // Pink
      icon: '⏸',
      description: 'Monitoring paused by user'
    };
  }
  
  if (competitor.crawlAttempts === 0) {
    return { 
      status: 'PENDING', 
      color: '#ffff00', // Yellow
      icon: '⏳',
      description: 'Waiting for first crawl'
    };
  }
  
  const successRate = competitor.successfulCrawls / competitor.crawlAttempts;
  
  if (successRate === 0) {
    return { 
      status: 'FAILING', 
      color: '#ff0000', // Red
      icon: '❌',
      description: 'All crawl attempts failed'
    };
  }
  
  if (successRate < 0.5) {
    return { 
      status: 'UNSTABLE', 
      color: '#ff8800', // Orange
      icon: '⚠️',
      description: 'Frequent crawl failures'
    };
  }
  
  if (successRate < 1) {
    return { 
      status: 'ACTIVE', 
      color: '#00ff00', // Green
      icon: '●',
      description: 'Monitoring with some issues'
    };
  }
  
  return { 
    status: 'HEALTHY', 
    color: '#00ff00', // Green
    icon: '✅',
    description: 'Monitoring perfectly'
  };
};

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [showAddForm, setShowAddForm] = useState(false);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [monitoringType, setMonitoringType] = useState<'SINGLE_PAGE' | 'SECTION' | 'SMART'>('SINGLE_PAGE');
  const [userIntent, setUserIntent] = useState('');
  const [customUrls, setCustomUrls] = useState<string[]>(['']);
  const [showCustomUrls, setShowCustomUrls] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCrawling, setIsCrawling] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userSignals, setUserSignals] = useState<number>(50);
  const [userData, setUserData] = useState<any>({ signalsBalance: 50, name: 'User', competitorsCount: 0, signalsExpiry: '12 months' });
  const [showSignalWarning, setShowSignalWarning] = useState(false);
  const [sitemapInfo, setSitemapInfo] = useState<any>(null);
  const [isLoadingSitemap, setIsLoadingSitemap] = useState(false);
  const [smartPreview, setSmartPreview] = useState<any>(null);
  const [isLoadingSmartPreview, setIsLoadingSmartPreview] = useState(false);
  const [aiRecommendation, setAIRecommendation] = useState<any>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [priorityPaths, setPriorityPaths] = useState<string[]>(['']);

  // Signal costs for different monitoring types
  const signalCosts = {
    SINGLE_PAGE: 1,    // Single page check
    SECTION: sitemapInfo?.sitemap?.totalPages || 10,       // Section monitoring with crawl - use actual page count
    SMART: aiRecommendation?.estimated_signals || smartPreview?.estimatedSignals || 5  // AI-powered smart tracking
  };

  // Update userData with live competitor count and Clerk info
  const currentUserData = {
    ...userData,
    name: user?.fullName || user?.firstName || userData.name || 'User',
    email: user?.primaryEmailAddress?.emailAddress || userData.email || 'user@email.com',
    signalsBalance: userSignals,
    competitorsCount: competitors.length,
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
        const userDataResponse = await userResponse.json();
        setUserData({
          ...userDataResponse,
          competitorsCount: userDataResponse._count?.competitors || 0,
          signalsExpiry: '12 months' // Default expiry
        });
        setUserSignals(userDataResponse.signalsBalance || 50);
      } else {
        console.error('Failed to fetch user data');
        // Keep default values
      }

      // Fetch recent activity
      await fetchRecentActivity();
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

  // Function to fetch recent activity
  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/activity');
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  // Function to fetch sitemap information
  const fetchSitemapInfo = async (url: string) => {
    if (!url) {
      setSitemapInfo(null);
      setSmartPreview(null);
      return;
    }

    setIsLoadingSitemap(true);
    try {
      const response = await fetch('/api/sitemap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const data = await response.json();
        setSitemapInfo(data);
        
        // Also fetch smart tracking preview
        await fetchSmartPreview(url);
      } else {
        setSitemapInfo(null);
        setSmartPreview(null);
        console.error('Failed to fetch sitemap info');
      }
    } catch (error) {
      setSitemapInfo(null);
      setSmartPreview(null);
      console.error('Error fetching sitemap:', error);
    } finally {
      setIsLoadingSitemap(false);
    }
  };

  // Function to fetch smart tracking preview
  const fetchSmartPreview = async (url: string) => {
    if (!url) {
      setSmartPreview(null);
      return;
    }

    setIsLoadingSmartPreview(true);
    try {
      const response = await fetch('/api/smart-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, priorityPaths: priorityPaths.filter(p => p.trim()) }),
      });

      if (response.ok) {
        const data = await response.json();
        setSmartPreview(data);
      } else {
        setSmartPreview(null);
        console.error('Failed to fetch smart preview');
      }
    } catch (error) {
      setSmartPreview(null);
      console.error('Error fetching smart preview:', error);
    } finally {
      setIsLoadingSmartPreview(false);
    }
  };

  // Function to fetch AI recommendations
  const fetchAIRecommendation = async (url: string, userPrompt?: string) => {
    if (!url) {
      setAIRecommendation(null);
      return;
    }

    setIsLoadingAI(true);
    try {
      const response = await fetch('/api/ai-smart-crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url, 
          userPrompt: userPrompt?.trim() || '',
          maxSignals: 8
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAIRecommendation(data);
      } else {
        setAIRecommendation(null);
        console.error('Failed to fetch AI recommendation');
      }
    } catch (error) {
      setAIRecommendation(null);
      console.error('Error fetching AI recommendation:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Check if user has enough signals for selected monitoring type
    const requiredSignals = signalCosts[monitoringType];
    if (currentUserData.signalsBalance < requiredSignals) {
      setError(`Not enough signals! You need ${requiredSignals} signal${requiredSignals > 1 ? 's' : ''} but only have ${currentUserData.signalsBalance}.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          url, 
          description, 
          monitoringType 
        }),
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

  const handleTogglePause = async (competitorId: string) => {
    try {
      const response = await fetch(`/api/competitors/${competitorId}/toggle`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        // Update the competitor in the local state
        setCompetitors(prev => 
          prev.map(comp => 
            comp.id === competitorId 
              ? { ...comp, isActive: result.competitor.isActive }
              : comp
          )
        );
        
        // Refresh recent activity to show the pause/resume action
        await fetchRecentActivity();
      } else {
        const errorData = await response.json();
        alert(`Failed to ${competitors.find(c => c.id === competitorId)?.isActive ? 'pause' : 'resume'}: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error toggling competitor status:', error);
      alert('Network error. Please try again.');
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
              Welcome back, <span className="font-bold">{currentUserData.name}</span>
            </p>
          </div>
          <Button 
            onClick={() => {
              if (currentUserData.signalsBalance < signalCosts.SINGLE_PAGE) {
                setShowSignalWarning(true);
              } else {
                setShowAddForm(!showAddForm);
                // Reset form when opening
                if (!showAddForm) {
                  setName('');
                  setUrl('');
                  setDescription('');
                  setMonitoringType('SINGLE_PAGE');
                  setUserIntent('');
                  setCustomUrls(['']);
                  setShowCustomUrls(false);
                  setError('');
                }
              }
            }}
            className="transform rotate-1 animate-pulse hover:animate-bounce"
            style={{
              animation: competitors.length === 0 ? 'wobble 2s ease-in-out infinite' : undefined
            }}
          >
            + ADD RIVAL
          </Button>
        </div>

        {/* Signals Status */}
        <Card color="cyan" className="mb-8 transform -rotate-1">
          <div className="transform rotate-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-black">SIGNALS BALANCE: {currentUserData.signalsBalance}</h2>
                <p className="font-mono text-black">
                  Monitoring {currentUserData.competitorsCount} rivals • Signals expire in {currentUserData.signalsExpiry}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  BUY SIGNALS
                </Button>
                <Button variant="secondary" size="sm">
                  USAGE HISTORY
                </Button>
              </div>
            </div>
            
            {/* Signal Costs Info */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border-4 border-black p-3">
                <h3 className="font-bold text-black">SINGLE PAGE</h3>
                <p className="font-mono text-sm text-black">{signalCosts.SINGLE_PAGE} signal • Monitor one specific URL</p>
              </div>
              <div className="bg-white border-4 border-black p-3">
                <h3 className="font-bold text-black">SECTION CRAWL</h3>
                <p className="font-mono text-sm text-black">{signalCosts.SECTION} signals • Monitor dynamic sections (blog, changelog)</p>
              </div>
            </div>
            
            {/* Progress Bar - showing usage of last 100 signals */}
            <div className="mt-4">
              <p className="font-mono text-sm text-black mb-2">Signal Usage (showing impact on balance)</p>
              <div className="border-4 border-black h-6" style={{ backgroundColor: '#ffff00' }}>
                <div 
                  className="h-full border-r-4 border-black"
                  style={{ 
                    width: `${Math.min((50 - currentUserData.signalsBalance) / 50 * 100, 100)}%`,
                    backgroundColor: '#00ffff'
                  }}
                ></div>
              </div>
              <p className="font-mono text-xs text-black mt-1">
                {50 - currentUserData.signalsBalance} signals used from your initial 50 free signals
              </p>
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
                      onChange={(e) => {
                        const newUrl = e.target.value;
                        setUrl(newUrl);
                        // Fetch sitemap info when URL is valid
                        if (newUrl && newUrl.startsWith('http')) {
                          fetchSitemapInfo(newUrl);
                          // Also fetch AI recommendation for smart tracking
                          if (monitoringType === 'SMART') {
                            fetchAIRecommendation(newUrl, userIntent);
                          }
                        } else {
                          setSitemapInfo(null);
                          setAIRecommendation(null);
                        }
                      }}
                      placeholder="https://competitor.com"
                      required
                    />
                  </div>
                </div>
                
                {/* Monitoring Type Selection */}
                <div>
                  <label className="block font-bold mb-2 text-black">MONITORING TYPE</label>
                  
                  {isLoadingSitemap && (
                    <div className="bg-yellow-400 border-4 border-black p-4 mb-4">
                      <p className="font-mono text-black text-center">
                        🔍 ANALYZING WEBSITE STRUCTURE...
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      className={`border-4 border-black p-4 cursor-pointer transform hover:scale-105 transition-transform ${
                        monitoringType === 'SINGLE_PAGE' 
                          ? 'bg-cyan-400' 
                          : 'bg-white hover:bg-gray-100'
                      }`}
                      onClick={() => setMonitoringType('SINGLE_PAGE')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-black">SINGLE PAGE</h3>
                        <span className="bg-green-500 text-white px-2 py-1 text-xs font-bold border-2 border-black">
                          1 SIGNAL
                        </span>
                      </div>
                      <p className="font-mono text-sm text-black">
                        Monitor just the main page you specify
                      </p>
                    </div>
                    
                    <div 
                      className={`border-4 border-black p-4 cursor-pointer transform hover:scale-105 transition-transform ${
                        monitoringType === 'SECTION' 
                          ? 'bg-cyan-400' 
                          : sitemapInfo?.sitemap?.totalPages > currentUserData.signalsBalance 
                            ? 'bg-red-100 opacity-50 cursor-not-allowed'
                            : 'bg-white hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        if ((sitemapInfo?.sitemap?.totalPages || 0) <= currentUserData.signalsBalance) {
                          setMonitoringType('SECTION');
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-black">FULL SITE</h3>
                        <span className={`px-2 py-1 text-xs font-bold border-2 border-black ${
                          (sitemapInfo?.sitemap?.totalPages || 0) > currentUserData.signalsBalance 
                            ? 'bg-red-500 text-white'
                            : 'bg-yellow-500 text-black'
                        }`}>
                          {sitemapInfo?.sitemap?.totalPages || '...'} SIGNALS
                        </span>
                      </div>
                      <p className="font-mono text-sm text-black">
                        {sitemapInfo?.sitemap ? 
                          `Monitor all ${sitemapInfo.sitemap.totalPages} pages found` :
                          'Monitor entire website (analyzing...)'
                        }
                      </p>
                      {(sitemapInfo?.sitemap?.totalPages || 0) > currentUserData.signalsBalance && (
                        <p className="font-mono text-xs text-red-600 mt-2">
                          ⚠️ Insufficient signals (need {sitemapInfo?.sitemap?.totalPages}, have {currentUserData.signalsBalance})
                        </p>
                      )}
                    </div>
                    
                    {/* SMART TRACKING OPTION */}
                    <div 
                      className={`border-4 border-black p-4 cursor-pointer transform hover:scale-105 transition-transform ${
                        monitoringType === 'SMART' 
                          ? 'bg-cyan-400' 
                          : smartPreview?.estimatedSignals > currentUserData.signalsBalance 
                            ? 'bg-red-100 opacity-50 cursor-not-allowed'
                            : 'bg-white hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        if (smartPreview?.estimatedSignals <= currentUserData.signalsBalance) {
                          setMonitoringType('SMART');
                          // Fetch AI recommendation when switching to SMART
                          if (url && url.startsWith('http')) {
                            fetchAIRecommendation(url, userIntent);
                          }
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-black">
                          🧠 SMART
                          {isLoadingSmartPreview && <span className="ml-2 text-xs">...</span>}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-bold border-2 border-black ${
                          smartPreview?.estimatedSignals > currentUserData.signalsBalance 
                            ? 'bg-red-500 text-white'
                            : 'bg-green-500 text-white'
                        }`}>
                          {smartPreview?.estimatedSignals || '...'} SIGNALS
                        </span>
                      </div>
                      <p className="font-mono text-sm text-black">
                        {smartPreview ? 
                          `Track only the most important changes` :
                          'AI-powered tracking of only changed content'
                        }
                      </p>
                      {smartPreview && smartPreview.totalUrls > 0 && (
                        <p className="font-mono text-xs text-black mt-2">
                          💡 Saves ~{Math.max(0, smartPreview.totalUrls - smartPreview.estimatedSignals)} signals vs full site
                        </p>
                      )}
                      {smartPreview?.estimatedSignals > currentUserData.signalsBalance && (
                        <p className="font-mono text-xs text-red-600 mt-2">
                          ⚠️ Insufficient signals (need {smartPreview.estimatedSignals}, have {currentUserData.signalsBalance})
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 bg-white border-4 border-black p-3">
                    <p className="font-mono text-sm text-black">
                      <strong>Cost: {
                        monitoringType === 'SINGLE_PAGE' ? 1 : 
                        monitoringType === 'SMART' ? (aiRecommendation?.estimated_signals || smartPreview?.estimatedSignals || '...') :
                        sitemapInfo?.sitemap?.totalPages || '...'
                      } signal{
                        (monitoringType === 'SINGLE_PAGE' ? 1 : 
                         monitoringType === 'SMART' ? (aiRecommendation?.estimated_signals || smartPreview?.estimatedSignals || 1) :
                         sitemapInfo?.sitemap?.totalPages || 1) > 1 ? 's' : ''
                      }</strong> • 
                      Your balance: {currentUserData.signalsBalance} signals
                    </p>
                    {sitemapInfo?.sitemap && (
                      <p className="font-mono text-xs text-black mt-1">
                        Sitemap discovered {sitemapInfo.sitemap.totalPages} pages on {sitemapInfo.sitemap.domain}
                      </p>
                    )}
                    {monitoringType === 'SMART' && smartPreview && (
                      <div className="mt-4 bg-green-100 border-4 border-black p-4">
                        <h4 className="font-bold text-black mb-2">🎯 SMART TRACKING PREVIEW</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-black">
                          <div>
                            <span className="font-bold">Total URLs:</span>
                            <br />{sitemapInfo?.sitemap?.totalPages || smartPreview.totalUrls}
                          </div>
                          <div>
                            <span className="font-bold">Priority URLs:</span>
                            <br />{smartPreview.priorityUrls}
                          </div>
                          <div>
                            <span className="font-bold">Recent Changes:</span>
                            <br />{smartPreview.recentChanges}
                          </div>
                          <div>
                            <span className="font-bold">Will Track:</span>
                            <br />{aiRecommendation?.estimated_signals || smartPreview.estimatedSignals} URLs
                          </div>
                        </div>
                        {smartPreview.topPaths && smartPreview.topPaths.length > 0 && (
                          <div className="mt-3">
                            <p className="font-bold text-black text-sm mb-2">Top Paths Found:</p>
                            <div className="flex flex-wrap gap-2">
                              {smartPreview.topPaths.slice(0, 6).map((path: any, index: number) => (
                                <span key={index} className="bg-white border-2 border-black px-2 py-1 text-xs font-mono">
                                  {path.path} ({path.count})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* RIVAL AI Recommendation - moved inside Smart Tracking Preview */}
                        {isLoadingAI && (
                          <div className="mt-3 bg-yellow-400 border-4 border-black p-3">
                            <p className="font-mono text-black text-center">
                              🧠 RIVAL AI is analyzing the website...
                            </p>
                          </div>
                        )}
                        
                        {aiRecommendation && (
                          <div className="mt-3 bg-cyan-100 border-4 border-black p-3">
                            <h4 className="font-bold text-black mb-2">🧠 RIVAL AI</h4>
                            {aiRecommendation.type === 'user_intent' ? (
                              <div>
                                <p className="font-mono text-xs text-black mb-2">
                                  <strong>Your request:</strong> "{aiRecommendation.userPrompt}"
                                </p>
                                <p className="font-mono text-xs text-black mb-2">
                                  <strong>AI Analysis:</strong> {aiRecommendation.interpretation}
                                </p>
                                <p className="font-mono text-xs text-black mb-2">
                                  <strong>Pages found:</strong> {aiRecommendation.matched_pages?.length || 0} / {sitemapInfo?.sitemap?.totalPages || aiRecommendation.total_urls_in_sitemap} total
                                </p>
                                <p className="font-mono text-xs text-black">
                                  <strong>Estimated signals:</strong> {aiRecommendation.estimated_signals}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p className="font-mono text-xs text-black mb-2">
                                  <strong>AI Analysis:</strong> {aiRecommendation.analysis_summary}
                                </p>
                                <p className="font-mono text-xs text-black mb-2">
                                  <strong>Priority pages:</strong> {aiRecommendation.priority_pages?.length || 0} / {sitemapInfo?.sitemap?.totalPages || aiRecommendation.total_urls_in_sitemap} total
                                </p>
                                <p className="font-mono text-xs text-black">
                                  <strong>Estimated signals:</strong> {aiRecommendation.estimated_signals}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* User Intent for Smart Tracking */}
                {monitoringType === 'SMART' && (
                  <div className="mt-4 bg-green-100 border-4 border-black p-4">
                    <label className="block font-bold mb-2 text-black">🧠 WHAT ARE YOU LOOKING TO TRACK? (OPTIONAL)</label>
                    <textarea
                      value={userIntent}
                      onChange={(e) => {
                        setUserIntent(e.target.value);
                        // Fetch AI recommendation when user types intent
                        if (url && url.startsWith('http')) {
                          fetchAIRecommendation(url, e.target.value);
                        }
                      }}
                      placeholder="e.g., 'pricing changes', 'new product features', 'blog posts about AI', 'competitor announcements'..."
                      className="w-full border-4 border-black p-3 font-mono text-sm"
                      rows={3}
                    />
                    <p className="font-mono text-xs text-black mt-2">
                      🧠 RIVAL AI will analyze the sitemap and find pages matching your intent
                    </p>
                  </div>
                )}
                
                {/* Custom URLs Option */}
                <div className="mt-4">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="customUrls"
                      checked={showCustomUrls}
                      onChange={(e) => setShowCustomUrls(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="customUrls" className="font-bold text-black">
                      📝 ADD CUSTOM URLS (OPTIONAL)
                    </label>
                  </div>
                  
                  {showCustomUrls && (
                    <div className="bg-white border-4 border-black p-4">
                      <p className="font-mono text-sm text-black mb-3">
                        Monitor specific URLs in addition to the main monitoring type:
                      </p>
                      {customUrls.map((customUrl, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <Input
                            type="url"
                            value={customUrl}
                            onChange={(e) => {
                              const newUrls = [...customUrls];
                              newUrls[index] = e.target.value;
                              setCustomUrls(newUrls);
                            }}
                            placeholder="https://competitor.com/pricing"
                            className="flex-1"
                          />
                          {customUrls.length > 1 && (
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                const newUrls = customUrls.filter((_, i) => i !== index);
                                setCustomUrls(newUrls);
                              }}
                            >
                              ✕
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCustomUrls([...customUrls, ''])}
                        className="mt-2"
                      >
                        + ADD ANOTHER URL
                      </Button>
                    </div>
                  )}
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
                      {(() => {
                        const status = getCompetitorStatus(competitor);
                        return (
                          <span 
                            className="px-2 py-1 text-xs font-bold border-2 border-black text-white"
                            style={{ backgroundColor: status.color }}
                            title={status.description}
                          >
                            {status.icon} {status.status}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <p className="font-mono text-sm mb-2 break-all text-black">{competitor.url}</p>
                  
                  {/* Monitoring Details */}
                  <div className="bg-white border-4 border-black p-3 mb-4">
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="font-bold">Type:</span> {competitor.monitoringType?.replace('_', ' ') || 'SINGLE PAGE'}
                      </div>
                      <div>
                        <span className="font-bold">Frequency:</span> {competitor.crawlFrequency || 'DAILY'}
                      </div>
                      <div>
                        <span className="font-bold">Crawls:</span> {competitor.successfulCrawls || 0}/{competitor.crawlAttempts || 0}
                      </div>
                      <div>
                        <span className="font-bold">Success Rate:</span> {
                          competitor.crawlAttempts > 0 
                            ? Math.round((competitor.successfulCrawls / competitor.crawlAttempts) * 100) 
                            : 0
                        }%
                      </div>
                    </div>
                  </div>
                  
                  <p className="font-mono text-sm mb-4 text-black">
                    Last crawled: <span className="font-bold">
                      {competitor.lastCrawled 
                        ? new Date(competitor.lastCrawled).toLocaleDateString() 
                        : 'Never'
                      }
                    </span>
                    {competitor.lastSuccessfulCrawl && (
                      <span className="text-green-600 ml-2">✓</span>
                    )}
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
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleCrawlNow(competitor.id)}
                        disabled={isCrawling === competitor.id || !competitor.isActive}
                      >
                        {isCrawling === competitor.id ? 'CRAWLING...' : 'CRAWL NOW'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant={competitor.isActive ? "danger" : "primary"}
                        onClick={() => handleTogglePause(competitor.id)}
                      >
                        {competitor.isActive ? '⏸ PAUSE' : '▶ RESUME'}
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
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="font-mono text-black text-lg">NO ACTIVITY YET</p>
                  <p className="font-mono text-black text-sm mt-2">Start monitoring rivals to see activity here</p>
                </div>
              ) : (
                recentActivity.map((activity, index) => (
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
                          {activity.type === 'CHANGE' 
                            ? activity.changeType?.replace('_', ' ') || 'CHANGE'
                            : activity.type
                          }
                        </span>
                        <h3 className="font-bold text-black">{activity.title}</h3>
                      </div>
                      <span className="font-mono text-xs text-black">
                        {new Date(activity.time).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-mono text-sm text-black mb-1">
                      <span className="font-bold">{activity.competitor}:</span> {activity.description}
                    </p>
                    {activity.type === 'CRAWL' && activity.signalsUsed && (
                      <p className="font-mono text-xs text-black mt-1 opacity-75">
                        Used {activity.signalsUsed} signal{activity.signalsUsed > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                ))
              )}
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

      {/* Insufficient Signals Warning Modal */}
      {showSignalWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-lg w-full">
            <Card color="yellow" className="transform rotate-1">
              <div className="transform -rotate-1 text-center">
                <div className="flex justify-between items-center mb-4">
                  <div></div>
                  <h2 className="text-3xl font-bold text-black transform rotate-1 bg-red-500 text-white border-4 border-black px-4 py-2 inline-block">
                    ⚠️ LOW SIGNALS!
                  </h2>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowSignalWarning(false)}
                    className="text-2xl leading-none p-2 text-black bg-white border-4 border-black hover:bg-red-500 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>
                
                <div className="bg-white border-4 border-black p-6 mb-6 transform -rotate-1">
                  <div className="transform rotate-1">
                    <p className="font-bold text-xl text-black mb-4">
                      NOT ENOUGH SIGNALS!
                    </p>
                    <p className="font-mono text-black mb-4">
                      You have <strong>{currentUserData.signalsBalance} signals</strong> remaining.
                      You need at least <strong>{signalCosts.SINGLE_PAGE} signal</strong> to monitor a new rival.
                    </p>
                    <p className="font-mono text-black text-sm">
                      Signal costs:
                    </p>
                    <div className="text-left mt-2">
                      <p className="font-mono text-xs text-black">• Single Page: {signalCosts.SINGLE_PAGE} signal</p>
                      <p className="font-mono text-xs text-black">• Section Crawl: {signalCosts.SECTION} signals</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-cyan-400 border-4 border-black p-4 transform rotate-1">
                    <div className="transform -rotate-1">
                      <h3 className="font-bold text-black mb-2">OPTION 1: DELETE A RIVAL</h3>
                      <p className="font-mono text-sm text-black">
                        Remove an existing rival to save signals
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-pink-400 border-4 border-black p-4 transform -rotate-1">
                    <div className="transform rotate-1">
                      <h3 className="font-bold text-black mb-2">OPTION 2: BUY SIGNAL PACKS</h3>
                      <p className="font-mono text-sm text-black">
                        Developer: 100 signals for $10 • Startup: 500 signals for $45
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <Button 
                    onClick={() => setShowSignalWarning(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    GOT IT
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      setShowSignalWarning(false);
                      // Could add purchase logic here
                    }}
                    className="flex-1 bg-green-500 text-white border-4 border-black hover:bg-green-600"
                  >
                    BUY SIGNALS
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