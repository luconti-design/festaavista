import type { Api } from '../types';
import { googleApi, hasGoogleScript } from './googleScript';
// This adapter does not silently fall back from a broken production RPC to local data.
export async function createApi(): Promise<Api> {
  if(import.meta.env.MODE==='share-preview')return (await import('./sharePreviewApi')).sharePreviewApi;
  if(hasGoogleScript())return googleApi;
  if(import.meta.env.DEV)return (await import('./localApi')).createLocalApi(import.meta.env.VITE_DATA_MODE==='mock');
  return googleApi;
}
