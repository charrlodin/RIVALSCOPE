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

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      {isUpdating ? 'UPDATING...' : 'SAVE CHANGES'}
                    </Button>
                    
                    <Button 
                      variant="secondary"
                      onClick={onClose}
                      className="flex-1"
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