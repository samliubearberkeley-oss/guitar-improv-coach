import { createClient } from '@insforge/sdk';

const baseUrl = import.meta.env.VITE_INSFORGE_URL;
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY;

if (!baseUrl || !anonKey) {
  console.error('Missing InsForge configuration. Check your .env file.');
}

export const insforge = createClient({
  baseUrl: baseUrl || '',
  anonKey: anonKey || '',
});

export default insforge;


