import { API_BASE, tokenManager } from './baseApi';
import type Hls from 'hls.js';

export function buildHlsManifestUrl(assetId: string, versionNumber: number): string {
  return `${API_BASE}/versions/${assetId}/${versionNumber}/hls/manifest`;
}

// Injects JWT Authorization header for all requests going to our backend.
// Segment requests also hit the backend (no MinIO CORS), so xhrSetup covers all.
export function createHlsXhrSetup(): NonNullable<ConstructorParameters<typeof Hls>[0]>['xhrSetup'] {
  return (xhr: XMLHttpRequest) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
  };
}
