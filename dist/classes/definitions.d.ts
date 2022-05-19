import { Definition } from "./definition.js";
export declare class Definitions {
    definitionList: Definition[];
    constructor(definitionList: Definition[]);
    static fromObject(obj: unknown): Definitions;
    findDefinition(sectionNumberOrName: string): Definition | undefined;
}
//# sourceMappingURL=definitions.d.ts.map