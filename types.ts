
export type OceanState = 'CALM' | 'STORMY' | 'CLEAR';

export interface SeaMessage {
  text: string;
  author: string;
}

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}
