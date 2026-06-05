function writeString(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

export function createToneUrl({
  frequency,
  durationMs,
  volume = 0.18,
}: {
  frequency: number;
  durationMs: number;
  volume?: number;
}): string {
  const sampleRate = 44_100;
  const frameCount = Math.max(1, Math.floor((sampleRate * durationMs) / 1000));
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + frameCount * bytesPerSample);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + frameCount * bytesPerSample, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, frameCount * bytesPerSample, true);

  for (let index = 0; index < frameCount; index += 1) {
    const phase = (index / sampleRate) * frequency * Math.PI * 2;
    const envelope = Math.sin(Math.min(1, index / (sampleRate * 0.04)) * Math.PI * 0.5);
    const sample = Math.sin(phase) * volume * envelope;
    view.setInt16(44 + index * bytesPerSample, sample * 0x7fff, true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}
