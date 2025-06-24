'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

interface CompetitorSettingsModalProps {
  competitor: {
    id: string;
    name: string | null;
    url: string;
    description: string | null;
    isActive: boolean;
    crawlFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    monitoringType?: 'SINGLE_PAGE' | 'SECTION';
    notificationFreq?: 'INSTANT' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'DISABLED';
    enableNotifications?: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedCompetitor: any) => void;
  onDelete: (competitorId: string) => void;
}

export default function CompetitorSettingsModal({
  competitor,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}: CompetitorSettingsModalProps) {
  const [name, setName] = useState(competitor.name || '');
  const [description, setDescription] = useState(competitor.description || '');
  const [isActive, setIsActive] = useState(competitor.isActive);
  const [monitoringType, setMonitoringType] = useState<'SINGLE_PAGE' | 'SECTION'>(competitor.monitoringType || 'SINGLE_PAGE');
  const [crawlFrequency, setCrawlFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>(competitor.crawlFrequency || 'DAILY');
  const [notificationFreq, setNotificationFreq] = useState<'INSTANT' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'DISABLED'>(competitor.notificationFreq || 'INSTANT');
  const [enableNotifications, setEnableNotifications] = useState(competitor.enableNotifications !== false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/competitors/${competitor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name || null,
          description: description || null,
          isActive,
          monitoringType,
          crawlFrequency,
          notificationFreq,
          enableNotifications,
        }),
      });

      if (response.ok) {
        const updatedCompetitor = await response.json();
        onUpdate(updatedCompetitor);
        onClose();
      } else {
        const errorData = await response.json();
        alert(`Failed to update: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating competitor:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/competitors/${competitor.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete(competitor.id);
        onClose();
      } else {
        const errorData = await response.json();
        alert(`Failed to delete: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting competitor:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="max-w-2xl w-full max-h-screen overflow-y-auto">
        <Card color="yellow" className="transform rotate-1">
          <div className="transform -rotate-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold transform rotate-1 bg-white text-black border-4 border-black px-4 py-2">
                RIVAL SETTINGS
              </h2>
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="text-2xl leading-none p-2 text-black bg-white border-4 border-black hover:bg-red-500 hover:text-white"
              >
                ✕
              </Button>
            </div>

            {!showDeleteConfirm ? (
              <>
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-white border-4 border-black p-4 transform -rotate-1">
                    <h3 className="text-xl font-bold mb-4 text-black transform rotate-1">
                      BASIC INFORMATION
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block font-bold mb-2 text-black">
                          COMPETITOR NAME
                        </label>
                        <Input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={`e.g., ${new URL(competitor.url).hostname}`}
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-2 text-black">
                          DESCRIPTION
                        </label>
                        <Input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="e.g., Main competitor in pricing"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-2 text-black">
                          WEBSITE URL
                        </label>
                        <div className="bg-gray-100 border-4 border-black p-3 font-mono text-sm break-all text-black">
                          {competitor.url}
                        </div>
                        <p className="text-xs font-mono mt-1 text-black">
                          URL cannot be changed after creation
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="bg-cyan-400 border-4 border-black p-4 transform rotate-1">
                    <h3 className="text-xl font-bold mb-4 text-black transform -rotate-1">
                      MONITORING STATUS
                    </h3>
                    
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="w-5 h-5 border-4 border-black"
                        />
                        <span className="font-bold text-black">
                          ACTIVE MONITORING
                        </span>
                      </label>
                    </div>
                    <p className="text-sm font-mono mt-2 text-black">
                      {isActive 
                        ? 'This rival is being actively monitored for changes' 
                        : 'Monitoring is paused - no alerts will be sent'
                      }
                    </p>
                  </div>

                  {/* Monitoring Type */}
                  <div className="bg-yellow-400 border-4 border-black p-4 transform rotate-1">
                    <h3 className="text-xl font-bold mb-4 text-black transform -rotate-1">
                      MONITORING TYPE
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        className={`border-4 border-black p-4 cursor-pointer transition-colors ${
                          monitoringType === 'SINGLE_PAGE' 
                            ? 'bg-white text-black' 
                            : 'bg-gray-200 hover:bg-gray-300 text-black'
                        }`}
                        onClick={() => setMonitoringType('SINGLE_PAGE')}
                      >
                        <div className="text-center">
                          <span className="font-bold text-lg block">SINGLE PAGE</span>
                          <span className="text-sm font-mono">1 Signal</span>
                          <p className="text-xs font-mono mt-2">
                            Monitor one specific URL for changes
                          </p>
                        </div>
                      </div>
                      
                      <div 
                        className={`border-4 border-black p-4 cursor-pointer transition-colors ${
                          monitoringType === 'SECTION' 
                            ? 'bg-white text-black' 
                            : 'bg-gray-200 hover:bg-gray-300 text-black'
                        }`}
                        onClick={() => setMonitoringType('SECTION')}
                      >
                        <div className="text-center">
                          <span className="font-bold text-lg block">FULL PAGES</span>
                          <span className="text-sm font-mono">10 Signals</span>
                          <p className="text-xs font-mono mt-2">
                            Crawl multiple pages and sections
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-mono mt-3 text-black">
                      <strong>Note:</strong> Changing monitoring type will affect signal usage for future crawls.
                    </p>
                  </div>

                  {/* Crawl Frequency */}
                  <div className="bg-pink-400 border-4 border-black p-4 transform -rotate-1">
                    <h3 className="text-xl font-bold mb-4 text-black transform rotate-1">
                      CRAWL FREQUENCY
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((freq) => (
                        <div 
                          key={freq}
                          className={`border-4 border-black p-3 cursor-pointer text-center transition-colors ${
                            crawlFrequency === freq 
                              ? 'bg-white text-black' 
                              : 'bg-gray-200 hover:bg-gray-300 text-black'
                          }`}
                          onClick={() => setCrawlFrequency(freq)}
                        >
                          <span className="font-bold text-sm">{freq}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm font-mono mt-2 text-black">
                      How often should we check this rival for changes?
                    </p>
                  </div>

                  {/* Notification Settings */}
                  <div className="bg-yellow-400 border-4 border-black p-4 transform rotate-1">
                    <h3 className="text-xl font-bold mb-4 text-black transform -rotate-1">
                      NOTIFICATIONS
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={enableNotifications}
                          onChange={(e) => setEnableNotifications(e.target.checked)}
                          className="w-5 h-5 border-4 border-black"
                        />
                        <span className="font-bold text-black">
                          ENABLE EMAIL NOTIFICATIONS
                        </span>
                      </div>
                      
                      {enableNotifications && (
                        <div>
                          <label className="block font-bold mb-2 text-black">
                            NOTIFICATION FREQUENCY
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['INSTANT', 'DAILY', 'WEEKLY', 'MONTHLY'] as const).map((freq) => (
                              <div 
                                key={freq}
                                className={`border-4 border-black p-2 cursor-pointer text-center transition-colors ${
                                  notificationFreq === freq 
                                    ? 'bg-white text-black' 
                                    : 'bg-gray-200 hover:bg-gray-300 text-black'
                                }`}
                                onClick={() => setNotificationFreq(freq)}
                              >
                                <span className="font-bold text-xs">{freq}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs font-mono mt-2 text-black">
                            {notificationFreq === 'INSTANT' && 'Get notified immediately when changes are detected'}
                            {notificationFreq === 'DAILY' && 'Receive a daily digest of all changes'}
                            {notificationFreq === 'WEEKLY' && 'Get a weekly summary of changes'}
                            {notificationFreq === 'MONTHLY' && 'Monthly summary of all activity'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className="flex-1 bg-green-500 text-white border-4 border-black hover:bg-green-600"
                    >
                      {isUpdating ? 'UPDATING...' : 'SAVE CHANGES'}
                    </Button>
                    
                    <Button 
                      variant="secondary"
                      onClick={onClose}
                      className="flex-1 bg-gray-500 text-white border-4 border-black hover:bg-gray-600"
                    >
                      CANCEL
                    </Button>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-red-500 border-4 border-black p-4 transform -rotate-1">
                    <h3 className="text-xl font-bold mb-4 text-white transform rotate-1">
                      ⚠️ DANGER ZONE
                    </h3>
                    <p className="font-mono text-sm mb-4 text-white">
                      Permanently delete this rival and all associated data. This action cannot be undone.
                    </p>
                    <Button 
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-white text-black border-4 border-black hover:bg-red-100"
                    >
                      DELETE RIVAL
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-red-500 border-4 border-black p-6 text-center transform -rotate-1">
                <div className="transform rotate-1">
                  <h3 className="text-2xl font-bold mb-4 text-white">
                    ⚠️ CONFIRM DELETION
                  </h3>
                  <p className="font-mono text-white mb-6">
                    Are you sure you want to delete <strong>{competitor.name || competitor.url}</strong>?
                    <br /><br />
                    This will permanently remove:
                    <br />• All crawl data
                    <br />• All detected changes
                    <br />• All notifications
                    <br /><br />
                    <strong>THIS CANNOT BE UNDONE!</strong>
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 bg-white text-black border-4 border-black"
                    >
                      {isDeleting ? 'DELETING...' : 'YES, DELETE FOREVER'}
                    </Button>
                    
                    <Button 
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 bg-white text-black border-4 border-black"
                    >
                      CANCEL
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}