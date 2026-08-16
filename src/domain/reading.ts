export type LanguageCode = "zh-CN" | "en-US" | "mixed";

export type ResponseForm =
  | "quiet-attention"
  | "gaze"
  | "point"
  | "gesture"
  | "pretend-action"
  | "sound"
  | "word"
  | "phrase"
  | "sentence"
  | "child-initiation";

export type ReasoningSignal =
  | "notice"
  | "label"
  | "count"
  | "compare"
  | "sequence"
  | "cause"
  | "emotion"
  | "perspective"
  | "prediction";

export type EngagementSignal = "continue" | "steady" | "tired" | "turning-away" | "all-done";

export interface InteractionObservation {
  responseForm: ResponseForm;
  language: LanguageCode;
  reasoning?: ReasoningSignal;
  engagement: EngagementSignal;
  reciprocalTurns: number;
  confidence: number;
  source: "parent-confirmed" | "speech-model" | "multimodal-model";
}

export interface InteractionProfile {
  preferredLanguages: LanguageCode[];
  strongestResponseForm: ResponseForm;
  demonstratedReasoning: ReasoningSignal[];
  typicalTurnDepth: number;
  supportNeeded: "independent" | "open-invitation" | "action-model" | "language-model" | "no-demand";
  updatedAt: string;
}

export interface PageOpportunity {
  kind: "notice" | "predict" | "explain" | "count" | "compare" | "emotion" | "pretend";
  groundedDetail: string;
}

export interface PreparedPage {
  pageId: string;
  position: number;
  sourceText?: string;
  storyBeat: string;
  visibleEvidence: string[];
  uncertaintyNotes: string[];
  opportunities: PageOpportunity[];
}

export interface PreparedBook {
  bookId: string;
  title: string;
  sourceLanguage: LanguageCode;
  interactionLanguage: LanguageCode;
  pages: PreparedPage[];
  reviewStatus: "needs-review" | "approved";
}

export type DialogueStrategy =
  | "no-demand-comment"
  | "acknowledge-gesture"
  | "expand-language"
  | "deepen-reasoning"
  | "follow-child"
  | "return-to-story";

export interface DialogueTurn {
  narration: string;
  invitation?: string;
  strategy: DialogueStrategy;
  groundedPageId: string;
  expansionIndex: 0 | 1 | 2;
}
