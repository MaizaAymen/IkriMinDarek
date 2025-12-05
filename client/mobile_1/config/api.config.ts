/**
 * API Configuration
 * 
 * For development:
 * - Web/Browser: Use localhost:4000 (if running on same machine)
 * - Expo/Mobile: Use your machine IP (e.g., 192.168.1.3:4000)
 * 
 * To find your machine IP:
 * Windows: ipconfig | Select-String "IPv4"
 * Mac/Linux: ifconfig | grep inet
 */

import { Platform } from 'react-native';

// Your machine's local IP address (change this if needed)
// Get it from: ipconfig (Windows) or ifconfig (Mac/Linux)
// Using 192.168.1.3 (current Ethernet IP on your local network)
const MACHINE_IP = '192.168.1.3'; // ⚠️ UPDATE THIS if your IP changes

// Backend server port
const BACKEND_PORT = 4000;

// Determine API base URL based on platform
const getAPIBaseURL = (): string => {
  if (Platform.OS === 'web') {
    // For web/browser, use localhost
    return `http://localhost:${BACKEND_PORT}/api`;
  } else {
    // For native (iOS/Android), use machine IP
    return `http://${MACHINE_IP}:${BACKEND_PORT}/api`;
  }
};

export const API_BASE_URL = getAPIBaseURL();
export const SOCKET_URL = Platform.OS === 'web' 
  ? `http://localhost:${BACKEND_PORT}`
  : `http://${MACHINE_IP}:${BACKEND_PORT}`;

console.log('🌐 API Configuration loaded:');
console.log(`   Platform: ${Platform.OS}`);
console.log(`   API URL: ${API_BASE_URL}`);
console.log(`   Socket URL: ${SOCKET_URL}`);
