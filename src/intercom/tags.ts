import axios from 'axios';
import { ScoredConversation } from '../analyzer/scorer';

function getClient() {
  const token = process.env.INTERCOM_ACCESS_TOKEN;
  if (!token) throw new Error('INTERCOM_ACCESS_TOKEN is not set');
  return axios.create({
    baseURL: 'https://api.intercom.io',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Intercom-Version': '2.11',
    },
  });
}

// Cache tag name → id mapping to avoid repeated API calls
const tagCache = new Map<string, string>();

async function getOrCreateTag(client: ReturnType<typeof getClient>, name: string): Promise<string> {
  if (tagCache.has(name)) return tagCache.get(name)!;

  try {
    const { data } = await client.post('/tags', { name });
    tagCache.set(name, data.id);
    return data.id;
  } catch {
    // Tag may already exist — list and find
    const { data: list } = await client.get('/tags');
    const found = list.data?.find((t: { name: string; id: string }) => t.name === name);
    if (found) {
      tagCache.set(name, found.id);
      return found.id;
    }
    throw new Error(`Could not create or find tag: ${name}`);
  }
}

export function buildTagNames(scored: ScoredConversation): string[] {
  const tags: string[] = [];

  // Language tag
  if (scored.language) tags.push(`lang:${scored.language}`);

  // Style tag
  tags.push(`style:${scored.communicationStyle.replace(/_/g, '-')}`);

  // Churn risk tag
  if (scored.churnRisk && scored.churnRisk !== 'none') {
    tags.push(`churn-risk:${scored.churnRisk}`);
  }

  // Conversion tags
  if (scored.conversion === 'converted') tags.push('sentiment:converted');
  if (scored.conversion === 'at_risk') tags.push('sentiment:at-risk');

  // Burst contact
  if (scored.burstCount > 0) tags.push('burst-contact');

  // Implicit CSAT band
  tags.push(`implicit-csat:${scored.label.replace(/_/g, '-')}`);

  return tags;
}

export async function applyTags(
  conversationId: string,
  scored: ScoredConversation
): Promise<void> {
  const client = getClient();
  const tagNames = buildTagNames(scored);

  for (const tagName of tagNames) {
    try {
      const tagId = await getOrCreateTag(client, tagName);
      await client.post('/conversations/tag', {
        id: conversationId,
        taggings: [{ tag_id: tagId, untag: false }],
      });
    } catch (err) {
      // Non-fatal: log and continue
      console.error(`Failed to apply tag "${tagName}" to conversation ${conversationId}:`, err);
    }
  }
}
