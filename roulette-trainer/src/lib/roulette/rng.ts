/**
 * Random number sources. Every RNG returns uniform integers in [0, n).
 *
 * - `cryptoRng` uses the Web Crypto API with rejection sampling so that
 *   every pocket is exactly equally likely (no modulo bias).
 * - `seededRng` is a deterministic PRNG (sfc32) used for reproducible
 *   simulations and tests. It is NOT used to decide live game outcomes.
 */
export interface Rng {
  nextInt(n: number): number;
  /** Uniform float in [0, 1). */
  next(): number;
}

const UINT32_RANGE = 0x1_0000_0000;

export function cryptoRng(): Rng {
  const buf = new Uint32Array(1);
  const draw = () => {
    globalThis.crypto.getRandomValues(buf);
    return buf[0];
  };
  return {
    nextInt(n: number) {
      if (!Number.isInteger(n) || n <= 0) throw new RangeError("n must be a positive integer");
      const limit = UINT32_RANGE - (UINT32_RANGE % n);
      let x = draw();
      while (x >= limit) x = draw();
      return x % n;
    },
    next() {
      return draw() / UINT32_RANGE;
    },
  };
}

/** Hash an arbitrary string/number seed into a 32-bit integer (xmur3). */
export function hashSeed(seed: string | number): number {
  const str = String(seed);
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** Deterministic sfc32 generator. Same seed => same sequence. */
export function seededRng(seed: string | number): Rng {
  let a = hashSeed(`${seed}:a`);
  let b = hashSeed(`${seed}:b`);
  let c = hashSeed(`${seed}:c`);
  let d = hashSeed(`${seed}:d`);
  const nextU32 = () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return t >>> 0;
  };
  for (let i = 0; i < 12; i++) nextU32(); // warm-up
  return {
    nextInt(n: number) {
      if (!Number.isInteger(n) || n <= 0) throw new RangeError("n must be a positive integer");
      const limit = UINT32_RANGE - (UINT32_RANGE % n);
      let x = nextU32();
      while (x >= limit) x = nextU32();
      return x % n;
    },
    next() {
      return nextU32() / UINT32_RANGE;
    },
  };
}
