export const seed = (init: number): number => {
  const result = init % 2147483647;
  return result <= 0 ? result + 2147483646 : result;
};

export const next = (seed: number) => seed * 16807 % 2147483647;