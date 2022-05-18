import { parse as parseDocx } from "doc3rd";
import { Cell } from "doc3rd/dist/parser/elements/cell.js";
import { Paragraph } from "doc3rd/dist/parser/elements/paragraph.js";
import { Row } from "doc3rd/dist/parser/elements/row.js";
import { Table } from "doc3rd/dist/parser/elements/table.js";
import { Definition } from "./classes/definition.js";
import { Definitions } from "./classes/definitions.js";
import {
  ICondition,
  IDefinition,
  IInformationElement,
  IRangeBound,
} from "./types";

const columnListConditionTable = ["Condition", "Explanation"];
const columnListDefinitionTable = [
  "IE/Group Name",
  "Presence",
  "Range",
  "IE type and reference",
  "Semantics description",
];
const columnListRangeTable = ["Range bound", "Explanation"];

/**
 * Regular expression for section. Following expressions are supported
 * - 9.1.2.3
 * - 9.1.2.3a
 * - A.1.2.3
 * - A.1.2.3a
 */
const reSection =
  /^(?<sectionNumber>[1-9A-Z]\d*?(\.[1-9]\d*?)*?\.[1-9]\w*?)\s+?(?<title>.+)$/;
//                                   ^ Head      ^ Middle       ^ Tail

/**
 * Regular expression for section number. Following expressions are supported
 * - 9.1.2.3
 * - 9.1.2.3a
 * - A.1.2.3
 * - A.1.2.3a
 */
export const reSectionNumber = /\b[1-9A-Z]\d*?(\.[1-9]\d*?)*\.[1-9]\w*?\b/;
//                         ^ Head      ^ Middle        ^ Tail

/**
 * Regular expression for section. The number of '>' is equal to the depth.
 */
const reDepth = /^(?<depth>>+)/;

function cellText(cell?: Cell): string {
  return cell?.paragraphs.map((paragraph) => paragraph.text).join("\n") ?? "";
}

/**
 * Normalize HTML text with the followings:
 * - Fix a replacement character (U+FFFD)
 */
function normalize(text: string) {
  return text.replace(/\uFFFD/g, " ");
}

function normalizeHtmlText(text: string) {
  return text.replace(/(\s|\n)+/g, " ").trim();
}

function matchColumnsPerRow(row: Row, columnList: string[]): boolean {
  const cells = row.cells;
  return (
    cells.length >= columnList.length &&
    columnList.every((column, index) => {
      const normalizedText = normalizeHtmlText(cellText(cells[index]));
      return normalizedText.toLowerCase() === column.toLowerCase();
    })
  );
}

function matchColumns(table: Table, columnList: string[]): boolean {
  const headerRow = table.rows[0];
  return matchColumnsPerRow(headerRow, columnList);
}

function isConditionTable(element: unknown): element is Table {
  if (!(element instanceof Table)) {
    return false;
  }
  return matchColumns(element, columnListConditionTable);
}

function isDefinitionTable(element: unknown): element is Table {
  if (!(element instanceof Table)) {
    return false;
  }
  return matchColumns(element, columnListDefinitionTable);
}

function getDirection(element: unknown): string | undefined {
  if (!(element instanceof Paragraph)) {
    return undefined;
  }
  const normalizedText = normalizeHtmlText(element.text);
  if (!normalizedText.startsWith("Direction")) {
    return undefined;
  }
  // Correct incorrectly rendered rightwards arrow
  return normalizedText.replace(/\u00Ae/g, String.fromCharCode(0x2192));
}

function isRangeTable(element: unknown): element is Table {
  if (!(element instanceof Table)) {
    return false;
  }
  return matchColumns(element, columnListRangeTable);
}

function getSectionInfo(
  element: unknown
): { sectionNumber: string; title: string } | undefined {
  if (!(element instanceof Paragraph) || !element.outlineLevel) {
    return undefined;
  }
  const sectionText = normalizeHtmlText(element.text);
  const matchResult = sectionText.match(reSection);
  if (!matchResult || !matchResult.groups) {
    return undefined;
  }
  const { sectionNumber, title } = matchResult.groups;
  return { sectionNumber, title };
}

function newDefinition(): IDefinition {
  return {
    sectionNumber: "",
    name: "",
    descriptionList: [],
    direction: "",
    elementList: [],
    rangeBoundList: [],
    conditionList: [],
  };
}

function parseConditionTrList(rows: Row[]): ICondition[] {
  const conditionList: ICondition[] = [];
  rows.forEach((row) => {
    const cells = row.cells;
    let i = 0;
    for (; i < cells.length; i += 1) {
      const td = normalizeHtmlText(cellText(cells[i]));
      if (td !== "") {
        break;
      }
    }
    if (i === cells.length) {
      return;
    }
    const condition: ICondition = {
      condition: cellText(cells[i]).trim(),
      explanation: cellText(cells[i + 1]).trim(),
    };
    if (condition.condition === "") {
      // eslint-disable-next-line no-console
      console.log("Empty leading cell found");
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(condition, null, 4));
    }
    conditionList.push(condition);
  });
  return conditionList;
}

function parseRangeTrList(rows: Row[]) {
  const rangeBoundList: IRangeBound[] = [];
  rows.forEach((row) => {
    const cells = row.cells;
    let i = 0;
    for (; i < cells.length; i += 1) {
      const td = normalizeHtmlText(cellText(cells[i]));
      if (td !== "") {
        break;
      }
    }
    if (i === cells.length) {
      return;
    }
    const rangeBound: IRangeBound = {
      rangeBound: cellText(cells[i]).trim(),
      explanation: cellText(cells[i + 1]).trim(),
    };
    if (rangeBound.rangeBound === "") {
      // eslint-disable-next-line no-console
      console.log("Empty leading cell found");
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(rangeBound, null, 4));
    }
    rangeBoundList.push(rangeBound);
  });
  return rangeBoundList;
}

