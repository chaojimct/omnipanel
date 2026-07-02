import type { Key } from "react";

/** dockview 等库会把 React `key` 放进 props；禁止通过 spread 继续传给子组件。 */
export function omitReactKey<T extends object>(props: T): Omit<T, "key"> {
  const { key: _key, ...rest } = props as T & { key?: Key };
  return rest;
}
