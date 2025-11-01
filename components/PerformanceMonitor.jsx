'use client';

import { useEffect, useState } from 'react';
import { cache } from '@/utils/cache';

const PerformanceMonitor = ({ enabled = false }) => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    cacheHits: 0,
    totalRequests: 0,
    memoryUsage: 0
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Mesurer le temps de chargement initial
    const loadTime = performance.now();
    setMetrics(prev => ({ ...prev, loadTime: Math.round(loadTime) }));

    // Surveiller les performances
    const interval = setInterval(() => {
      const cacheStats = cache.getStats();
      
      setMetrics(prev => ({
        ...prev,
        cacheHits: cacheStats.size,
        memoryUsage: performance.memory ? 
          Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0
      }));
    }, 2000);

    // Raccourci clavier pour afficher/masquer
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [enabled]);

  if (!enabled || !isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-green-400">⚡ Performance</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Load Time:</span>
          <span className="text-yellow-400">{metrics.loadTime}ms</span>
        </div>
        
        <div className="flex justify-between">
          <span>Cache Entries:</span>
          <span className="text-blue-400">{metrics.cacheHits}</span>
        </div>
        
        {metrics.memoryUsage > 0 && (
          <div className="flex justify-between">
            <span>Memory:</span>
            <span className="text-purple-400">{metrics.memoryUsage}MB</span>
          </div>
        )}
        
        <div className="border-t border-gray-600 pt-1 mt-2">
          <div className="text-gray-400 text-xs">
            Ctrl+Shift+P to toggle
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
