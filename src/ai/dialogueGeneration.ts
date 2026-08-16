import type {
  DialogueStrategy,
  DialogueTurn,
  InteractionProfile,
  PreparedPage,
} from "../domain/reading";

export interface GroundedDialogueModel {
  generateJson<T>(request: {
    systemRules: string[];
    page: PreparedPage;
    profile: InteractionProfile;
    strategy: DialogueStrategy;
    expansionIndex: 0 | 1 | 2;
  }): Promise<T>;
}

export const childFacingDialogueRules = [
  "Use natural Mandarin Chinese for child-facing interaction.",
  "Keep personal names in their original language.",
  "Ground every visual claim in visibleEvidence.",
  "Ask at most one clear question in a turn.",
  "Treat gestures, pointing, expressions and pretend action as participation.",
  "Never grade pronunciation, diagnose ability or ask the child to perform.",
  "Never say turn the page or narrate interface mechanics.",
  "Never use more than two expansions on one physical spread.",
] as const;

export async function generateGroundedTurn(args: {
  page: PreparedPage;
  profile: InteractionProfile;
  strategy: DialogueStrategy;
  expansionIndex: 0 | 1 | 2;
  model: GroundedDialogueModel;
}): Promise<DialogueTurn> {
  if (args.expansionIndex > 2) {
    throw new Error("A page may not exceed two response expansions.");
  }

  const generated = await args.model.generateJson<Pick<DialogueTurn, "narration" | "invitation">>({
    systemRules: [...childFacingDialogueRules],
    page: args.page,
    profile: args.profile,
    strategy: args.strategy,
    expansionIndex: args.expansionIndex,
  });

  return {
    ...generated,
    strategy: args.strategy,
    groundedPageId: args.page.pageId,
    expansionIndex: args.expansionIndex,
  };
}
