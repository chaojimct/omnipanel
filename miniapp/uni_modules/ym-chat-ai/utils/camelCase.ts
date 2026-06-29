/**
 * 驼峰命名转换工具类
 * 提供多种命名格式之间的转换功能
 */

/**
 * 将字符串转换为小驼峰命名法 (camelCase)
 * @param str 输入字符串
 * @returns 小驼峰命名格式的字符串
 */
export function toCamelCase(str: string): string {
  if (!str) return str;
  
  // 将字符串按非字母数字字符分割，并将除第一个单词外的首字母大写
  return str
    .split(/[^a-zA-Z0-9]/)
    .filter(word => word.length > 0)
    .map((word, index) => {
      if (index === 0) {
        // 第一个单词全小写
        return word.toLowerCase();
      }
      // 其他单词首字母大写
      return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
    })
    .join('');
}

/**
 * 将字符串转换为大驼峰命名法 (PascalCase)
 * @param str 输入字符串
 * @returns 大驼峰命名格式的字符串
 */
export function toPascalCase(str: string): string {
  if (!str) return str;
  
  // 先转换为小驼峰，再将首字母大写
  const camelCase = toCamelCase(str);
  return camelCase.charAt(0).toUpperCase() + camelCase.substring(1);
}

/**
 * 将字符串转换为蛇形命名法 (snake_case)
 * @param str 输入字符串
 * @returns 蛇形命名格式的字符串
 */
export function toSnakeCase(str: string): string {
  if (!str) return str;
  
  // 在大写字母前添加下划线，然后全部转为小写
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/^-/, '') // 移除开头的下划线
    .replace(/_+/g, '_') // 将多个连续下划线合并为一个
    .toLowerCase();
}

/**
 * 将字符串转换为烤肉串命名法 (kebab-case)
 * @param str 输入字符串
 * @returns 烤肉串命名格式的字符串
 */
export function toKebabCase(str: string): string {
  if (!str) return str;
  
  // 在大写字母前添加连字符，然后全部转为小写
  return str
    .replace(/([A-Z])/g, '-$1')
    .replace(/^-/, '') // 移除开头的连字符
    .replace(/-+/g, '-') // 将多个连续连字符合并为一个
    .toLowerCase();
}

/**
 * 将字符串转换为常量命名法 (CONSTANT_CASE)
 * @param str 输入字符串
 * @returns 常量命名格式的字符串
 */
export function toConstantCase(str: string): string {
  if (!str) return str;
  
  // 转换为蛇形命名法，然后转为大写
  return toSnakeCase(str).toUpperCase();
}

export default {
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  toConstantCase
};