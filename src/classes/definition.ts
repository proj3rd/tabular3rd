import _ from "lodash";
const { cloneDeep, isEqual } = _;
import { MSG_ERR_RAN3_TABULAR_MALFORMED_SERIALIZATION } from "../constants.js";
import { reSectionNumber } from "../parse.js";
import { IDefinition, IInformationElement } from "../types.js";
import { Conditions } from "./conditions.js";
import { Definitions } from "./definitions.js";
import { RangeBounds } from "./rangeBounds.js";

export const HEADER_NAME_BASE = "IE/Group Name";
export const HEADER_DESCRIPTION = "Semantics description";

// eslint-disable-next-line no-use-before-define
function canMerge(parent: IInformationElement, child: Definition): boolean {
  if (!child.hasSingleRoot()) {
    return false;
  }
  const { elementList } = child;
  const firstElement = elementList[0];
  if (
    parent.presence !== "" &&
    parent.presence !== "M" &&
    parent.presence !== "O" &&
    firstElement.presence !== "" &&
    firstElement.presence !== "M" &&
    firstElement.presence !== "O" &&
    parent.presence !== firstElement.presence
  ) {
    return false;
  }
  if (parent.range !== "" || firstElement.range !== "") {
    return false;
  }
  if (
    parent.criticality !== "" &&
    firstElement.criticality !== "" &&
    parent.criticality !== firstElement.criticality
  ) {
    return false;
  }
  if (
    parent.assignedCriticality !== "" &&
    firstElement.assignedCriticality !== "" &&
    parent.assignedCriticality !== firstElement.assignedCriticality
  ) {
    return false;
  }
  return true;
}

function merge(parent: IInformationElement, child: IInformationElement) {
  if (child.name.toUpperCase().startsWith("CHOICE")) {
    // eslint-disable-next-line no-param-reassign
    parent.name = `CHOICE ${parent.name}`;
  }
  if (parent.presence === "O" || child.presence === "O") {
    // eslint-disable-next-line no-param-reassign
    parent.presence = "O";
  } else {
    // eslint-disable-next-line no-param-reassign
    parent.presence = parent.presence || child.presence;
  }
  if (child.type !== "") {
    // eslint-disable-next-line no-param-reassign
    parent.type = child.type;
  }
  const descriptionList = [];
  if (parent.description) {
    descriptionList.push(parent.description);
  }
  if (child.description) {
    descriptionList.push(child.description);
  }
  // eslint-disable-next-line no-param-reassign
  parent.description = descriptionList.join("\n\n");
}

export class Definition {
  public sectionNumber: string;
  public name: string;
  public descriptionList: string[];
  public direction: string;
  public elementList: IInformationElement[];
  public rangeBounds: RangeBounds;
  public conditions: Conditions;

  constructor(definition: IDefinition) {
    const {
      sectionNumber,
      name,
      descriptionList,
      direction,
      elementList,
      rangeBoundList,
      conditionList,
    } = definition;
    this.sectionNumber = sectionNumber;
    this.name = name;
    this.descriptionList = descriptionList;
    this.direction = direction;
    this.elementList = elementList;
    this.rangeBounds = new RangeBounds(rangeBoundList);
    this.conditions = new Conditions(conditionList);
  }

