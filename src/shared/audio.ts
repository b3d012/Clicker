function writeString(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function createWavUrl({
  durationMs,
  sampleFn,
}: {
  durationMs: number;
  sampleFn: (timeSeconds: number) => number;
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
    const timeSeconds = index / sampleRate;
    const sample = Math.max(-1, Math.min(1, sampleFn(timeSeconds)));
    view.setInt16(44 + index * bytesPerSample, sample * 0x7fff, true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
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
  return createWavUrl({
    durationMs,
    sampleFn(timeSeconds) {
      const attack = Math.min(1, timeSeconds / 0.01);
      const release = Math.min(1, Math.max(0, (durationMs / 1000 - timeSeconds) / 0.02));
      const envelope = attack * release;
      const wave = Math.sin(timeSeconds * Math.PI * 2 * frequency);
      return wave * volume * envelope;
    },
  });
}

export function createChiptuneLoopUrl(): string {
  const bpm = 120;
  const beatSeconds = 60 / bpm;
  const stepBeats = 0.5;
  const pattern = [
    { lead: 659.25, bass: 164.81 },
    { lead: 783.99, bass: 164.81 },
    { lead: 880, bass: 196 },
    { lead: 783.99, bass: 196 },
    { lead: 659.25, bass: 174.61 },
    { lead: 523.25, bass: 174.61 },
    { lead: 587.33, bass: 196 },
    { lead: 659.25, bass: 196 },
    { lead: 783.99, bass: 164.81 },
    { lead: 880, bass: 164.81 },
    { lead: 987.77, bass: 196 },
    { lead: 880, bass: 196 },
    { lead: 783.99, bass: 174.61 },
    { lead: 659.25, bass: 174.61 },
    { lead: 587.33, bass: 196 },
    { lead: 523.25, bass: 196 },
  ];

  const durationMs = pattern.length * stepBeats * beatSeconds * 1000;
  const stepSeconds = stepBeats * beatSeconds;
  const fadeSeconds = 0.015;

  return createWavUrl({
    durationMs,
    sampleFn(timeSeconds) {
      const loopSeconds = pattern.length * stepSeconds;
      const wrappedTime = timeSeconds % loopSeconds;
      const stepIndex = Math.min(pattern.length - 1, Math.floor(wrappedTime / stepSeconds));
      const stepStart = stepIndex * stepSeconds;
      const stepTime = wrappedTime - stepStart;
      const progress = stepTime / stepSeconds;
      const { lead, bass } = pattern[stepIndex];
      const leadWave = Math.sign(Math.sin(timeSeconds * Math.PI * 2 * lead)) || 1;
      const bassWave = Math.sign(Math.sin(timeSeconds * Math.PI * 2 * bass)) || 1;
      const attack = Math.min(1, stepTime / fadeSeconds);
      const release = Math.min(1, Math.max(0, (stepSeconds - stepTime) / fadeSeconds));
      const envelope = attack * release;
      const swing = progress < 0.5 ? 1 : 0.94;
      return (leadWave * 0.16 + bassWave * 0.08) * envelope * swing;
    },
  });
}
