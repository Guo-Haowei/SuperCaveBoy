export const ComponentType = {
    POSITION: 'Position',
    SPRITE: 'Sprite',
} as const;

export type Position = {
    x: number;
    y: number;
};

export type Sprite = {
    sheetId: string;
    frameIndex: number;
};
