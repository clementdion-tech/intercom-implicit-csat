import Anthropic from '@anthropic-ai/sdk';
import { extractPreSignals } from './signals';
import { detectBursts, calculateBurstPenalty, interpretBursts } from './burst-detector';
import { normalizeClaudeResponse, ScoredConversation } from './scorer';
import { getCulturalProfile } from '../config/cultural-calibration';
import { analyzeVader } from './vader';
import { analyzeEmotions } from './emotion';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface IntercomMessage {
  role: 'user' | 'admin' | 'bot';
  body: string;
  createdAt: Date;
  author?: { type: string; name?: string };
}

export interface ConversationInput {
  intercomId: string;
  messages: IntercomMessage[];
  explicitCsatScore?: number | null;
  agentId?: string;
  teamId?: string;
}

const SYSTEM_PROMPT = `You are a world-class customer experience linguist and behavioral psychologist specialized in implicit sentiment detection across all human languages and cultures.

Analyze the customer messages provided. You must:
1. Detect language(s) and apply culturally-calibrated sentiment norms
2. Extract signals from punctuation, typography, lexical choices, communication style
3. Analyze behavioral patterns from message timing and length progression
4. Classify dominant communication style
5. Score each customer message and the overall conversation

ALL SCORES MUST BE PERCENTAGES (0-100). Never return a 1-5 scale.
Apply cultural calibration: a terse German message scores differently than a terse Japanese message. Understand what deviation from cultural norm signals.

Communication styles to classify:
- passive_aggressive: "fine", "whatever", sarcasm, over-polite masking frustration
- direct_aggressive: profanity, explicit threats, escalation demands
- anxious_urgent: ASAP, urgent, over-explaining, reassurance-seeking
- disengaged_resigned: monosyllabic replies, declining length, "I'll figure it out myself"
- genuinely_positive: unprompted praise, humor, personal details, warmth
- neutral_transactional: professional, task-focused, no strong sentiment signals

Agent empathy signals to detect (in agent/bot messages only):
- acknowledged_frustration: agent explicitly recognized customer distress ("I understand this is frustrating")
- validated_emotion: agent normalized the customer's emotional response
- personalized_response: agent used customer name or referenced their specific situation
- de_escalation: agent actively lowered emotional temperature
- proactive_followup: agent offered next steps or follow-up unprompted
- genuine_apology: sincere apology (not just "sorry for the inconvenience")
- active_listening: agent reflected back or summarized customer's issue accurately

Missed opportunity signals:
- generic_closing: "Is there anything else I can help you with today?" without personalization
- no_empathy_opening: jumped straight to solution without acknowledgment
- dismissive_language: minimized customer concern
- blame_shift: implied fault on customer side
- robotic_tone: clearly templated/scripted, no human warmth

Agent empathy scoring:
- 80-100: Multiple strong empathy signals, felt heard and valued
- 60-79: Some acknowledgment but inconsistent
- 40-59: Technically helpful but emotionally neutral
- 20-39: Mostly transactional, missed obvious empathy opportunities
- 0-19: Dismissive or tone-deaf responses

Respond ONLY with a valid JSON object using this exact structure (no markdown, no explanation):
{
  "language_detected": "fr",
  "languages_all": ["fr", "en"],
  "code_switching_detected": true,
  "code_switching_signal": "Customer switched to English when frustrated",
  "communication_style": {
    "primary": "passive_aggressive",
    "secondary": "anxious_urgent",
    "style_confidence": 0.85,
    "key_evidence": "one sentence describing the key evidence"
  },
  "behavioral_signals": {
    "message_bursts": [{"at_message_index": 3, "messages_in_burst": 4, "window_seconds": 90}],
    "burst_interpretation": "Customer burst mid-conversation after receiving first response",
    "length_trajectory": "decreasing",
    "repeat_friction_detected": true,
    "repeat_friction_phrases": ["as I already told you"],
    "disengagement_detected": false
  },
  "message_analysis": [
    {
      "index": 0,
      "role": "customer",
      "language": "fr",
      "score_pct": 32,
      "confidence": 0.85,
      "signals": {
        "punctuation": ["ellipsis_resignation"],
        "typography": [],
        "lexical": ["sarcasm_marker", "passive_aggressive_politeness"],
        "behavioral": [],
        "cultural_note": "French ellipsis here indicates passive resignation"
      }
    }
  ],
  "conversation_arc": {
    "type": "rescued",
    "rescue_moments": [],
    "drop_moments": [],
    "turning_point_message": 5
  },
  "overall": {
    "score_pct": 38,
    "label": "dissatisfied",
    "emoji": "😞",
    "confidence": 0.88,
    "conversion": "converted",
    "conversion_delta_pct": 32,
    "score_start_pct": 18,
    "score_end_pct": 50,
    "cultural_calibration_applied": "French passive-aggressive register applied",
    "key_signal_summary": "one sentence summary of dominant signals driving the score",
    "churn_risk": "high",
    "churn_signals": ["disengagement_pattern", "unresolved_repeat_contact"]
  },
  "agent_empathy": {
    "score_pct": 72,
    "signals": ["acknowledged_frustration", "validated_emotion", "personalized_response", "de_escalation", "proactive_followup"],
    "missed_opportunities": ["generic_closing", "no_empathy_opening"],
    "summary": "Agent validated customer frustration but used a generic closing with no follow-through offer"
  }
}`;

