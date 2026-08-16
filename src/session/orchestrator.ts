import { generateGroundedTurn, type GroundedDialogueModel } from "../ai/dialogueGeneration";
import { chooseAdaptation } from "../adaptation/policy";
import type {
  DialogueTurn,
  InteractionObservation,
  InteractionProfile,
  PreparedPage,
} from "../domain/reading";

export interface SessionContext {
  page: PreparedPage;
  profile: InteractionProfile;
  expansionIndex: 0 | 1 | 2;
}

export async function createNextTurn(args: {
  context: SessionContext;
  observation: InteractionObservation;
  dialogueModel: GroundedDialogueModel;
}): Promise<{ turn?: DialogueTurn; continueStory: boolean; decisionReason: string }> {
  const decision = chooseAdaptation(
    args.context.profile,
    args.observation,
    args.context.expansionIndex,
  );

  if (!decision.shouldContinue) {
    return { continueStory: true, decisionReason: decision.reason };
  }

  const turn = await generateGroundedTurn({
    page: args.context.page,
    profile: args.context.profile,
    strategy: decision.strategy,
    expansionIndex: args.context.expansionIndex,
    model: args.dialogueModel,
  });

  return { turn, continueStory: false, decisionReason: decision.reason };
}
