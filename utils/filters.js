export const PRESETS = {
  off: null,
  bass: "bass=g=8:f=110",
  treble: "treble=g=5:f=4000",
  vocal: "equalizer=f=2500:t=q:w=1:g=3",
  night: "acompressor=threshold=0.125:ratio=3:attack=20:release=250",
  rock: "bass=g=5:f=100,equalizer=f=1000:t=q:w=1:g=2,treble=g=3:f=6000",
  pop: "bass=g=3:f=100,equalizer=f=3000:t=q:w=1:g=2",
  classical: "equalizer=f=200:t=q:w=1:g=1,treble=g=2:f=8000",
};

export function buildFilter(volume = 0.8, preset = "off", bass = 0, treble = 0) {
  volume = Math.max(0.0, Math.min(Number(volume), 2.0));
  bass = Math.max(-10.0, Math.min(Number(bass), 15.0));
  treble = Math.max(-10.0, Math.min(Number(treble), 10.0));

  const filters = [`volume=${volume}`];

  if (bass) filters.push(`bass=g=${bass}:f=110`);
  if (treble) filters.push(`treble=g=${treble}:f=4000`);

  const presetFilter = PRESETS[preset];
  if (presetFilter) filters.push(presetFilter);

  filters.push("alimiter=limit=0.95");

  return filters.join(",");
}