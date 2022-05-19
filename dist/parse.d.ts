/// <reference types="node" />
import { Definitions } from "./classes/definitions.js";
/**
 * Regular expression for section number. Following expressions are supported
 * - 9.1.2.3
 * - 9.1.2.3a
 * - A.1.2.3
 * - A.1.2.3a
 */
export declare const reSectionNumber: RegExp;
export declare function parse(bin: Buffer): Promise<Definitions>;
//# sourceMappingURL=parse.d.ts.map