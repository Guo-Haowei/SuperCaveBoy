import { ECSWorld, Entity } from '../ecs';
import {
  Animation,
  Collider,
  CollisionLayer,
  Position,
  Script,
  ScriptBase,
  Sprite,
  Velocity,
} from '../components';
import { Direction } from '../common';
import { SpriteSheets } from '../assets';

// @TODO: health system?
// @TODO: play sound on hit

class BatScript extends ScriptBase {
  private target: Entity;
  private speed: number;
  private state: 'idle' | 'chase' = 'idle';

  constructor(entity: Entity, world: ECSWorld, target: Entity) {
    super(entity, world);

    this.speed = 70;
    this.target = target;
  }

  private idle() {
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const { x, y } = position;

    const anim = this.world.getComponent<Animation>(this.entity, Animation.name);

    const target = this.world.getComponent<Position>(this.target, Position.name);

    if (Math.abs(x - target.x) < 350 && y - 100 < target.y) {
      this.state = 'chase';
      anim.current = 'fly';
      anim.elapsed = 0;
    }
  }

  private chase() {
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const { x, y } = position;
    const velocity = this.world.getComponent<Velocity>(this.entity, Velocity.name);

    const target = this.world.getComponent<Position>(this.target, Position.name);

    const dx = x - target.x;
    const dy = y - target.y;
    const xsign = Math.abs(dx) > 5 ? Math.sign(dx) : 0;
    const ysign = Math.abs(dy) > 5 ? Math.sign(dy) : 0;

    if (velocity.vx == 0 || velocity.vy == 0) this.speed = 100;

    velocity.vx = -xsign * this.speed;
    velocity.vy = -ysign * this.speed;
  }

  onUpdate(_dt: number) {
    switch (this.state) {
      case 'idle':
        this.idle();
        break;
      case 'chase':
        this.chase();
        break;
      default:
        throw new Error(`Unknown state: ${this.state}`);
    }
  }
}

class SpiderScript extends ScriptBase {
  private target: Entity;
  private state: 'idle' | 'attack' = 'idle';
  private cooldown: number;

  constructor(entity: Entity, world: ECSWorld, target: Entity) {
    super(entity, world);
    this.cooldown = 0;
    this.target = target;
  }

  private idle(dt: number) {
    const targetPos = this.world.getComponent<Position>(this.target, Position.name);
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const { x, y } = position;

    const anim = this.world.getComponent<Animation>(this.entity, Animation.name);

    const dx = x - targetPos.x;
    const dy = y - targetPos.y;

    // always face the target
    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    vel.vx = -Math.sign(dx) * Number.EPSILON;
    if (this.cooldown === 0 && Math.abs(dx) > 100 && Math.abs(dx) < 500 && dy < 300) {
      this.state = 'attack';
      anim.current = 'jump';
      anim.elapsed = 0;

      const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
      vel.vy = -300;
      vel.vx = 250 * -Math.sign(dx);
    }

    this.cooldown -= dt;
    this.cooldown = Math.max(this.cooldown, 0);
  }

  private attack(dt: number) {
    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    const GRAVITY = 500;

    // @TODO: move to gravity
    vel.vy += GRAVITY * dt;
  }

  onUpdate(dt: number) {
    switch (this.state) {
      case 'idle':
        this.idle(dt);
        break;
      case 'attack':
        this.attack(dt);
        break;
      default:
        throw new Error(`Unknown state: ${this.state}`);
    }
  }

  onCollision(_other: Entity, layer: number, dir: number): void {
    if (this.state === 'attack') {
      if (layer === CollisionLayer.OBSTACLE && dir === Direction.UP) {
        this.state = 'idle';
        this.cooldown = 1.5;

        const anim = this.world.getComponent<Animation>(this.entity, Animation.name);
        anim.current = 'idle';
        anim.elapsed = 0;
      }
    }
  }
}

class SnakeScript extends ScriptBase {
  static readonly INITIAL_SPEED = 100;

  private leftBound: number;
  private rightBound: number;

  constructor(entity: Entity, world: ECSWorld, leftBound: number, rightBound: number) {
    super(entity, world);
    this.leftBound = leftBound;
    this.rightBound = rightBound;

    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    vel.vx = SnakeScript.INITIAL_SPEED;
  }

  onUpdate(_dt: number) {
    const position = this.world.getComponent<Position>(this.entity, Position.name);
    const vel = this.world.getComponent<Velocity>(this.entity, Velocity.name);
    const { x } = position;
    if (x <= this.leftBound) {
      vel.vx = SnakeScript.INITIAL_SPEED;
    } else if (x >= this.rightBound) {
      vel.vx = -SnakeScript.INITIAL_SPEED;
    }
  }
}

function createEnemyCommon(
  ecs: ECSWorld,
  x: number,
  y: number,
  hitWidth: number,
  hitHeight: number,
  hitOffsetX = 0,
  hitOffsetY = 0,
) {
  const id = ecs.createEntity();
  const collider = new Collider(
    hitWidth,
    hitHeight,
    CollisionLayer.ENEMY,
    CollisionLayer.PLAYER | CollisionLayer.OBSTACLE,
    10, // mass
    hitOffsetX,
    hitOffsetY,
  );

  ecs.addComponent(id, new Position(x, y));
  ecs.addComponent(id, new Velocity());
  ecs.addComponent(id, collider);
  return id;
}

