'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface Change {
  id: string;
  changeType: string;
  title: string;
  description: string;
  oldValue: string | null;
  newValue: string | null;
  severity: string;
  detectedAt: Date;
  isRead: boolean;
}

interface Competitor {
  id: string;
  name: string | null;
  url: string;
  description: string | null;
}

export default function CompetitorChanges() {
  const { id } = useParams();
  const { user, isLoaded } = useUser();
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoaded && user && id) {
      fetchCompetitorAndChanges();
    }
  }, [isLoaded, user, id]);

  const fetchCompetitorAndChanges = async () => {
    try {
      // Fetch competitor details
      const competitorResponse = await fetch(`/api/competitors/${id}`);
      if (competitorResponse.ok) {
        const competitorData = await competitorResponse.json();
        setCompetitor(competitorData);
      }

      // Fetch changes
      const changesResponse = await fetch(`/api/competitors/${id}/changes`);
      if (changesResponse.ok) {
        const changesData = await changesResponse.json();
        setChanges(changesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load competitor data');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-brutalist-red text-white';
      case 'HIGH': return 'bg-brutalist-red text-white';
      case 'MEDIUM': return 'bg-brutalist-yellow text-black';
      case 'LOW': return 'bg-brutalist-green text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'PRICE_CHANGE': return '💰';
      case 'CONTENT_UPDATE': return '📝';
      case 'NEW_BLOG_POST': return '📰';
      case 'FEATURE_ANNOUNCEMENT': return '🚀';
      case 'PRODUCT_UPDATE': return '🔄';
      default: return '📋';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center">
            <h1 className="text-4xl font-bold text-black">LOADING...</h1>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-brutalist-yellow font-bold hover:underline mb-2 block">
              ← BACK TO DASHBOARD
            </Link>
            <h1 className="text-4xl md:text-6xl font-bold transform -rotate-1 text-black">
              CHANGE HISTORY
            </h1>
            {competitor && (
              <p className="font-mono text-lg text-black mt-2">
                Monitoring: <span className="font-bold">{competitor.name || competitor.url}</span>
              </p>
            )}
          </div>
          <Button variant="secondary" className="transform rotate-1">
            CRAWL NOW
          </Button>
        </div>

        {isLoading ? (
          <Card className="text-center">
            <h2 className="text-2xl font-bold text-black mb-4">LOADING CHANGES...</h2>
            <p className="font-mono text-black">Fetching change history</p>
          </Card>
        ) : error ? (
          <Card color="red" className="text-center">
            <h2 className="text-2xl font-bold text-black mb-4">ERROR</h2>
            <p className="font-mono text-black">{error}</p>
          </Card>
        ) : changes.length === 0 ? (
          <Card color="yellow" className="text-center transform -rotate-1">
            <div className="transform rotate-1">
              <h2 className="text-3xl font-bold text-black mb-4">NO CHANGES YET</h2>
              <p className="font-mono text-black mb-6">
                No changes have been detected for this competitor yet. 
                Changes will appear here when we detect updates to their website.
              </p>
              <Button>START FIRST CRAWL</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="text-center transform rotate-1">
                <h3 className="text-2xl font-bold text-black">{changes.length}</h3>
                <p className="font-mono text-sm text-black">TOTAL CHANGES</p>
              </Card>
              <Card color="yellow" className="text-center transform -rotate-1">
                <h3 className="text-2xl font-bold text-black">
                  {changes.filter(c => c.severity === 'HIGH' || c.severity === 'CRITICAL').length}
                </h3>
                <p className="font-mono text-sm text-black">HIGH PRIORITY</p>
              </Card>
              <Card color="pink" className="text-center transform rotate-1">
                <h3 className="text-2xl font-bold text-black">
                  {changes.filter(c => c.changeType === 'PRICE_CHANGE').length}
                </h3>
                <p className="font-mono text-sm text-black">PRICE CHANGES</p>
              </Card>
              <Card color="cyan" className="text-center transform -rotate-1">
                <h3 className="text-2xl font-bold text-black">
                  {changes.filter(c => !c.isRead).length}
                </h3>
                <p className="font-mono text-sm text-black">UNREAD</p>
              </Card>
            </div>

            {/* Changes List */}
            <div className="space-y-4">
              {changes.map((change, index) => (
                <Card 
                  key={change.id}
                  className={`transform ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'} ${
                    !change.isRead ? 'ring-4 ring-brutalist-yellow' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getChangeTypeIcon(change.changeType)}</span>
                      <div>
                        <h3 className="text-xl font-bold text-black">{change.title}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs font-bold border-2 border-black ${getSeverityColor(change.severity)}`}>
                            {change.severity}
                          </span>
                          <span className="font-mono text-xs text-black">
                            {formatDate(change.detectedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!change.isRead && (
                      <span className="bg-brutalist-red text-white px-2 py-1 text-xs font-bold animate-pulse">
                        NEW
                      </span>
                    )}
                  </div>

                  <p className="font-mono text-black mb-4">{change.description}</p>

                  {(change.oldValue || change.newValue) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {change.oldValue && (
                        <div className="bg-gray-100 p-3 border-2 border-black">
                          <h4 className="font-bold text-black mb-2">BEFORE:</h4>
                          <p className="font-mono text-sm text-black">{change.oldValue}</p>
                        </div>
                      )}
                      {change.newValue && (
                        <div className="bg-brutalist-yellow p-3 border-2 border-black">
                          <h4 className="font-bold text-black mb-2">AFTER:</h4>
                          <p className="font-mono text-sm text-black">{change.newValue}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}