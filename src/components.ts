export const ComponentType = {
    POSITION: 'Position',
    SPRITE: 'SpriteComponent',
    COLLIDER: 'ColliderComponent',
    FOLLOW: 'Follow',
} as const;

export type PositionComponent = {
    x: number;
    y: number;
};

export type SpriteComponent = {
    sheetId: string;
    frameIndex: number;
};

export enum ColliderLayer {
    PLAYER = 0b0001,
    ENEMY = 0b0010,
    OBSTACLE = 0b0100,
};

export type ColliderComponent = {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
    layer: number; // e.g. 0b0001 = player, 0b0010 = enemy
    mask: number;
};

export type FollowComponent = {
    target: any; // @TODO: entity id
    speed: number;
};