export async function analyzeConversation(
  input: ConversationInput
): Promise<ScoredConversation> {
  const { messages: rawMessages, intercomId } = input;
  // Cap transcript length to control token cost — keep last 20 messages (most recent are most predictive)
  const messages = rawMessages.length > 20 ? rawMessages.slice(-20) : rawMessages;

  // Pre-process signals for context
  const preSignals = extractPreSignals(
    messages.map(m => ({ role: m.role, body: m.body }))
  );

  const burstMessages = messages.map((m, i) => ({
    role: m.role,
    body: m.body,
    createdAt: m.createdAt,
    index: i,
  }));
  const bursts = detectBursts(burstMessages);
  const burstPenalty = calculateBurstPenalty(bursts);
  const burstInterpretation = interpretBursts(bursts);

  const indexedMessages = messages.map((m, i) => ({ role: m.role, body: m.body, index: i }));
  const vader = analyzeVader(indexedMessages);
  const emotions = analyzeEmotions(indexedMessages);

  // Build conversation transcript for Claude
  const transcript = messages
    .map((m, i) => {
      const roleLabel = m.role === 'admin' ? 'Agent' : m.role === 'bot' ? 'Bot' : 'Customer';
      const ts = m.createdAt.toISOString();
      return `[${i}] ${roleLabel} (${ts}): ${m.body}`;
    })
    .join('\n');

  const userContent = `Conversation ID: ${intercomId}
Pre-detected signals:
- Burst contacts: ${bursts.length} (${burstInterpretation})
- Burst score penalty: ${burstPenalty}% (already factored, incorporate this)
- Repeat friction detected: ${preSignals.hasRepeatFriction} (phrases: ${preSignals.repeatFrictionPhrases.join(', ') || 'none'})
- Escalation demands: ${preSignals.hasEscalationDemands} (phrases: ${preSignals.escalationPhrases.join(', ') || 'none'})
- All caps detected: ${preSignals.hasAllCaps}
- Repeated punctuation: ${preSignals.hasRepeatedPunctuation}
- Passive-aggressive markers: ${preSignals.hasPassiveAggressive} (phrases: ${preSignals.passiveAggressivePhrases.join(', ') || 'none'})
- Urgency markers: ${preSignals.hasUrgencyMarkers}
- Length trajectory: ${preSignals.messageLengthTrajectory}
- Monosyllabic after frustration: ${preSignals.monosyllabicAfterFrustration}
${input.explicitCsatScore !== null && input.explicitCsatScore !== undefined ? `- Explicit CSAT provided (for reference only, do NOT use in scoring): ${input.explicitCsatScore}` : ''}
- VADER sentiment — customer overall: ${vader.customer.compound.toFixed(2)} (${vader.customer.trajectory}), first-half: ${vader.customer.firstHalfCompound.toFixed(2)}, second-half: ${vader.customer.secondHalfCompound.toFixed(2)}
- VADER sentiment — agent overall: ${vader.agent.compound.toFixed(2)}, empathy gap: ${vader.speakerSentimentGap.toFixed(2)} (positive = agent warmer than customer)
- VADER negative peaks at message indices: ${vader.customer.negativePeakIndices.join(', ') || 'none'}
- VADER positive peaks at message indices: ${vader.customer.positivePeakIndices.join(', ') || 'none'}
- Customer emotion profile: dominant=${emotions.customer.overall.dominant} (intensity ${emotions.customer.overall.intensity.toFixed(2)}), frustration=${emotions.customer.frustrationScore.toFixed(2)}, satisfaction=${emotions.customer.satisfactionScore.toFixed(2)}
- Customer emotion arc: ${emotions.customer.arc.join(' → ') || 'neutral'}
- Customer emotion shifts: ${emotions.customer.emotionShifts}
- Agent emotion profile: dominant=${emotions.agent.overall.dominant}, warmth=${emotions.agent.warmthScore.toFixed(2)}, anxiety=${emotions.agent.anxietyScore.toFixed(2)}

Conversation transcript:
${transcript}

Analyze ONLY the customer messages for sentiment. The agent/bot messages provide context for understanding customer reactions.`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userContent }],
  } as any)) as Anthropic.Message;

  const rawText =
    response.content[0].type === 'text' ? response.content[0].text : '';

  // Strip any markdown code fences if Claude wrapped the JSON
  const jsonText = rawText.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new Error(
      `Claude returned non-JSON response for conversation ${intercomId}: ${rawText.slice(0, 200)}`
    );
  }

  const scored = normalizeClaudeResponse(parsed);

  // Apply cultural neutral baseline adjustment
  const profile = getCulturalProfile(scored.language);
  const adjustedScore = Math.min(100, Math.max(0, scored.scorePct + profile.neutralBaseline));

  return {
    ...scored,
    scorePct: adjustedScore,
    burstCount: bursts.length,
    burstInterpretation,
  };
}
