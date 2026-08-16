import type { LanguageCode, PreparedBook, PreparedPage } from "../domain/reading";

export interface PrivateBookInput {
  bookId: string;
  title: string;
  sourceLanguage: LanguageCode;
  interactionLanguage: LanguageCode;
  orderedPageImageRefs: string[];
  transcript?: string;
}

export interface MultimodalPageAnalysis {
  sourceText?: string;
  storyBeat: string;
  visibleEvidence: string[];
  uncertaintyNotes: string[];
  opportunities: PreparedPage["opportunities"];
}

export interface MultimodalBookModel {
  analyzePage(args: {
    imageRef: string;
    transcript?: string;
    pagePosition: number;
    previousStoryBeat?: string;
  }): Promise<MultimodalPageAnalysis>;
}

/**
 * Converts confidential page images into a reviewable page map. The model sees
 * image references at runtime; book images and extracted text never live here.
 */
export async function prepareBook(
  input: PrivateBookInput,
  model: MultimodalBookModel,
): Promise<PreparedBook> {
  const pages: PreparedPage[] = [];

  for (const [position, imageRef] of input.orderedPageImageRefs.entries()) {
    const analysis = await model.analyzePage({
      imageRef,
      transcript: input.transcript,
      pagePosition: position,
      previousStoryBeat: pages.at(-1)?.storyBeat,
    });

    pages.push({
      pageId: `${input.bookId}-page-${position}`,
      position,
      ...analysis,
    });
  }

  return {
    bookId: input.bookId,
    title: input.title,
    sourceLanguage: input.sourceLanguage,
    interactionLanguage: input.interactionLanguage,
    pages,
    reviewStatus: "needs-review",
  };
}
