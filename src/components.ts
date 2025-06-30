import { ECSWorld, Entity } from './ecs';

export const ComponentType = {
    ANIMATION: 'Animation',
    POSITION: 'Position',
    VELOCITY: 'Velocity',
    SPRITE: 'Sprite',
    COLLIDER: 'Collider',
    SCRIPT: 'Script',
} as const;

export type PositionComponent = {
    x: number;
    y: number;
};

export type VelocityComponent = {
    vx: number;
    vy: number;
};

export type SpriteComponent = {
    sheetId: string;
    frameIndex: number;
};

type AnimationClip = {
    sheetId: string;
    frames: number;
    speed: number; // should finish in seconds
    loop: boolean;
};

export type AnimationComponent = {
    animations: Record<string, AnimationClip>;
    current: string;
    elapsed: number;
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
    mass: number;
};

export abstract class ScriptBase {
    protected entity: Entity;
    protected world: ECSWorld;

    constructor(entity: Entity, world: ECSWorld) {
        this.entity = entity;
        this.world = world;
    }

    onInit?(): void;
    onUpdate?(dt: number): void;
    onCollision?(other: Entity, layer: number): void;
    onDie?(): void;
};

export type ScriptComponent = {
    script: ScriptBase;
};