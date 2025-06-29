export type Entity = number;

export class ECSWorld {
    private nextEntityId = 0;
    private components: Map<string, Map<Entity, any>> = new Map();

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
        return this.components.get(componentName)?.get(entity);
    }

    queryEntities(componentNames: string[]): Entity[] {
        const sets = componentNames.map(name => this.components.get(name));
        if (!sets) return [];

        const [first, ...rest] = sets as Map<Entity, any>[];
        return [...first.keys()].filter(entity =>
            rest.every(set => set.has(entity))
        );
    }
};


// function RenderSystem(world: ECSWorld, spriteManager: SpriteManager, ctx: CanvasRenderingContext2D) {
//     for (const entity of world.queryEntities(['Position', 'Renderable'])) {
//         const pos = world.getComponent<Position>(entity, 'Position')!;
//         const render = world.getComponent<Renderable>(entity, 'Renderable')!;

//         const img = spriteManager.get(render.sheetId);
//         const spriteSize = 32;

//         ctx.drawImage(
//             img,
//             render.frame * spriteSize, 0, spriteSize, spriteSize, // source
//             pos.x, pos.y, spriteSize, spriteSize                  // destination
//         );
//     }
// }