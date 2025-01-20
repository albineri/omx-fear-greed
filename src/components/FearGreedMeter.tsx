'use client'

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { IndexData, SentimentLevel } from '@/types';

const getSentimentColor = (value: number): string => {
  if (value >= 80) return '#2aad27';  // Dark green
  if (value >= 60) return '#72cc54';  // Light green
  if (value >= 40) return '#f7c325';  // Yellow
  if (value >= 20) return '#e06c6c';  // Light red
  return '#c52828';  // Dark red
};

const getSentimentLabel = (value: number): SentimentLevel => {
  if (value >= 80) return 'Extrem Girighet';
  if (value >= 60) return 'Girighet';
  if (value >= 40) return 'Neutral';
  if (value >= 20) return 'Rädsla';
  return 'Extrem Rädsla';
};

export function FearGreedMeter() {
  const [data, setData] = useState<IndexData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/index');
        if (!response.ok) throw new Error('Failed to fetch data');
        const json = await response.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError('Could not load market data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Fetch new data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 bg-red-50 text-red-600 rounded-lg">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const sentimentColor = getSentimentColor(data.currentIndex);
  const sentimentLabel = getSentimentLabel(data.currentIndex);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      {/* Sentiment Meter */}
      <div className="relative h-24 mb-8">
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-red-600 via-yellow-400 to-green-600"
            style={{
              background: `linear-gradient(to right,
                #c52828 0%,
                #c52828 20%,
                #e06c6c 20%,
                #e06c6c 40%,
                #f7c325 40%,
                #f7c325 60%,
                #72cc54 60%,
                #72cc54 80%,
                #2aad27 80%,
                #2aad27 100%
              )`
            }}
          />
        </div>
        
        {/* Animated pointer */}
        <motion.div 
          className="absolute top-0 w-1 h-full bg-black"
          initial={{ left: '50%' }}
          animate={{ left: `${data.currentIndex}%` }}
          transition={{ type: "spring", stiffness: 100 }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-sm text-gray-600 mb-6">
        <span>Extrem Rädsla</span>
        <span>Rädsla</span>
        <span>Neutral</span>
        <span>Girighet</span>
        <span>Extrem Girighet</span>
      </div>

      {/* Current Value and Sentiment */}
      <div className="text-center">
        <h2 
          className="text-6xl font-bold mb-2"
          style={{ color: sentimentColor }}
        >
          {data.currentIndex}
        </h2>
        <p 
          className="text-2xl font-semibold"
          style={{ color: sentimentColor }}
        >
          {sentimentLabel}
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Senast Uppdaterad: {new Date(data.timestamp).toLocaleString('sv-SE')}
        </p>
      </div>
    </div>
  );
}