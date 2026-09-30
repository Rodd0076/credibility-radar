import { useQuery } from '@tanstack/react-query';
import { blink } from '@/lib/blink';
import { getLocalAnalyses } from '@/lib/analyze';
import type { AnalysesRow, SampleAnalysesRow } from '@/lib/db-types';
import type { Analysis, SampleAnalysis } from '@/lib/types';
import { useAuth } from './useAuth';

function tryParse(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapAnalysis(row: AnalysesRow): Analysis {
  return {
    id: row.id,
    user_id: row.userId ?? undefined,
    input_text: row.inputText,
    input_type: row.inputType === 'voice' ? 'voice' : 'text',
    overall_score: Number(row.overallScore) || 0,
    technical_score: Number(row.technicalScore) || 0,
    structural_score: Number(row.structuralScore) || 0,
    camouflage_score: Number(row.camouflageScore) || 0,
    coherence_score: Number(row.coherenceScore) || 0,
    tier: row.tier as Analysis['tier'],
    summary: row.summary ?? '',
    fluff_phrases: tryParse(row.fluffPhrases),
    strengths: tryParse(row.strengths),
    created_at: row.createdAt ?? new Date(0).toISOString(),
  };
}

export function useSamples() {
  return useQuery<SampleAnalysis[]>({
    queryKey: ['samples'],
    queryFn: async () => {
      const rows = await blink.db.table<SampleAnalysesRow>('sample_analyses').list({
        orderBy: { overallScore: 'desc' },
        limit: 50,
      });
      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        excerpt: row.excerpt,
        full_text: row.fullText,
        overall_score: Number(row.overallScore) || 0,
        tier: row.tier as SampleAnalysis['tier'],
      }));
    },
  });
}

export function useHistory() {
  const { user, loading } = useAuth();
  return useQuery<Analysis[]>({
    queryKey: ['analyses', user?.id ?? 'guest'],
    enabled: !loading,
    queryFn: async () => {
      const localRows = (await getLocalAnalyses())
        .filter((row) => user?.id ? row.user_id === user.id : !row.user_id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));

      if (!user?.id) return localRows;

      try {
        const rows = await blink.db.table<AnalysesRow>('analyses').list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          limit: 50,
        });
        const combined = [...localRows, ...rows.map(mapAnalysis)];
        return [...new Map(combined.map((row) => [row.id, row])).values()]
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .slice(0, 50);
      } catch (error) {
        if (localRows.length) return localRows;
        throw error;
      }
    },
  });
}
