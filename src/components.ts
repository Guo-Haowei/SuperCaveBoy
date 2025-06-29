export const ComponentType = {
    POSITION: 'Position',
    SPRITE: 'Sprite',
    COLLIDER: 'Collider',
} as const;

export type Position = {
    x: number;
    y: number;
};

export type Sprite = {
    sheetId: string;
    frameIndex: number;
};

export enum ColliderLayer {
    PLAYER = 0b0001,
    ENEMY = 0b0010,
    OBSTACLE = 0b0100,
};

export type Collider = {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
    layer: number; // e.g. 0b0001 = player, 0b0010 = enemy
    mask: number;
};
