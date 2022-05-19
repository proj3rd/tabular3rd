import { IDefinition, IInformationElement } from "../types.js";
import { Conditions } from "./conditions.js";
import { Definitions } from "./definitions.js";
import { RangeBounds } from "./rangeBounds.js";
export declare const HEADER_NAME_BASE = "IE/Group Name";
export declare const HEADER_DESCRIPTION = "Semantics description";
export declare class Definition {
    sectionNumber: string;
    name: string;
    descriptionList: string[];
    direction: string;
    elementList: IInformationElement[];
    rangeBounds: RangeBounds;
    conditions: Conditions;
    constructor(definition: IDefinition);
    static fromObject(obj: unknown): Definition;
    /**
     * Expand `elementList`, `rangeBounds` and `condition`. This will mutate the object itself.
     */
    expand(definitions: Definitions): Definition;
    getDepth(): number;
    hasSingleRoot(): boolean;
}
//# sourceMappingURL=definition.d.ts.map