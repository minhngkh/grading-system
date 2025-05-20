export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;

export type CustomOmit<T, K extends PropertyKey> = {
  [P in keyof T as Exclude<P, K>]: T[P];
};
