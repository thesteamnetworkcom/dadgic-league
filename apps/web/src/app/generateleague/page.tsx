// src/app/generateleague/page.tsx - Updated with Navigation
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Zap, Loader } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  generateLeague, 
  validateLeagueInputs, 
  getSuggestedGamesPerPlayer,
  getPlayersForLeagueCreation 
} from '@dadgic/shared';
import type { Player } from '@dadgic/database';
import AppLayout from '@/components/AppLayout';

function AdminLeagueForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [leagueName, setLeagueName] = useState('');
  const [description, setDescription] = useState('');
  const [gamesPerPlayer, setGamesPerPlayer] = useState(6);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('GenerateLeague: useEffect triggered');
    console.log('GenerateLeague: loading =', loading);
    console.log('GenerateLeague: user =', user);
    
    if (!loading && !user) {
      console.log('GenerateLeague: Redirecting to home - no user found');
      router.push('/');
    } else if (!loading && user && user.role !== 'admin') {
      console.log('GenerateLeague: Redirecting to dashboard - user is not admin');
      router.push('/dashboard');
    } else if (user && user.role === 'admin') {
      console.log('GenerateLeague: Admin user found, loading players...');
      loadPlayers();
    }
  }, [user, loading, router]);

  const loadPlayers = async () => {
    try {
      setIsLoading(true);
      const allPlayers = await getPlayersForLeagueCreation();
      console.log('Loaded players:', allPlayers);
      setPlayers(allPlayers);
    } catch (err: any) {
      console.error('Error loading players:', err);
      setError(err.message || 'Failed to load players');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayerToggle = (player: Player) => {
    setSelectedPlayerIds(prev => {
      const isSelected = prev.includes(player.id);
      if (isSelected) {
        return prev.filter(id => id !== player.id);
      } else {
        return [...prev, player.id];
      }
    });
  };

  const getValidationStatus = () => {
    return validateLeagueInputs(selectedPlayerIds.length, gamesPerPlayer);
  };

  const getSuggestions = () => {
    return getSuggestedGamesPerPlayer(selectedPlayerIds.length);
  };

  const handleSubmit = async () => {
    const validation = getValidationStatus();
    if (!validation.isValid) {
      setError(validation.error!);
      return;
    }

    if (!leagueName.trim()) {
      setError('League name is required');
      return;
    }

    if (!startDate) {
      setError('Start date is required');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const result = await generateLeague({
        name: leagueName,
        description: description || undefined,
        playerIds: selectedPlayerIds,
        startDate,
        endDate: endDate || undefined,
        gamesPerPlayer
      });

      setResult(result);
      
      // Reset form
      setLeagueName('');
      setDescription('');
      setSelectedPlayerIds([]);
      setGamesPerPlayer(6);
      setEndDate('');

    } catch (err: any) {
      setError(err.message || 'Failed to generate league');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <AppLayout showNavigation={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return null; // Will redirect to home
  }

  if (user.role !== 'admin') {
    return null; // Will redirect to dashboard
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-primary-500" />
              <span className="ml-2 text-neutral-300">Loading players...</span>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const validation = getValidationStatus();
  const suggestions = getSuggestions();
  const canSubmit = validation.isValid && leagueName.trim() && startDate && !isGenerating;

  return (
    <AppLayout>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create New League</h1>
          <p className="text-neutral-400">
            Generate balanced pod pairings for your MTG Commander league
          </p>
        </div>

        {/* Success Message */}
        {result && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="font-medium text-green-300">League Generated Successfully!</h3>
            </div>
            <p className="text-green-200 mb-2">
              Created "{result.league.name}" with {result.stats.totalPods} scheduled pods
            </p>
            <div className="text-sm text-green-300">
              <div>League ID: {result.league.id}</div>
              <div>Total Players: {result.stats.totalPlayers}</div>
              <div>Total Pods: {result.stats.totalPods}</div>
              <div>Games per Player: {result.stats.gamesPerPlayer}</div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">League Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  League Name *
                </label>
                <input
                  type="text"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Summer 2025 League"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Player Selection */}
          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">
              Select Players ({selectedPlayerIds.length} selected)
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto bg-neutral-700/50 border border-neutral-600 rounded-lg p-3">
              {players.map(player => (
                <label key={player.id} className="flex items-center space-x-2 cursor-pointer hover:bg-neutral-600/50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedPlayerIds.includes(player.id)}
                    onChange={() => handlePlayerToggle(player)}
                    className="rounded border-neutral-500 text-primary-500 focus:ring-primary-500 focus:ring-offset-neutral-800"
                  />
                  <span className="text-white text-sm truncate">
                    {player.name || player.discord_username}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Games Per Player */}
          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Games Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Games per Player
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={gamesPerPlayer}
                  onChange={(e) => setGamesPerPlayer(Number(e.target.value))}
                  className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                
                {suggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-neutral-400 text-sm mb-2">Suggested values:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map(suggestion => (
                        <button
                          key={suggestion}
                          onClick={() => setGamesPerPlayer(suggestion)}
                          className={`px-3 py-1 text-sm rounded transition-colors ${
                            gamesPerPlayer === suggestion
                              ? 'bg-primary-500 text-white'
                              : 'bg-neutral-600 text-neutral-300 hover:bg-neutral-500'
                          }`}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Configuration Summary
                </label>
                <div className="bg-neutral-700/50 border border-neutral-600 rounded-lg p-3 text-sm">
                  <div className="text-neutral-300">
                    <div>Players: <span className="text-white">{selectedPlayerIds.length}</span></div>
                    <div>Games per Player: <span className="text-white">{gamesPerPlayer}</span></div>
                    <div>Total Slots: <span className="text-white">{selectedPlayerIds.length * gamesPerPlayer}</span></div>
                    <div>Total Pods: <span className="text-white">{Math.floor((selectedPlayerIds.length * gamesPerPlayer) / 4)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Status */}
          <div className={`p-4 rounded-lg border ${
            validation.isValid ? 
              'bg-green-500/20 border-green-500/50 text-green-300' : 
              'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
          }`}>
            <div className="flex items-center gap-2">
              {validation.isValid ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">
                {validation.isValid ? `Will generate ${(selectedPlayerIds.length * gamesPerPlayer) / 4} pods` : validation.error}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generate League
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}

export default AdminLeagueForm;