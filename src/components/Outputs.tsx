export const getLedColor = (state: number): string => {
  return state === 1 ? '#22c55e' : '#4a5568';
};

export const getSevenSegSegments = (_state: number): boolean[] => {
  return [false, false, false, false, false, false, false, false];
};
