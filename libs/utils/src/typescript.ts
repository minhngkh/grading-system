export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;

export type CustomOmit<T, K extends PropertyKey> = {
  [P in keyof T as Exclude<P, K>]: T[P];
};

export type ExtendEntries<T extends Record<any, any>, U> = {
  [K in keyof T]: T[K] & U;
};

export type Entries<T extends Record<any, any>> = T[keyof T];

function isIn(value: string, arr: string[]): boolean {
  return arr.includes(value);
}