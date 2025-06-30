export type Entity = number;

export class ECSWorld {
  private nextEntityId = 0;
  private components = new Map<string, Map<Entity, unknown>>();

  createEntity(): Entity {
    return this.nextEntityId++;
  }

  addComponent(entity: Entity, data: unknown): void {
    const id = data.constructor.name;
    if (!this.components.has(id)) {
      this.components.set(id, new Map());
    }
    this.components.get(id)?.set(entity, data);
  }

  getComponent<T>(entity: Entity, type: string): T | undefined {
    return this.components.get(type)?.get(entity) as T;
  }

  queryEntities<T1, T2>(type1: string, type2: string): [Entity, T1, T2][] {
    const map1 = this.components.get(type1);
    const map2 = this.components.get(type2);
    if (!map1 || !map2) return [];
    const result: [Entity, T1, T2][] = [];

    for (const [entity, value1] of map1) {
      const value2 = map2.get(entity);
      if (value2) {
        result.push([entity, value1 as T1, value2 as T2]);
      }
    }

    return result;
  }
}
