// =============================================================================
// AquaSentinel AI — Real-Time Data Service Abstraction
// =============================================================================
// Provides a unified interface for real-time data updates.
// Currently supports REST polling. WebSocket support can be added here
// without changing any component code.
//
// USAGE:
//   const rt = new RealtimeService();
//   rt.subscribe('dashboard', (data) => { /* update state */ });
//   rt.start();
//   // later...
//   rt.stop();
//
// WEBSOCKET INTEGRATION (when ready):
//   1. Set VITE_WS_URL in .env
//   2. Uncomment the WebSocket implementation below
//   3. The same subscribe/unsubscribe API works for both polling and WS
// =============================================================================

import { getDashboardData } from './api';
import type { DashboardData } from '../types/api';

type DataCallback = (data: DashboardData) => void;
type ErrorCallback = (error: Error) => void;

export class RealtimeService {
  private callbacks: Map<string, DataCallback> = new Map();
  private errorCallbacks: Map<string, ErrorCallback> = new Map();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private pollIntervalMs: number;

  constructor(pollIntervalMs = 30000) {
    this.pollIntervalMs = pollIntervalMs;
  }

  subscribe(key: string, callback: DataCallback, onError?: ErrorCallback): void {
    this.callbacks.set(key, callback);
    if (onError) this.errorCallbacks.set(key, onError);
  }

  unsubscribe(key: string): void {
    this.callbacks.delete(key);
    this.errorCallbacks.delete(key);
  }

  start(): void {
    if (this.intervalId) return;
    this.poll(); // immediate first poll
    this.intervalId = setInterval(() => this.poll(), this.pollIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setPollInterval(ms: number): void {
    this.pollIntervalMs = ms;
    if (this.intervalId) {
      this.stop();
      this.start();
    }
  }

  private async poll(): Promise<void> {
    try {
      const response = await getDashboardData();
      if (response.success && response.data) {
        this.callbacks.forEach((cb) => cb(response.data));
      }
    } catch (error) {
      this.errorCallbacks.forEach((cb) => cb(error as Error));
    }
  }

  // ─── WebSocket Implementation (uncomment when ready) ────────────────────────
  //
  // private ws: WebSocket | null = null;
  //
  // connectWebSocket(): void {
  //   const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
  //   this.ws = new WebSocket(wsUrl);
  //
  //   this.ws.onmessage = (event) => {
  //     try {
  //       const data = JSON.parse(event.data) as DashboardData;
  //       this.callbacks.forEach((cb) => cb(data));
  //     } catch (error) {
  //       this.errorCallbacks.forEach((cb) => cb(error as Error));
  //     }
  //   };
  //
  //   this.ws.onerror = () => {
  //     this.errorCallbacks.forEach((cb) => cb(new Error('WebSocket error')));
  //   };
  //
  //   this.ws.onclose = () => {
  //     // Auto-reconnect after 5 seconds
  //     setTimeout(() => this.connectWebSocket(), 5000);
  //   };
  // }
  //
  // disconnectWebSocket(): void {
  //   this.ws?.close();
  //   this.ws = null;
  // }
}

// Singleton instance
export const realtimeService = new RealtimeService();
