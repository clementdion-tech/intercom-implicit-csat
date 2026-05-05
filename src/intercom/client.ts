import axios, { AxiosInstance } from 'axios';

export interface IntercomConversation {
  id: string;
  created_at: number;
  updated_at: number;
  source: { type: string; body: string };
  conversation_parts: {
    conversation_parts: Array<{
      id: string;
      part_type: string;
      body: string;
      created_at: number;
      author: { type: string; id: string; name?: string };
    }>;
  };
  conversation_rating?: {
    rating: number;
    remark?: string;
    created_at: number;
    contact: { id: string };
    teammate: { id: string };
  };
  assignee?: { id: string; type: string };
  team_assignee_id?: string;
  tags?: { tags: Array<{ id: string; name: string }> };
  custom_attributes?: Record<string, unknown>;
  state: string;
}

export interface NormalizedMessage {
  role: 'user' | 'admin' | 'bot';
  body: string;
  createdAt: Date;
  authorType: string;
  authorId?: string;
}

let _client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (_client) return _client;
  const token = process.env.INTERCOM_ACCESS_TOKEN;
  if (!token) throw new Error('INTERCOM_ACCESS_TOKEN is not set');

  _client = axios.create({
    baseURL: 'https://api.intercom.io',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Intercom-Version': '2.11',
    },
  });

  return _client;
}

export async function getConversation(conversationId: string): Promise<IntercomConversation> {
  const client = getClient();
  const { data } = await client.get(`/conversations/${conversationId}`);
  return data;
}

export async function listConversations(params: {
  page?: number;
  per_page?: number;
  order?: 'asc' | 'desc';
  sort?: string;
  state?: 'open' | 'closed' | 'snoozed' | 'pending' | 'all';
}): Promise<{ data: IntercomConversation[]; pages: { total_pages: number; page: number } }> {
  const client = getClient();
  const { data } = await client.get('/conversations', { params });
  return data;
}

export function normalizeMessages(conversation: IntercomConversation): NormalizedMessage[] {
  const messages: NormalizedMessage[] = [];

  // Opening message from source
  if (conversation.source?.body) {
    messages.push({
      role: 'user',
      body: stripHtml(conversation.source.body),
      createdAt: new Date(conversation.created_at * 1000),
      authorType: 'user',
    });
  }

  // Conversation parts
  for (const part of conversation.conversation_parts?.conversation_parts ?? []) {
    if (!part.body || part.body.trim() === '') continue;
    if (part.part_type === 'close' || part.part_type === 'open') continue;

    const role: NormalizedMessage['role'] =
      part.author.type === 'user'
        ? 'user'
        : part.author.type === 'bot'
        ? 'bot'
        : 'admin';

    messages.push({
      role,
      body: stripHtml(part.body),
      createdAt: new Date(part.created_at * 1000),
      authorType: part.author.type,
      authorId: part.author.id,
    });
  }

  return messages;
}

export function extractExplicitCsat(conversation: IntercomConversation): number | null {
  const rating = conversation.conversation_rating?.rating;
  if (!rating) return null;
  // Intercom ratings are 1-5; convert to 0-100%
  return Math.round(((rating - 1) / 4) * 100);
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
