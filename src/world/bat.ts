import { Rect } from '../math';
import { ECSWorld, Entity } from '../ecs';
import { AnimationComponent, ComponentType, PositionComponent, ScriptBase, VelocityComponent } from '../components';

// @TODO: health system?

export class BatScript extends ScriptBase {
    target: any; // @TODO: entity id

    private speed: number;
    private state: 'idle' | 'chase' = 'idle';

    constructor(entity: Entity, world: ECSWorld) {
        super(entity, world);
        this.speed = 0.07;
    }

    private idle() {
        const player = this.target;
        const position = this.world.getComponent<PositionComponent>(this.entity, ComponentType.POSITION);
        const { x, y } = position;

        const anim = this.world.getComponent<AnimationComponent>(this.entity, ComponentType.ANIMATION);

        if (Math.abs(x - player.x) < 350 && y - 100 < player.y) {
            this.state = 'chase';
            anim.current = 'fly';
            anim.elapsed = 0;
        }
    }

    private chase(dt: number) {
        const player = this.target;
        const position = this.world.getComponent<PositionComponent>(this.entity, ComponentType.POSITION);
        const { x, y } = position;
        const velocity = this.world.getComponent<VelocityComponent>(this.entity, ComponentType.VELOCITY);

        const dx = x - player.x;
        const dy = y - player.y;
        const xsign = Math.abs(dx) > 5 ? Math.sign(dx) : 0;
        const ysign = Math.abs(dy) > 5 ? Math.sign(dy) : 0;

        if (velocity.vx == 0 || velocity.vy == 0) this.speed = 0.1;

        velocity.vx = -xsign * this.speed;
        velocity.vy = -ysign * this.speed;
    }

    onUpdate(dt: number) {
        switch (this.state) {
            case 'idle':
                this.idle();
                break;
            case 'chase':
                this.chase(dt);
                break;
            default:
                throw new Error(`Unknown state: ${this.state}`);
        }
    }
};
