import { Centrifuge } from "centrifuge";
import type { TypedWSEvent, WSEventType } from "../types/events";

export type RealtimeHandler = (event: TypedWSEvent) => void;

type InternalHandler = (event: { type: string; [k: string]: unknown }) => void;

let globalClient: Centrifuge | null = null;
let globalSubscriptions: Map<string, Set<InternalHandler>> = new Map();
let isConnected = false;
let currentWorkspaceId: string | null = null;
let reconnectCallbacks: Set<() => void> = new Set();
let connectAttempted = false;
let connectionFailed = false;

function centrifugoWsUrl(): string {
  if (typeof window !== "undefined") {
    return (
      (window as any).__VITE_OPENZOO_CENTRIFUGO_WS ||
      "ws://localhost:8000/connection/websocket"
    );
  }
  return "ws://localhost:8000/connection/websocket";
}

export function connectGlobal(workspaceId: string) {
  if (globalClient && isConnected && currentWorkspaceId === workspaceId) return;

  if (globalClient && currentWorkspaceId !== workspaceId) {
    disconnectGlobal();
  }

  currentWorkspaceId = workspaceId;
  globalClient = new Centrifuge(centrifugoWsUrl(), {
    maxReconnectDelay: 10000,
    maxServerPingDelay: 10000,
    minReconnectDelay: 1000,
    reconnect: 3,
  });

  globalClient.on("error", (ctx) => {
    if (!connectionFailed) {
      console.warn("[Centrifugo] connection failed - realtime updates disabled. Start Centrifugo on port 8000 to enable.");
      connectionFailed = true;
    }
  });
  globalClient.on("disconnected", (ctx) => {
    isConnected = false;
    if (ctx.code === 3500) {
      console.warn("[Centrifugo] max reconnect attempts reached - giving up");
      disconnectGlobal();
    }
  });
  globalClient.on("connected", () => {
    const wasReconnect = !isConnected;
    isConnected = true;
    connectionFailed = false;
    if (wasReconnect && reconnectCallbacks.size > 0) {
      reconnectCallbacks.forEach((cb) => cb());
    }
  });

  const channel = `workspace:${workspaceId}`;
  const sub = globalClient.newSubscription(channel);
  sub.on("publication", (ctx) => {
    const data = ctx.data as { type: string; [k: string]: unknown };
    const handlers = globalSubscriptions.get(channel);
    if (handlers) {
      handlers.forEach((h) => h(data));
    }
  });
  sub.subscribe();
  globalClient.connect();
  connectAttempted = true;
}

export function onReconnect(callback: () => void): () => void {
  reconnectCallbacks.add(callback);
  return () => {
    reconnectCallbacks.delete(callback);
  };
}

export function subscribeGlobal(
  workspaceId: string,
  handler: InternalHandler
): () => void {
  const channel = `workspace:${workspaceId}`;
  if (!globalSubscriptions.has(channel)) {
    globalSubscriptions.set(channel, new Set());
  }
  globalSubscriptions.get(channel)!.add(handler);
  connectGlobal(workspaceId);
  return () => {
    globalSubscriptions.get(channel)?.delete(handler);
  };
}

export function disconnectGlobal() {
  if (globalClient) {
    globalClient.disconnect();
    globalClient = null;
    isConnected = false;
    connectionFailed = false;
    connectAttempted = false;
    currentWorkspaceId = null;
    globalSubscriptions.clear();
  }
}

export class OpenZooRealtimeClient {
  private workspaceId: string;
  private unsub: (() => void) | null = null;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  subscribe(channel: string, handler: InternalHandler) {
    this.unsub = subscribeGlobal(this.workspaceId, handler);
    return this.unsub;
  }

  connect() {
    connectGlobal(this.workspaceId);
  }

  disconnect() {
    this.unsub?.();
  }
}

export type TypedEventHandler<T extends WSEventType = WSEventType> = (
  event: TypedWSEvent<T>
) => void;

const wsEventListeners: Map<WSEventType, Set<TypedEventHandler>> = new Map();

export function useWSEvent<T extends WSEventType>(
  eventType: T,
  handler: TypedEventHandler<T>
): () => void {
  if (!wsEventListeners.has(eventType)) {
    wsEventListeners.set(eventType, new Set());
  }
  const typedHandler = handler as TypedEventHandler;
  wsEventListeners.get(eventType)!.add(typedHandler);
  return () => {
    wsEventListeners.get(eventType)?.delete(typedHandler);
  };
}

export function dispatchWSEvent(event: TypedWSEvent) {
  const handlers = wsEventListeners.get(event.type as WSEventType);
  if (handlers) {
    handlers.forEach((h) => h(event));
  }
}
