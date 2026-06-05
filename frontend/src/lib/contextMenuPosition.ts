/** 右键菜单与视口边缘的最小间距（px） */
export const CONTEXT_MENU_VIEWPORT_PADDING = 8;

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/** 将菜单左上角坐标钳制在视口内。 */
export function clampMenuPosition(
  anchor: Point,
  size: Size,
  padding = CONTEXT_MENU_VIEWPORT_PADDING,
): Point {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const maxX = Math.max(padding, viewportW - size.width - padding);
  const maxY = Math.max(padding, viewportH - size.height - padding);
  return {
    x: Math.min(Math.max(anchor.x, padding), maxX),
    y: Math.min(Math.max(anchor.y, padding), maxY),
  };
}

/** 子菜单相对父项展开：优先右侧，空间不足时翻转到左侧。 */
export function computeSubmenuPosition(
  anchorRect: DOMRect,
  size: Size,
  gap = 2,
  padding = CONTEXT_MENU_VIEWPORT_PADDING,
): Point {
  let x = anchorRect.right + gap;
  if (x + size.width > window.innerWidth - padding) {
    x = anchorRect.left - size.width - gap;
  }
  return clampMenuPosition({ x, y: anchorRect.top }, size, padding);
}
