'use client';

/**
 * Système de cache simple pour optimiser les performances
 */
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes par défaut
  }

  /**
   * Générer une clé de cache
   */
  generateKey(prefix, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${prefix}${paramString ? `_${paramString}` : ''}`;
  }

  /**
   * Vérifier si une entrée de cache est valide
   */
  isValid(key, ttl = this.defaultTTL) {
    if (!this.cache.has(key)) return false;
    
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return false;
    
    return Date.now() - timestamp < ttl;
  }

  /**
   * Récupérer une valeur du cache
   */
  get(key, ttl = this.defaultTTL) {
    if (this.isValid(key, ttl)) {
      return this.cache.get(key);
    }
    
    // Nettoyer l'entrée expirée
    this.delete(key);
    return null;
  }

  /**
   * Stocker une valeur dans le cache
   */
  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
    
  }

  /**
   * Supprimer une entrée du cache
   */
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  /**
   * Vider tout le cache
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  /**
   * Obtenir des statistiques du cache
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Nettoyer les entrées expirées
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    this.timestamps.forEach((timestamp, key) => {
      if (now - timestamp > this.defaultTTL) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.delete(key));
    return expiredKeys.length;
  }
}

// Instance globale du cache
export const cache = new CacheManager();

/**
 * Hook pour utiliser le cache avec React
 */
export const useCache = (key, fetcher, options = {}) => {
  const { ttl = 5 * 60 * 1000, enabled = true } = options;
  
  const getCachedData = () => {
    if (!enabled) return null;
    return cache.get(key, ttl);
  };

  const setCachedData = (data) => {
    if (enabled) {
      cache.set(key, data, ttl);
    }
  };

  return {
    getCachedData,
    setCachedData,
    clearCache: () => cache.delete(key)
  };
};

/**
 * Fonction utilitaire pour les requêtes avec cache
 */
export const cachedFetch = async (key, fetcher, ttl = 5 * 60 * 1000) => {
  // Vérifier le cache d'abord
  const cached = cache.get(key, ttl);
  if (cached) {
    console.log(`📦 Cache hit: ${key}`);
    return cached;
  }

  // Exécuter la requête
  console.log(`🔄 Cache miss: ${key} - Fetching...`);
  try {
    const data = await fetcher();
    cache.set(key, data, ttl);
    console.log(`✅ Cached: ${key}`);
    return data;
  } catch (error) {
    console.error(`❌ Fetch error for ${key}:`, error);
    throw error;
  }
};

export default cache;
