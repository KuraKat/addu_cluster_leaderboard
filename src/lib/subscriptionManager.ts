import { onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Game, UnifiedTeamGame, GrandFinalsMatch, Champion } from '@/types/leaderboard';

// Subscription manager to optimize real-time listeners
export class SubscriptionManager {
  private subscriptions: Map<string, Unsubscribe> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private subscriptionStats = {
    totalCreated: 0,
    totalCleanedUp: 0,
    activeListeners: 0
  };

  // Subscribe to multiple collections with a single listener management system
  subscribeToMultiple(
    subscriptions: Array<{
      key: string;
      subscribe: (callback: (data: any) => void) => Unsubscribe;
      callback: (data: any) => void;
    }>
  ): () => void {
    const unsubscribers: Unsubscribe[] = [];

    subscriptions.forEach(({ key, subscribe, callback }) => {
      // Add listener to the set for this key
      if (!this.listeners.has(key)) {
        this.listeners.set(key, new Set());
      }
      
      const listeners = this.listeners.get(key)!;
      if (!listeners.has(callback)) {
        listeners.add(callback);
        this.subscriptionStats.activeListeners++;
      }

      // Only create one Firebase subscription per key
      if (!this.subscriptions.has(key)) {
        const unsubscribe = subscribe((data) => {
          // Notify all listeners for this key
          const currentListeners = this.listeners.get(key);
          if (currentListeners) {
            currentListeners.forEach(listener => {
              try {
                listener(data);
              } catch (error) {
                console.error(`Error in subscription listener for ${key}:`, error);
              }
            });
          }
        });
        this.subscriptions.set(key, unsubscribe);
        this.subscriptionStats.totalCreated++;
        unsubscribers.push(unsubscribe);
      }
    });

    // Return cleanup function
    return () => {
      subscriptions.forEach(({ key, callback }) => {
        const listeners = this.listeners.get(key);
        if (listeners) {
          listeners.delete(callback);
          this.subscriptionStats.activeListeners--;
          
          // If no more listeners, clean up the Firebase subscription
          if (listeners.size === 0) {
            const unsubscribe = this.subscriptions.get(key);
            if (unsubscribe) {
              unsubscribe();
              this.subscriptions.delete(key);
              this.subscriptionStats.totalCleanedUp++;
            }
            this.listeners.delete(key);
          }
        }
      });
    };
  }

  // Subscribe to a single collection (backward compatibility)
  subscribe(key: string, subscribe: (callback: (data: any) => void) => Unsubscribe, callback: (data: any) => void): () => void {
    return this.subscribeToMultiple([{
      key,
      subscribe,
      callback
    }]);
  }

  // Force refresh all subscriptions (for debugging/monitoring)
  refreshAll(): void {
    console.log('Refreshing all subscriptions...');
    // This would trigger all current subscriptions to re-fetch data
    // Implementation depends on the specific subscription services
  }

  // Cleanup all subscriptions
  cleanup(): void {
    this.subscriptions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error during subscription cleanup:', error);
      }
    });
    this.subscriptions.clear();
    this.listeners.clear();
    this.subscriptionStats.activeListeners = 0;
  }

  // Get subscription count for monitoring
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  // Get listener count for monitoring
  getListenerCount(): number {
    return this.subscriptionStats.activeListeners;
  }

  // Get detailed stats for debugging
  getStats() {
    return {
      ...this.subscriptionStats,
      activeSubscriptions: this.subscriptions.size,
      listenerGroups: this.listeners.size
    };
  }

  // Health check for subscriptions
  healthCheck(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for orphaned listeners
    this.listeners.forEach((listeners, key) => {
      if (listeners.size === 0) {
        issues.push(`Orphaned listener group: ${key}`);
      }
    });

    // Check for subscriptions without listeners
    this.subscriptions.forEach((_, key) => {
      if (!this.listeners.has(key) || this.listeners.get(key)!.size === 0) {
        issues.push(`Subscription without listeners: ${key}`);
      }
    });

    return {
      healthy: issues.length === 0,
      issues
    };
  }
}

// Global subscription manager instance
export const subscriptionManager = new SubscriptionManager();
