export class RangeBounds {
    constructor(rangeBoundList) {
        this.rangeBoundList = rangeBoundList;
    }
    add(rangeBound) {
        const range = this.rangeBoundList.find((item) => item.rangeBound === rangeBound.rangeBound);
        if (range) {
            return;
        }
        this.rangeBoundList.push(rangeBound);
    }
}
//# sourceMappingURL=rangeBounds.js.map