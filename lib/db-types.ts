// Auto-generated from your database schema — do not edit by hand.
// Regenerates automatically whenever a table is created or altered.

export type AnalysesRow = {
  id: string
  userId: string | null
  inputText: string
  inputType: string
  overallScore: number | string
  technicalScore: number | string
  structuralScore: number | string
  camouflageScore: number | string
  coherenceScore: number | string
  tier: string
  summary: string | null
  fluffPhrases: string | null
  strengths: string | null
  createdAt: string | null
}

export type SampleAnalysesRow = {
  id: string
  title: string
  category: string
  excerpt: string
  fullText: string
  overallScore: number | string
  tier: string
  createdAt: string | null
}

export type UsersRow = {
  id: string
  email: string
  emailVerified: number | string | null
  displayName: string | null
  avatarUrl: string | null
  phone: string | null
  phoneVerified: number | string | null
  role: string | null
  metadata: string | null
  createdAt: string
  updatedAt: string
  lastSignIn: string
}
