import { Definition } from "./definition.js";
function validateDefinition(item) {
    const { sectionNumber, name, elementList, rangeBounds, conditions } = item;
    if (!sectionNumber || typeof sectionNumber !== "string") {
        return false;
    }
    if (!name || typeof name !== "string") {
        return false;
    }
    if (!(elementList instanceof Array)) {
        return false;
    }
    // TODO: Need to validate elementList, rangeBounds and conditions?
    return true;
}
export class Definitions {
    constructor(definitionList) {
        this.definitionList = definitionList;
    }
    static fromObject(obj) {
        const { definitionList: definitionListObj } = obj;
        if (!definitionListObj) {
            throw Error("Malformed serialization of RAN3 tabular form");
        }
        if (!(definitionListObj instanceof Array)) {
            throw Error("Malformed serialization of RAN3 tabular form");
        }
        const definitionList = definitionListObj.map((definitionObj) => Definition.fromObject(definitionObj));
        return new Definitions(definitionList);
    }
    findDefinition(sectionNumberOrName) {
        const definition = this.definitionList.find((def) => def.sectionNumber === sectionNumberOrName ||
            def.name === sectionNumberOrName);
        return definition;
    }
}
//# sourceMappingURL=definitions.js.map