export function createBat(ecs: ECSWorld, x: number, y: number, target: Entity) {
  const id = createEnemyCommon(ecs, x, y, 48, 35, 10, 15);

  const script = new BatScript(id, ecs, target);
  const anim = new Animation(
    {
      idle: {
        sheetId: SpriteSheets.BAT_IDLE,
        frames: 1,
        speed: 1,
        loop: true,
      },
      fly: {
        sheetId: SpriteSheets.BAT_FLY,
        frames: 5,
        speed: 0.5,
        loop: true,
      },
    },
    'idle',
  );

  ecs.addComponent(id, new Sprite(SpriteSheets.BAT_IDLE));
  ecs.addComponent(id, anim);
  ecs.addComponent(id, new Script(script));
  return id;
}

export function createSpider(ecs: ECSWorld, x: number, y: number, target: Entity) {
  const id = createEnemyCommon(ecs, x, y, 40, 52, 12, 12);

  const script = new SpiderScript(id, ecs, target);

  const anim = new Animation(
    {
      idle: {
        sheetId: SpriteSheets.SPIDER_JUMP,
        frames: 1,
        speed: 1,
        loop: false,
      },
      jump: {
        sheetId: SpriteSheets.SPIDER_JUMP,
        frames: 5,
        speed: 0.5,
        loop: false,
      },
    },
    'idle',
  );

  ecs.addComponent(id, new Sprite(SpriteSheets.SPIDER_JUMP));
  ecs.addComponent(id, anim);
  ecs.addComponent(id, new Script(script));
  return id;
}

export function createSnake(
  ecs: ECSWorld,
  x: number,
  y: number,
  leftBound: number,
  rightBound: number,
) {
  const id = createEnemyCommon(ecs, x, y, 62, 42, 0, 22);

  const anim = new Animation(
    {
      idle: {
        sheetId: SpriteSheets.SNAKE_MOVE,
        frames: 2,
        speed: 1,
        loop: true,
      },
    },
    'idle',
  );

  const script = new SnakeScript(id, ecs, leftBound, rightBound);

  ecs.addComponent(id, new Position(x, y));
  ecs.addComponent(id, new Sprite(SpriteSheets.SNAKE_MOVE));
  ecs.addComponent(id, anim);
  ecs.addComponent(id, new Script(script));
  return id;
}

// export class OldMonster {
//   x: number;
//   y: number;
//   destroyed = false;
//   alpha = 1;
//   sprite: OldSprite;
//   leftBound?: number;
//   rightBound?: number;
//   face: number;
//   hspeed = 0;
//   vspeed = 0;
//   health = 1;

//   constructor(
//     handler,
//     x: number,
//     y: number,
//   ) {
//     this.x = x;
//     this.y = y;

//     this.handler = handler;

//     this.face = face || DIRECTION.LEFT;

//     this.move_animation;

//     this._move;

//     this.takingDamage = true;

//     this.bound;
//     this.music;
//     this.alarm0;
//     this.alarm1;
//     this.alarm2;

//     this.bound = new Rect(15, -5, 130, 193);
//     this.move_animation = new OldAnimation(10, this.handler._getGameAssets().spr_boss);
//     this.sprite = this.handler._getGameAssets().spr_boss[1];
//     this.health = 1;
//     // this.health = 3;
//     this.speed = 6;
//     this.alarm0 = new Alarm(this.handler);
//     this.alarm1 = new Alarm(this.handler);
//     this.alarm2 = new Alarm(this.handler);
//   }

//   _BossIdling() {}

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

//   _BossFalling() {}

//   _setState(state) {
//     this._move = state;
//   }

//   _land() {
//     this._move = this._BossTransition;
//     this.alarm1._init(30);
//   }

//   _tick() {
//     if (this.health <= 0) {
//       this.destroyed = true;
//     }
//     if (this._move) {
//       this.move_animation._tick();
//       this.sprite = this.move_animation._getFrame();
//       if (this.health <= 0 && this.alarm2.activated) {
//         this.destroyed = false;
//       }
//     }
//     if (this._move) this._move();
//     const that = this;
//     if (player.alpha != 1) return;
//     // be destroyed
//     if (
//       downCollision(player, this, function () {
//         player.vspeed = -15;
//         --that.health;
//         if (that.music) that.music.play();
//       })
//     ) {
//     } else {
//       let bound1x = this.bound.x + this.x,
//         bound1y = this.bound.y + this.y,
//         bound2x = player.bound.x + player.x,
//         bound2y = player.bound.y + player.y,
//         xdiff,
//         ydiff;
//       if (bound1x > bound2x) {
//         xdiff = bound1x + this.bound.width - bound2x;
//       } else {
//         xdiff = bound2x + player.bound.width - bound1x;
//       }
//       if (bound1y > bound2y) {
//         ydiff = bound1y + this.bound.height - bound2y;
//       } else {
//         ydiff = bound2y + player.bound.height - bound1y;
//       }
//       if (
//         xdiff + 2 < this.bound.width + player.bound.width &&
//         ydiff + 2 < this.bound.height + player.bound.height
//       )
//         player._damageTrigger(that.x);
//     }

//     // check collision
//     // vertical
//     if (
//       !(this.vspeed < 0 && checkAllCollision(this, this.handler._getObstacles(), upCollision))
//     ) {
//       } else if (this._move === this._BossFalling) {
//         this.y += this.vspeed;
//         this.vspeed += GRAVITY;
//       }
//     }
//     // horizontal
//     if (!checkAllCollision(this, this.handler._getObstacles(), hCollision)) {
//       this.x += this.hspeed * this.speed;
//     }
//   }

// }
