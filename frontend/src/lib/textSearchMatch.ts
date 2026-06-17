import { match as matchPinyin } from "pinyin-pro";

/** 收集 query 在 text 中的字面匹配字符下标（大小写不敏感）。 */
function collectLiteralMatchIndices(text: string, query: string): number[] {
  const needle = query.trim();
  if (!needle) {
    return [];
  }
  const textLower = text.toLowerCase();
  const needleLower = needle.toLowerCase();
  const indices: number[] = [];
  let from = 0;
  let idx = textLower.indexOf(needleLower, from);
  while (idx >= 0) {
    for (let i = idx; i < idx + needle.length; i += 1) {
      indices.push(i);
    }
    from = idx + needle.length;
    idx = textLower.indexOf(needleLower, from);
  }
  return indices;
}

/** 中文全拼 / 首字母 / 混合拼音匹配（pinyin-pro）。 */
function collectPinyinMatchIndices(text: string, query: string): number[] {
  const needle = query.trim();
  if (!needle || !/[\u4e00-\u9fff]/.test(text)) {
    return [];
  }
  try {
    const result = matchPinyin(text, needle, { continuous: true });
    return result ?? [];
  } catch {
    return [];
  }
}

/**
 * 判断 query 是否匹配 text：支持原文子串、中文全拼、首字母及混合输入。
 */
export function textSearchMatches(query: string, text: string): boolean {
  const needle = query.trim();
  if (!needle) {
    return true;
  }
  if (!text) {
    return false;
  }
  return getTextSearchMatchIndices(text, needle).length > 0;
}

/**
 * 返回 text 中应高亮的字符下标（去重、升序）。
 * 用于 ScopedSearch 与 ScopedSearchText。
 */
export function getTextSearchMatchIndices(text: string, query: string): number[] {
  const needle = query.trim();
  if (!needle || !text) {
    return [];
  }

  const merged = new Set<number>();
  for (const index of collectLiteralMatchIndices(text, needle)) {
    merged.add(index);
  }
  for (const index of collectPinyinMatchIndices(text, needle)) {
    merged.add(index);
  }
  return [...merged].sort((a, b) => a - b);
}

/** 按匹配下标将 text 拆成 React / DOM 可用的片段。 */
export function splitTextByMatchIndices(
  text: string,
  indices: number[],
): Array<{ text: string; matched: boolean }> {
  if (indices.length === 0) {
    return [{ text, matched: false }];
  }

  const indexSet = new Set(indices);
  const parts: Array<{ text: string; matched: boolean }> = [];
  let buffer = "";
  let bufferMatched = indexSet.has(0);

  for (let i = 0; i < text.length; i += 1) {
    const matched = indexSet.has(i);
    if (i > 0 && matched !== bufferMatched) {
      parts.push({ text: buffer, matched: bufferMatched });
      buffer = "";
      bufferMatched = matched;
    }
    buffer += text[i];
  }

  if (buffer) {
    parts.push({ text: buffer, matched: bufferMatched });
  }

  return parts;
}
