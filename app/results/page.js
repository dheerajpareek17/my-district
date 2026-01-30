
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EditableItinerary from '@/app/components/results/EditableItinerary';

export default function ResultsPage() {
  const router = useRouter();
  const [itineraries, setItineraries] = useState([]);
  const [totalCombinations, setTotalCombinations] = useState(0);
  const [originalRequestData, setOriginalRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get current day of the week
  const getDayOfWeek = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  useEffect(() => {
    // Read from sessionStorage
    const storedData = sessionStorage.getItem('itineraryResults');
    const storedRequest = sessionStorage.getItem('originalRequest');
    
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setItineraries(parsed.itineraries || []);
        setTotalCombinations(parsed.totalCombinations || 0);
      } catch (error) {
        console.error('Error parsing itinerary data:', error);
      }
    }
    
    if (storedRequest) {
      try {
        setOriginalRequestData(JSON.parse(storedRequest));
      } catch (error) {
        console.error('Error parsing request data:', error);
      }
    }
    
    setLoading(false);
  }, []);

  const handleRegenerate = async (payload, itineraryIndex) => {
    try {
      const response = await fetch('/api/plan-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Replace ALL itineraries with new top 4
        if (result.itineraries && result.itineraries.length > 0) {
          setItineraries(result.itineraries);
          setTotalCombinations(result.totalCombinations);
          
          // Update sessionStorage
          sessionStorage.setItem('itineraryResults', JSON.stringify({
            itineraries: result.itineraries,
            totalCombinations: result.totalCombinations
          }));
          
          alert(`✅ Successfully regenerated! Found ${result.totalCombinations} combinations, showing top ${result.itineraries.length}.`);
        }
      } else {
        // Show detailed error message
        const errorMsg = result.details || result.error || 'Failed to regenerate itinerary';
        alert(`❌ ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error regenerating:', error);
      alert(`Network error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-purple-500">Loading your itineraries...</p>
        </div>
      </div>
    );
  }

  if (itineraries.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-purple-500">No itineraries found</p>
          <a href="/plan" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
            ← Back to Planning
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-600 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero - Basic Information (styled similar to District image) */}
        <div className="mb-8">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-gradient-to-br from-purple-600 to-purple-400 text-white p-12 md:p-16">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">Basic Information</h1>
              <p className="text-lg md:text-xl text-purple-100 max-w-3xl">
                Experience the best in Dining, Movies, and Events.
              </p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Your {getDayOfWeek()} in the District
            </h1>
            <p className="text-white">
              Showing top {itineraries.length} out of {totalCombinations} possible itineraries
            </p>
            <a
              href="/plan"
              className="mt-4 inline-block text-white hover:text-purple-200 font-medium"
            >
              ← Plan Another Itinerary
            </a>
        </div>

        {/* Itineraries List */}
        <div className="space-y-6">
          {itineraries.map((item, index) => (
            <EditableItinerary
              key={index}
              itinerary={item}
              index={index}
              totalItineraries={itineraries.length}
              originalData={originalRequestData}
              onRegenerate={handleRegenerate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
