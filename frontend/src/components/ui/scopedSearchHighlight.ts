const MARK_CLASS = "scoped-search-mark";

const SKIP_SELECTOR =
  ".scoped-search-bar, input, textarea, select, option, script, style, .monaco-editor, .sql-monaco-editor, [contenteditable='true']";

function shouldSkipTextNode(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent) {
    return true;
  }
  if (parent.closest(SKIP_SELECTOR)) {
    return true;
  }
  if (parent.classList.contains(MARK_CLASS)) {
    return true;
  }
  return false;
}

function collectTextNodes(root: HTMLElement): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!(node instanceof Text) || shouldSkipTextNode(node)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (!node.textContent?.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
}

/** 清除宿主内由区域搜索产生的高亮 mark。 */
export function clearScopedSearchHighlights(root: HTMLElement): void {
  root.querySelectorAll(`mark.${MARK_CLASS}`).forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) {
      return;
    }
    parent.replaceChild(document.createTextNode(mark.textContent ?? ""), mark);
  });
  root.normalize();
}

/** 在宿主 DOM 内为匹配 query 的文本片段包裹高亮 mark（大小写不敏感）。 */
export function applyScopedSearchHighlights(root: HTMLElement, query: string): void {
  clearScopedSearchHighlights(root);

  const needle = query.trim();
  if (!needle) {
    return;
  }

  const needleLower = needle.toLowerCase();

  for (const textNode of collectTextNodes(root)) {
    const text = textNode.textContent ?? "";
    const textLower = text.toLowerCase();
    let searchFrom = 0;
    let matchIndex = textLower.indexOf(needleLower, searchFrom);
    if (matchIndex < 0) {
      continue;
    }

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    while (matchIndex >= 0) {
      if (matchIndex > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchIndex)));
      }
      const mark = document.createElement("mark");
      mark.className = MARK_CLASS;
      mark.textContent = text.slice(matchIndex, matchIndex + needle.length);
      fragment.appendChild(mark);
      lastIndex = matchIndex + needle.length;
      searchFrom = lastIndex;
      matchIndex = textLower.indexOf(needleLower, searchFrom);
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.parentNode?.replaceChild(fragment, textNode);
  }
}
