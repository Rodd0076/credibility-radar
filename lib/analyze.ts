import AsyncStorage from '@react-native-async-storage/async-storage';
import { blink } from './blink';
import type { AnalysesRow } from './db-types';
import { getTier, type Analysis, type AnalysisResult } from './types';

const SYSTEM_PROMPT = `You are an expert linguistic forensics analyst specializing in detecting genuine expertise versus surface-level knowledge in written and spoken communication.

Analyze the provided text using the "Cognitive Friction" matrix with these four weighted dimensions:

1. Technical Specificity (35%): How precise is the terminology? Real experts use domain-specific terms correctly, cite specific tools/frameworks/methodologies, and avoid generic buzzwords. Bluffers use vague jargon like "synergy", "leverage", "paradigm", "ecosystem", "holistic", "innovative", "cutting-edge", "best-in-class", "next-gen", "world-class".

2. Structural Anchoring (25%): Does the text contain hard metrics, specific timelines, named entities, verifiable facts, numbers, dates, percentages, or concrete deliverables? Or only abstract claims?

3. Camouflage Penalty (20%): Identify sentences that are grammatically dense but information-zero — "smoke and mirrors" language. The HIGHER this score, the LESS camouflage (so 100 = no fluff, 0 = pure fluff). Extract specific fluff phrases verbatim.

4. Logical Coherence (20%): Do claims follow a clear cause-and-effect chain? Are arguments supported by evidence? Or are statements disconnected assertions?

Score each dimension 0-100. Provide:
- summary: 1-2 sentence verdict on the speaker's actual knowledge depth
- fluff_phrases: array of 0-5 exact verbatim phrases from the text that are camouflage/buzzwords (empty array if none)
- strengths: array of 0-3 specific elements that demonstrate real expertise (empty array if none)

Be HARSH but fair. Pure buzzword speak should score below 30. Real technical depth with metrics should score above 80.`;

export async function analyzeText(text: string): Promise<AnalysisResult> {
  const { object } = await blink.ai.generateObject({
    prompt: `${SYSTEM_PROMPT}\n\nAnalyze this communication for true knowledge depth. Return all four scores as numbers from 0 to 100.\n\n"""${text}"""`,
    schema: {
      type: 'object',
      properties: {
        technical_score: { type: 'number', minimum: 0, maximum: 100 },
        structural_score: { type: 'number', minimum: 0, maximum: 100 },
        camouflage_score: { type: 'number', minimum: 0, maximum: 100 },
        coherence_score: { type: 'number', minimum: 0, maximum: 100 },
        summary: { type: 'string' },
        fluff_phrases: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
      },
      required: ['technical_score', 'structural_score', 'camouflage_score', 'coherence_score', 'summary', 'fluff_phrases', 'strengths'],
    },
  });

  const r = object as {
    technical_score: unknown;
    structural_score: unknown;
    camouflage_score: unknown;
    coherence_score: unknown;
    summary: unknown;
    fluff_phrases: unknown;
    strengths: unknown;
  };
  const score = (value: unknown) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.round(Math.max(0, Math.min(100, numeric))) : 0;
  };
  const technicalScore = score(r.technical_score);
  const structuralScore = score(r.structural_score);
  const camouflageScore = score(r.camouflage_score);
  const coherenceScore = score(r.coherence_score);
  const overall = Math.round(
    technicalScore * 0.35 +
    structuralScore * 0.25 +
    camouflageScore * 0.20 +
    coherenceScore * 0.20
  );
  const asStringList = (value: unknown, limit: number) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, limit) : [];

  return {
    overall_score: overall,
    technical_score: technicalScore,
    structural_score: structuralScore,
    camouflage_score: camouflageScore,
    coherence_score: coherenceScore,
    tier: getTier(overall),
    summary: typeof r.summary === 'string' ? r.summary : 'The analysis could not produce a written summary.',
    fluff_phrases: asStringList(r.fluff_phrases, 5),
    strengths: asStringList(r.strengths, 3),
  };
}

const LOCAL_ANALYSES_KEY = 'cr_local_analyses';
export const MAX_ANALYSIS_LENGTH = 12000;

export async function getLocalAnalyses(): Promise<Analysis[]> {
  try {
    const stored = await AsyncStorage.getItem(LOCAL_ANALYSES_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed as Analysis[] : [];
  } catch {
    return [];
  }
}

async function storeLocalAnalysis(analysis: Analysis) {
  const existing = await getLocalAnalyses();
  const next = [analysis, ...existing.filter((item) => item.id !== analysis.id)].slice(0, 50);
  await AsyncStorage.setItem(LOCAL_ANALYSES_KEY, JSON.stringify(next));
}

export async function saveAnalysis(
  text: string,
  result: AnalysisResult,
  inputType: 'text' | 'voice' = 'text',
  userId?: string,
): Promise<string | null> {
  const id = `a_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const inputText = text.slice(0, MAX_ANALYSIS_LENGTH);
  const analysis: Analysis = {
    ...result,
    id,
    user_id: userId,
    input_text: inputText,
    input_type: inputType,
    created_at: new Date().toISOString(),
  };

  if (!userId) {
    try {
      await storeLocalAnalysis(analysis);
      return id;
    } catch (error) {
      console.warn('Local analysis save failed:', error);
      return null;
    }
  }

  try {
    await blink.db.table<AnalysesRow>('analyses').create({
      id,
      userId,
      inputText,
      inputType,
      overallScore: result.overall_score,
      technicalScore: result.technical_score,
      structuralScore: result.structural_score,
      camouflageScore: result.camouflage_score,
      coherenceScore: result.coherence_score,
      tier: result.tier,
      summary: result.summary,
      fluffPhrases: JSON.stringify(result.fluff_phrases),
      strengths: JSON.stringify(result.strengths),
      createdAt: analysis.created_at,
    });
    return id;
  } catch (error) {
    console.warn('Cloud analysis save failed; keeping a private device copy:', error);
    try {
      await storeLocalAnalysis(analysis);
      return id;
    } catch (localError) {
      console.warn('Local analysis fallback failed:', localError);
      return null;
    }
  }
}
