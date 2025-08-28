const state: Record<any, any> = {};

export function setState(key: any, value: any) {
  state[key] = value;
}

export function getState(key: any) {
  return state[key];
}