  public static fromObject(obj: unknown): Definition {
    const {
      sectionNumber,
      name,
      descriptionList: descriptionListObj,
      direction,
      elementList: elementListObj,
      rangeBounds: rangeBoundsObj,
      conditions: conditionsObj,
    } = obj as Definition;
    if (!sectionNumber || typeof sectionNumber !== "string") {
      throw Error(MSG_ERR_RAN3_TABULAR_MALFORMED_SERIALIZATION);
    }
    if (!name || typeof name !== "string") {
      throw Error(MSG_ERR_RAN3_TABULAR_MALFORMED_SERIALIZATION);
    }
    const descriptionList = descriptionListObj.map((descriptionObj) => {
      if (typeof descriptionObj !== "string") {
        throw Error(MSG_ERR_RAN3_TABULAR_MALFORMED_SERIALIZATION);
      }
      return descriptionObj;
    });
    if (typeof direction !== "string") {
      throw Error(MSG_ERR_RAN3_TABULAR_MALFORMED_SERIALIZATION);
    }
    if (!(elementListObj instanceof Array)) {
      throw Error(MSG_ERR_RAN3_TABULAR_MALFORMED_SERIALIZATION);
    }
    const { rangeBoundList } = rangeBoundsObj;
    if (!rangeBoundList) {
      throw Error(MSG_ERR_RAN3_TABULAR_MALFORMED_SERIALIZATION);
    }
    const { conditionList } = conditionsObj;
    if (!conditionList) {
      throw Error(MSG_ERR_RAN3_TABULAR_MALFORMED_SERIALIZATION);
    }
    return new Definition({
      sectionNumber,
      name,
      descriptionList,
      direction,
      elementList: elementListObj,
      rangeBoundList,
      conditionList,
    });
  }

  /**
   * Expand `elementList`, `rangeBounds` and `condition`. This will mutate the object itself.
   */
  public expand(definitions: Definitions): Definition {
    const elementListExpanded = cloneDeep(this.elementList);
    const rangeBoundsExpanded = cloneDeep(this.rangeBounds);
    const conditionsExpanded = cloneDeep(this.conditions);
    // tslint:disable-next-line: prefer-for-of
    for (let i = elementListExpanded.length - 1; i >= 0; i -= 1) {
      const element = elementListExpanded[i];
      const { reference } = element;
      const matchResult = reference.match(reSectionNumber);
      if (matchResult) {
        const sectionNumber = matchResult[0];
        const definitionReferenced = definitions.findDefinition(sectionNumber);
        if (definitionReferenced) {
          const definitionExpanded =
            cloneDeep(definitionReferenced).expand(definitions);
          const {
            elementList: elementListReferenced,
            rangeBounds: rangeBoundsReferenced,
            conditions: conditionsReferenced,
          } = definitionExpanded;
          if (canMerge(elementListExpanded[i], definitionExpanded)) {
            elementListReferenced.forEach((elementReferenced) => {
              // eslint-disable-next-line no-param-reassign
              elementReferenced.depth += element.depth;
            });
            merge(elementListExpanded[i], elementListReferenced[0]);
            elementListExpanded.splice(
              i + 1,
              0,
              ...elementListReferenced.slice(1)
            );
          } else {
            elementListReferenced.forEach((elementReferenced) => {
              // eslint-disable-next-line no-param-reassign
              elementReferenced.depth += element.depth + 1;
            });
            elementListExpanded.splice(i + 1, 0, ...elementListReferenced);
          }
          if (!isEqual(elementListExpanded, this.elementList)) {
            this.elementList = elementListExpanded;
          }
          rangeBoundsReferenced.rangeBoundList.forEach((rangeBound) => {
            rangeBoundsExpanded.add(rangeBound);
          });
          conditionsReferenced.conditionList.forEach((condition) => {
            conditionsExpanded.add(condition);
          });
        }
      }
    }
    if (!isEqual(rangeBoundsExpanded, this.rangeBounds)) {
      this.rangeBounds = rangeBoundsExpanded;
    }
    if (!isEqual(conditionsExpanded, this.conditions)) {
      this.conditions = conditionsExpanded;
    }
    return this;
  }

  public getDepth(): number {
    return this.elementList.reduce(
      (prev, curr) => Math.max(prev, curr.depth),
      0
    );
  }

  public hasSingleRoot(): boolean {
    if (this.elementList.length === 0) {
      return false;
    }
    const depthAndCount = this.elementList.reduce(
      (prev, curr) => {
        if (curr.depth < prev.depth) {
          return {
            depth: curr.depth,
            count: 1,
          };
        }
        if (curr.depth === prev.depth) {
          return {
            depth: prev.depth,
            count: prev.count + 1,
          };
        }
        return prev;
      },
      { depth: Infinity, count: 0 }
    );
    return depthAndCount.count === 1;
  }
}
