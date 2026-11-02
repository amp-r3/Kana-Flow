export interface Rng {
  next(): number;
}

export const defaultRng: Rng = {
  next: () => Math.random(),
};
