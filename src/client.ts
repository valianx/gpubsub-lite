/**
 * @acme/pubsubx - PubSub Client Factory
 */

import { PubSub } from '@google-cloud/pubsub';
import type { PubSubClientOptions } from './types.js';

/**
 * Create a Google Cloud Pub/Sub client with authentication handling
 * 
 * @example
 * ```typescript
 * // Using Application Default Credentials (recommended for GKE)
 * const client = createPubSubClient({
 *   projectId: 'my-project'
 * });
 * 
 * // Using explicit credentials
 * const client = createPubSubClient({
 *   projectId: 'my-project',
 *   keyFilename: './service-account.json'
 * });
 * ```
 */
export function createPubSubClient(options: PubSubClientOptions = {}): PubSub {
  const { projectId, keyFilename, credentials, apiEndpoint, ...rest } = options;

  // Filter out undefined values and pass options to SDK
  const clientConfig: Record<string, unknown> = { ...rest };
  
  if (projectId !== undefined) clientConfig.projectId = projectId;
  if (keyFilename !== undefined) clientConfig.keyFilename = keyFilename;
  if (credentials !== undefined) clientConfig.credentials = credentials;
  if (apiEndpoint !== undefined) clientConfig.apiEndpoint = apiEndpoint;

  return new PubSub(clientConfig);
}
