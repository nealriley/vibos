/**
 * Server-Sent Events Handler
 * Manages SSE subscription for real-time updates from OpenCode
 */

const EventSource = require('eventsource');
const { config, safeLog } = require('./config');

let eventSource = null;
let expectingLocalResponse = false;
let onEventCallback = null;
let onConnectionStatusCallback = null;
let connectionStatus = 'disconnected'; // 'connected' | 'disconnected' | 'reconnecting'

/**
 * Set the callback for handling events
 * @param {Function} callback - Function to call with each event
 */
function setEventCallback(callback) {
  onEventCallback = callback;
}

/**
 * Set the callback for connection status changes
 * @param {Function} callback - Function to call with status ('connected' | 'disconnected' | 'reconnecting')
 */
function setConnectionStatusCallback(callback) {
  onConnectionStatusCallback = callback;
}

/**
 * Update and emit connection status
 */
function updateConnectionStatus(status) {
  if (connectionStatus !== status) {
    connectionStatus = status;
    safeLog('SSE connection status:', status);
    if (onConnectionStatusCallback) {
      onConnectionStatusCallback(status);
    }
  }
}

/**
 * Get current connection status
 */
function getConnectionStatus() {
  return connectionStatus;
}

/**
 * Mark that we're expecting a local response
 * Used for external message detection
 */
function setExpectingLocalResponse(value) {
  expectingLocalResponse = value;
}

/**
 * Get the current expecting local response state
 */
function isExpectingLocalResponse() {
  return expectingLocalResponse;
}

/**
 * Handle an incoming server event
 */
function handleServerEvent(event) {
  if (!onEventCallback) {
    return;
  }
  
  // Check if this is a user message creation event
  // If we weren't expecting a local response, it's an external message
  if (event.type === 'message.created' && event.properties?.info?.role === 'user') {
    const isExternal = !expectingLocalResponse;
    expectingLocalResponse = false; // Reset the flag
    
    // Add isExternal flag to the event
    const enrichedEvent = {
      ...event,
      isExternal
    };
    
    onEventCallback(enrichedEvent);
    return;
  }
  
  // Forward all other events unchanged
  onEventCallback(event);
}

/**
 * Subscribe to OpenCode SSE events
 */
function subscribeToEvents() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  
  updateConnectionStatus('reconnecting');
  
  const url = `${config.opencodeUrl}/event`;
  safeLog('Subscribing to OpenCode events:', url);
  
  eventSource = new EventSource(url);
  
  eventSource.onopen = () => {
    safeLog('SSE connection opened');
    updateConnectionStatus('connected');
  };
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleServerEvent(data);
    } catch (e) {
      // Silently ignore parse errors
    }
  };
  
  eventSource.onerror = () => {
    updateConnectionStatus('disconnected');
    eventSource.close();
    eventSource = null;
    // Reconnect after a delay
    updateConnectionStatus('reconnecting');
    setTimeout(() => subscribeToEvents(), 3000);
  };
}

/**
 * Close the SSE connection
 */
function closeEventSource() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
}

/**
 * Check if SSE is connected
 */
function isConnected() {
  return eventSource !== null && eventSource.readyState === EventSource.OPEN;
}

module.exports = {
  setEventCallback,
  setConnectionStatusCallback,
  getConnectionStatus,
  setExpectingLocalResponse,
  isExpectingLocalResponse,
  subscribeToEvents,
  closeEventSource,
  isConnected
};
