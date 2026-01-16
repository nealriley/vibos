/**
 * OpenCode API Client
 * HTTP client for communicating with the OpenCode server
 */

const { config, safeLog, safeError } = require('./config');

/**
 * Make a request to the OpenCode API
 */
async function opencodeRequest(method, endpoint, body = null) {
  const url = `${config.opencodeUrl}${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`OpenCode API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Check if the OpenCode server is healthy
 */
async function checkServerHealth() {
  try {
    const health = await opencodeRequest('GET', '/global/health');
    return health.healthy === true;
  } catch (e) {
    return false;
  }
}

/**
 * Wait for the server to become ready
 */
async function waitForServer(maxAttempts = 30, intervalMs = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkServerHealth()) {
      safeLog('OpenCode server is ready');
      return true;
    }
    safeLog(`Waiting for OpenCode server... (${i + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  safeError('OpenCode server did not become ready');
  return false;
}

/**
 * Create a new session
 */
async function createSession(title = 'desktop') {
  const session = await opencodeRequest('POST', '/session', { title });
  return session;
}

/**
 * Find a session by title
 */
async function findSessionByTitle(title) {
  const sessions = await opencodeRequest('GET', '/session');
  return sessions.find(s => s.title === title);
}

/**
 * Get or create a session with the given title
 */
async function getOrCreateSession(title = 'desktop') {
  const existing = await findSessionByTitle(title);
  if (existing) {
    safeLog(`Found existing session: ${existing.id} (${title})`);
    return existing;
  }
  const session = await createSession(title);
  safeLog(`Created new session: ${session.id} (${title})`);
  return session;
}

/**
 * Send a message to a session
 */
async function sendMessage(sessionId, text, options = {}) {
  const body = {
    parts: [{ type: 'text', text }],
    ...options
  };
  
  const response = await opencodeRequest('POST', `/session/${sessionId}/message`, body);
  return response;
}

/**
 * Get all messages for a session
 */
async function getSessionMessages(sessionId) {
  return await opencodeRequest('GET', `/session/${sessionId}/message`);
}

/**
 * Abort the current response in a session
 */
async function abortSession(sessionId) {
  return await opencodeRequest('POST', `/session/${sessionId}/abort`);
}

/**
 * Delete a session
 */
async function deleteSession(sessionId) {
  try {
    const url = `${config.opencodeUrl}/session/${sessionId}`;
    const response = await fetch(url, { method: 'DELETE' });
    // Accept 200, 204, or 404 (already deleted) as success
    return response.ok || response.status === 404;
  } catch (e) {
    safeLog('Delete session failed (may not be supported):', e.message);
    return false;
  }
}

module.exports = {
  opencodeRequest,
  checkServerHealth,
  waitForServer,
  createSession,
  findSessionByTitle,
  getOrCreateSession,
  sendMessage,
  getSessionMessages,
  abortSession,
  deleteSession
};
