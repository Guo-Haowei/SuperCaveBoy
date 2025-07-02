import { ECSWorld, Entity } from '../ecs';
import { Animation, ColliderArea, Name, Instance, Position, Sprite, Velocity } from '../components';
import { SpriteSheets } from '../engine/assets-manager';
import { createEnemyCommon, StateMachine, LifeformScript } from './lifeform';
import { AABB, CountDown } from '../engine/utils';

type GuardianStateName = 'idle' | 'alert' | 'targeting' | 'prepare' | 'attack';

const ATTACK_HEIGHT = 250;
const RISING_SPEED = -200; // Speed at which the guardian rises to attack height
const CHASING_SPEED = 300; // Speed at which the guardian chases the target
const ATTACK_SPEED = 700;

class GuardianScript extends LifeformScript {
  private target: Entity;

  private prepareCounter: CountDown = new CountDown(0.5);

  constructor(entity: Entity, world: ECSWorld, target: Entity) {
    super(entity, world);

    this.target = target;

    this.fsm = new StateMachine<GuardianStateName>(
      {
        idle: {
          name: 'idle',
          enter: () => this.playAnim('idle'),
          update: () => this.idle(),
        },
        alert: {
          name: 'alert',
          enter: () => this.playAnim('alert'),
          update: () => this.alert(),
        },
        targeting: {
          name: 'targeting',
          update: () => this.targeting(),
        },
        prepare: {
          name: 'prepare',
          enter: () => this.prepareCounter.reset(),
          update: (dt) => this.prepare(dt),
        },
        attack: {
          name: 'attack',
          update: (dt) => this.attack(dt),
        },
      },
      'alert',
    );
  }

  private idle() {
    // @TODO
  }

  private alert() {
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const { y } = position;
    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    if (y > ATTACK_HEIGHT) {
      vel.vy = RISING_SPEED;
    } else {
      vel.vy = 0;
      this.fsm.transition('targeting');
    }
  }

  private targeting() {
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const { x } = position;
    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);

    const targetPos = this.world.getComponent<Position>(this.target, Position.name);

    const dx = x + 100 - (targetPos.x + 32);
    if (Math.abs(dx) > 10) {
      const xsign = Math.sign(dx);
      vel.vx = -xsign * CHASING_SPEED;
    } else {
      vel.vx = 0;
      this.fsm.transition('prepare'); // Transition back to alert state after targeting
    }
  }

  private prepare(dt: number) {
    if (this.prepareCounter.tick(dt)) {
      this.fsm.transition('attack');
    }
  }

  private attack(dt: number) {
    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    if (this.isGrounded()) {
      vel.vy = 0;
      this.fsm.transition('alert');
    } else {
      vel.vy = ATTACK_SPEED;
    }
  }

  onDie() {
    // do nothing for now
  }

  onHurt(_selfBound: AABB, _otherBound: AABB): void {
    // do nothing for now
  }
}

export function createGuardian(ecs: ECSWorld, x: number, y: number, target: Entity) {
  const area: ColliderArea = {
    width: 130,
    height: 193,
    offsetX: 15,
    offsetY: -5,
  };
  const id = createEnemyCommon(ecs, x, y, area, area, area);

  const anim = new Animation(
    {
      idle: {
        sheetId: SpriteSheets.BOSS_IDLE,
        frames: 2,
        speed: 1,
        loop: true,
      },
      alert: {
        sheetId: SpriteSheets.BOSS_IDLE,
        frames: 2,
        speed: 1,
        loop: true,
      },
    },
    'idle',
  );

  ecs.addComponent(id, new Name('Guardian'));
  ecs.addComponent(id, new Sprite(SpriteSheets.BOSS_IDLE));
  ecs.addComponent(id, anim);

  const script = new GuardianScript(id, ecs, target);
  ecs.addComponent(id, new Instance(script));
  return id;
}

// export class OldMonster {
//   _BossTransition() {
//     if (this.alarm1.activated) this.alarm1._tick();
//     this.sprite = this.handler._getGameAssets().spr_boss[1];
//     if (!this.alarm1.activated) {
//       this._move = this._BossRising;
//       this.hspeed = 0;
//       this.vspeed = 0;
//     }
//     if (!this.takingDamage) this.sprite = this.handler._getGameAssets().spr_boss_damaged;
//     if (this.health <= 0) {
//       this._move = this._BossDying;
//       const exit = new SpecialObject(this.handler, 992, 608, TYPE.EXIT);
//       exit._init();
//       this.handler._getLevel().objects.push(exit);
//     }
//   }

//   _BossDying() {
//     if (this.alarm2.activated) {
//       this.alarm2._tick();
//     }
//     this.sprite = handler._getGameAssets().spr_boss_damaged;
//     this.takingDamage = false;
//     if (this.alpha > 0.1) this.alpha -= 0.03;
//     else {
//       this.alarm2.activated = false;
//     }
//   }

//   _BossRising() {
//     if (this.y > 192) {
//       this.y -= (this.y - 180) / 30;
//       if (this.y < 192) this.y = 192;
//     } else {
//       this._move = this._BossChasing;
//       this.alarm0._init(120);
//       this.takingDamage = true;
//     }
//   }

//   _BossChasing() {
//     if (this.alarm0.activated) this.alarm0._tick();
//     const center = this.x + this.bound.x + this.bound.width / 2,
//       player = this.handler._getPlayer(),
//       pCenter = player.x + player.bound.x + player.bound.width / 2;
//     if (Math.abs(center - pCenter) > 40 && this.alarm0.activated) {
//       this.hspeed = this.x - player.x < 0 ? 1 : -1;
//     } else {
//       this._move = this._BossFalling;
//       this.hspeed = 0;
//     }
//   }
