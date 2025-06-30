export type Entity = number;

export class ECSWorld {
    private nextEntityId = 0;
    private components: Map<string, Map<Entity, unknown>> = new Map();

    createEntity(): Entity {
        return this.nextEntityId++;
    }

    addComponent<T>(entity: Entity, componentName: string, data: T): void {
        if (!this.components.has(componentName)) {
            this.components.set(componentName, new Map());
        }
        this.components.get(componentName)!.set(entity, data);
    }

    getComponent<T>(entity: Entity, componentName: string): T | undefined {
        return this.components.get(componentName)?.get(entity) as T;
    }

    queryEntities(componentNames: string[]): Entity[] {
        const sets = componentNames.map(name => this.components.get(name));
        if (!sets) return [];

        const [first, ...rest] = sets as Map<Entity, unknown>[];
        return [...first.keys()].filter(entity =>
            rest.every(set => set.has(entity))
        );
    }
};
