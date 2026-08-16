export interface VoiceReference {
  kind: "locked-mimi" | "consented-parent";
  referenceAudioRef: string;
  consentRecordRef?: string;
}

export interface VoiceRenderRequest {
  utteranceId: string;
  text: string;
  language: "zh-CN";
  voice: VoiceReference;
  delivery: "playful" | "gentle" | "curious" | "excited" | "empathetic";
}

export interface RenderedVoiceAsset {
  utteranceId: string;
  audioRef: string;
  durationMs: number;
  timingRef?: string;
}

export interface CosyVoiceAdapter {
  render(request: VoiceRenderRequest): Promise<RenderedVoiceAsset>;
}

/**
 * Production adapter boundary for CosyVoice 3. Model checkpoints, reference
 * clips, consent records and generated WAV files are confidential runtime data.
 */
export async function renderPreparedDialogue(
  requests: VoiceRenderRequest[],
  adapter: CosyVoiceAdapter,
): Promise<RenderedVoiceAsset[]> {
  const assets: RenderedVoiceAsset[] = [];
  for (const request of requests) assets.push(await adapter.render(request));
  return assets;
}
