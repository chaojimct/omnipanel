import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

/**
 * 全局 Button 组件 —— 项目唯一的按钮入口。
 *
 * 通过 `variant` + `size` 组合复用现有 .btn* CSS 工具类，保证外观设置中
 * 调整的强调色（--accent / --accent-hover / --accent-soft 等）自动作用到所有
 * 按钮实例。
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "warn"
  | "icon";

export type ButtonSize = "xs" | "sm" | "md";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 与 <button> 一致，默认 "button" 避免意外触发表单提交 */
  type?: "button" | "submit" | "reset";
  /** 当按钮内容是纯图标时可省略；显式传入用于无障碍标签 */
  "aria-label"?: string;
  children?: ReactNode;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
  warn: "btn-warn",
  icon: "btn-icon",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  xs: "btn-xs",
  sm: "btn-sm",
  md: "",
};

/**
 * icon 变体在原项目中既可独立（`btn-icon`）也可与基础类组合（`btn btn-icon`）。
 * 出于样式一致性，这里 icon 变体独立渲染（不带 `btn` 基础类），与现有 30+ 处
 * 独立 `btn-icon` 用法保持一致。
 */
const VARIANT_HAS_BASE: Record<ButtonVariant, boolean> = {
  primary: true,
  secondary: true,
  ghost: true,
  danger: true,
  warn: true,
  icon: false,
};

/**
 * icon 变体尺寸固定 28×28，不接受 size 修饰；
 * 其它变体在 size=md 时不输出尺寸类。
 */
const VARIANT_ACCEPTS_SIZE: Record<ButtonVariant, boolean> = {
  primary: true,
  secondary: true,
  ghost: true,
  danger: true,
  warn: true,
  icon: false,
};

function buildClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string
): string {
  const parts: string[] = [];
  if (VARIANT_HAS_BASE[variant]) parts.push("btn");
  parts.push(VARIANT_CLASS[variant]);
  if (VARIANT_ACCEPTS_SIZE[variant] && size !== "md") {
    parts.push(SIZE_CLASS[size]);
  }
  if (className) parts.push(className);
  return parts.filter(Boolean).join(" ");
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    type = "button",
    className,
    children,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buildClassName(variant, size, className)}
      {...rest}
    >
      {children}
    </button>
  );
});
