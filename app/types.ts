export type Mood = "resting" | "curious" | "listening" | "happy" | "speaking";

export type MimiAsset =
  | "sun-hat"
  | "shells"
  | "beach-ball"
  | "goggles"
  | "ice-cream"
  | "seagull"
  | "sandcastle"
  | "sheep"
  | "cheek-bandage"
  | "toy-train"
  | "broken-truck"
  | "factory-gear"
  | "milk-bottle"
  | "story-book"
  | "blueberries"
  | "bee-flowers"
  | "coin-toss"
  | "cow-horns"
  | "bear-paws"
  | "self-hug"
  | "bike-helmet"
  | "hard-hat"
  | "work-apron"
  | "toothpaste"
  | "cake"
  | "coin-pouch"
  | "toy-drum"
  | "garden-snail"
  | "blackbird-snail"
  | "noise-makers";

export type GeneratedVisualAsset = {
  label: string;
  reuseTags: string[];
  generationPrompt: string;
  placement: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  url?: string;
  reused?: boolean;
};

export type BookVisualBackground = {
  label: string;
  reuseTags: string[];
  preferredExistingSetting: "beach" | "farm" | "study" | null;
  generationPrompt: string;
  url?: string;
  reused?: boolean;
};

export type ReadingScene = {
  theme: string;
  layers: {
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
    depth: "behind" | "front";
    motion?: string;
    attached?: boolean;
  }[];
};

export type StorySpread = {
  visual3D?: { sceneId: string; modelIds: string[] };
  readingScene?: ReadingScene;
  pageId?: string;
  label: string;
  story: string;
  /** Optional girl-companion face while this page is read: happy, sad, surprised, crying, angry, star-eyes. */
  expression?: string;
  invitation: string;
  /** New books use exactly one concise response. */
  response?: string;
  /** Legacy fields remain readable so existing books and audio do not need regeneration. */
  shortResponse?: string;
  detailedResponse?: string;
  /** Zero to two reusable Mimi props selected during book authoring. */
  mimiAssets?: MimiAsset[];
  /** Optional page-specific visual resolved before the book reaches the reader. */
  visualAsset?: GeneratedVisualAsset | null;
};

export type MysteryReward = {
  code: string;
  starCount: number;
  label: string;
  celebration: string;
};

export type DailyProgress = {
  date: string;
  completedBooks: number;
  goalBooks: number;
  totalStars: number;
  rewardRevealed: boolean;
  reward: MysteryReward | null;
};

export type StoryBook = {
  id: string;
  title: string;
  status: string;
  description: string;
  setting: "beach" | "farm" | "study";
  intro: string;
  /** Page expressions were chosen by hand: pages without one keep the calm face. */
  expressionsReviewed?: boolean;
  visualBackground?: BookVisualBackground;
  visualsStatus?: "ready" | "pending";
  pages: StorySpread[];
  /**
   * Base path for narration rendered with an approved Mimi voice profile.
   * Books without approved audio are blocked instead of silently changing voice.
   */
  audioBase?: string;
};

export type SessionEvent = {
  timestamp: string;
  sessionId: string;
  event: string;
  pageIndex?: number;
  pageLabel?: string;
  source?: string;
  speaker?: "mimi" | "parent-recording";
  expansion?: number;
};
