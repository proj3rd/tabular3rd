export class Conditions {
    constructor(conditionList) {
        this.conditionList = conditionList;
    }
    add(condition) {
        const cond = this.conditionList.find((item) => item.condition === condition.condition);
        if (cond) {
            return;
        }
        this.conditionList.push(condition);
    }
}
//# sourceMappingURL=conditions.js.map