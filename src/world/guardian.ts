import { ECSWorld, Entity } from '../ecs';
import { Animation, Name, Instance, ScriptBase, Sprite, ColliderArea } from '../components';
import { SpriteSheets } from '../engine/assets-manager';
import { createEnemyCommon, StateMachine } from './lifeform';

type GuardianStateName = 'idle' | 'alert';

class GuardianScript extends ScriptBase {
  private target: Entity;
  private speed: number;

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
          update: () => this.idle(),
        },
      },
      'idle',
    );
  }

  private idle() {
    // const position = this.world.getComponent<Position>(this.entity, Position.name);
    // const { x, y } = position;
    // const target = this.world.getComponent<Position>(this.target, Position.name);
  }

  onDie() {
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