function parseDefinitionTable(table: Table): {
  ieList: IInformationElement[];
  conditionList: ICondition[];
  rangeBoundList: IRangeBound[];
} {
  const bodyRows = table.rows.slice(1);
  const ieList: IInformationElement[] = [];
  let depthMin = Infinity;
  // Find condition table
  const indexConditionHeader = bodyRows.findIndex((trElement) =>
    matchColumnsPerRow(trElement, columnListConditionTable)
  );
  // Find range table
  const indexRangeHeader = bodyRows.findIndex((trElement) =>
    matchColumnsPerRow(trElement, columnListRangeTable)
  );
  const indexDefinitionEnd = Math.min(
    indexConditionHeader !== -1 ? indexConditionHeader : Infinity,
    indexRangeHeader !== -1 ? indexRangeHeader : Infinity
  );
  const definitionRows = bodyRows.slice(0, indexDefinitionEnd);
  definitionRows.forEach((row) => {
    const cells = row.cells;
    let i = 0;
    for (; i < cells.length; i += 1) {
      const td = normalizeHtmlText(cellText(cells[i]));
      if (td !== "") {
        break;
      }
    }
    if (i === cells.length) {
      return;
    }
    const tdFirst = normalizeHtmlText(cellText(cells[i]));
    i += 1;
    const name = tdFirst.replace(/^>+/, "").trim();
    const matchResult = tdFirst.match(reDepth);
    const depth =
      !matchResult || !matchResult.groups ? 0 : matchResult.groups.depth.length;
    depthMin = Math.min(depthMin, depth);
    const typeAndRef = normalizeHtmlText(cellText(cells[i + 2]));
    const [reference, type] = typeAndRef.match(reSectionNumber)
      ? [typeAndRef, ""]
      : ["", typeAndRef];
    const informationElement: IInformationElement = {
      name,
      presence: normalizeHtmlText(cellText(cells[i])),
      range: normalizeHtmlText(cellText(cells[i + 1])),
      reference,
      type,
      description: normalizeHtmlText(cellText(cells[i + 3])),
      criticality: normalizeHtmlText(cellText(cells[i + 4])),
      assignedCriticality: normalizeHtmlText(cellText(cells[i + 5])),
      depth,
    };
    if (name === "") {
      // eslint-disable-next-line no-console
      console.log("Empty leading cell found");
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(informationElement, null, 4));
    }
    ieList.push(informationElement);
  });
  ieList.forEach((ie) => {
    // eslint-disable-next-line no-param-reassign
    ie.depth -= depthMin;
  });
  // eslint-disable-next-line no-nested-ternary
  const indexConditionEnd =
    indexConditionHeader === -1
      ? -1
      : indexRangeHeader > indexConditionHeader
      ? indexRangeHeader
      : Infinity;
  const trListCondition = bodyRows
    .slice(indexConditionHeader, indexConditionEnd)
    .slice(1);
  const conditionList = parseConditionTrList(trListCondition);
  // eslint-disable-next-line no-nested-ternary
  const indexRangeEnd =
    indexRangeHeader === -1
      ? -1
      : indexConditionHeader > indexRangeHeader
      ? indexConditionHeader
      : Infinity;
  const trListRange = bodyRows.slice(indexRangeHeader, indexRangeEnd).slice(1);
  const rangeBoundList = parseRangeTrList(trListRange);
  return { ieList, conditionList, rangeBoundList };
}

function parseRangeTable(table: Table): IRangeBound[] {
  const bodyRows = table.rows.slice(1);
  return parseRangeTrList(bodyRows);
}

function parseConditionTable(table: Table): ICondition[] {
  const bodyRows = table.rows.slice(1);
  return parseConditionTrList(bodyRows);
}

export async function parse(bin: Buffer): Promise<Definitions> {
  const parsed = await parseDocx(bin);

  const definitionList: Definition[] = [];
  let definition = newDefinition();

  parsed.forEach((element) => {
    // Check element matches one of given patterns
    const sectionInfo = getSectionInfo(element);
    const direction = getDirection(element);
    if (sectionInfo) {
      if (definition.elementList.length) {
        definitionList.push(new Definition(definition));
      }
      definition = newDefinition();
      const { sectionNumber, title: name } = sectionInfo;
      definition.sectionNumber = sectionNumber;
      definition.name = name;
      return;
    }
    if (direction) {
      definition.direction = direction;
      return;
    }
    if (isDefinitionTable(element)) {
      const { ieList, conditionList, rangeBoundList } =
        parseDefinitionTable(element);
      definition.elementList = ieList;
      definition.conditionList = conditionList;
      definition.rangeBoundList = rangeBoundList;
      return;
    }
    if (isConditionTable(element)) {
      definition.conditionList = parseConditionTable(element);
      return;
    }
    if (isRangeTable(element)) {
      definition.rangeBoundList = parseRangeTable(element);
      return;
    }
    if (element instanceof Paragraph && !definition.elementList.length) {
      definition.descriptionList.push(element.text);
      return;
    }
  });
  if (definition.elementList.length) {
    definitionList.push(new Definition(definition));
  }
  return Promise.resolve(new Definitions(definitionList));
}
