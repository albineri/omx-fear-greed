// app/page.tsx
import { Suspense } from 'react';
import { FearGreedMeter } from '@/src/components/FearGreedMeter';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            OMX Fear & Greed Index
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Ett mått på marknadskänslan på Stockholmsbörsen
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Fear & Greed Meter */}
        <div className="px-4 py-6 sm:px-0">
          <Suspense fallback={
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          }>
            <FearGreedMeter />
          </Suspense>
        </div>

        {/* Description Section */}
        <div className="mt-8 px-4 py-6 bg-white shadow sm:rounded-lg sm:px-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Om OMX Fear & Greed Index
          </h2>
          <p className="text-gray-600">
            Rädsla & Girighet Index är ett verktyg som mäter två av de primära 
            känslorna som driver aktiemarknaden - rädsla och girighet. Indexet 
            beräknas genom att analysera flera marknadsvariabler inklusive 
            prismomentum, volatilitet, handelsvolymer och tekniska indikatorer.
          </p>
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Hur tolkar man indexet?
            </h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
              <li><span className="font-medium">0-20 (Extrem Rädsla):</span> Investerare är överdrivet rädda, ofta ett bra köpläge</li>
              <li><span className="font-medium">20-40 (Rädsla):</span> Investerare är försiktiga</li>
              <li><span className="font-medium">40-60 (Neutral):</span> Marknaden är i balans</li>
              <li><span className="font-medium">60-80 (Girighet):</span> Investerare är optimistiska</li>
              <li><span className="font-medium">80-100 (Extrem Girighet):</span> Marknaden kan vara övervärderad</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}