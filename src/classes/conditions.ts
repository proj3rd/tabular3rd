import { ICondition } from "../types";

export class Conditions {
  public conditionList: ICondition[];

  constructor(conditionList: ICondition[]) {
    this.conditionList = conditionList;
  }

  public add(condition: ICondition) {
    const cond = this.conditionList.find(
      (item) => item.condition === condition.condition
    );
    if (cond) {
      return;
    }
    this.conditionList.push(condition);
  }
}
