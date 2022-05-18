import { IRangeBound } from "../types";
import { HEADER_DESCRIPTION, HEADER_NAME_BASE } from "./definition";

export class RangeBounds {
  public rangeBoundList: IRangeBound[];

  constructor(rangeBoundList: IRangeBound[]) {
    this.rangeBoundList = rangeBoundList;
  }

  public add(rangeBound: IRangeBound) {
    const range = this.rangeBoundList.find(
      (item) => item.rangeBound === rangeBound.rangeBound
    );
    if (range) {
      return;
    }
    this.rangeBoundList.push(rangeBound);
  }
}
