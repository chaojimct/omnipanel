# 通用 API 说明

本文档记录 OmniPanel 前端中可复用的通用 API，供各模块调用。

---

## quickInput — 阻塞式快速输入

轻量弹窗输入框，类似浏览器 `prompt()`，以 Promise 方式阻塞当前异步流程，等待用户输入。

### 导入

```typescript
import { quickInput } from "../lib/quickInput";
import type { QuickInputOptions } from "../lib/quickInput";
```

### 签名

```typescript
function quickInput(options: QuickInputOptions): Promise<string | null>;
```

### 参数 `QuickInputOptions`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | `string` | 是 | 弹窗标题 |
| `subtitle` | `string` | 否 | 标题下方的说明文字 |
| `placeholder` | `string` | 否 | 输入框占位符 |
| `defaultValue` | `string` | 否 | 初始值，默认 `""` |
| `validate` | `(value: string) => string \| null` | 否 | 自定义校验；返回错误文案则阻止提交，返回 `null` 表示通过 |

未提供 `validate` 时，空字符串会触发内置提示（i18n key: `quickInput.required`）。

### 返回值

| 场景 | 返回值 |
|------|--------|
| 用户按 **Enter** 且校验通过 | 去除首尾空格后的输入字符串 |
| 用户按 **Esc** | `null` |
| 点击遮罩层 | `null` |
| 点击右上角关闭按钮 | `null` |
| 已有弹窗打开时再次调用 | 前一个 Promise 以 `null` resolve，再打开新弹窗 |

### 键盘与交互

- **Enter**：确认（校验失败时不关闭，显示错误信息）
- **Esc**：取消并关闭
- 无「确定 / 取消」按钮，适合快速命名、重命名等场景

### 示例

```typescript
const name = await quickInput({
  title: "新建数据库分组",
  subtitle: "分组名称",
  placeholder: "例如：预发布",
  validate: (value) => {
    if (!value.trim()) return "请输入分组名称";
    if (existingNames.includes(value.trim())) return "分组名称已存在";
    return null;
  },
});

if (name) {
  addGroup(name);
}
```

实际使用见 `frontend/src/modules/database/DatabasePanel.tsx` 中的 `handleCreateGroup`。

### 实现结构

| 路径 | 职责 |
|------|------|
| `frontend/src/lib/quickInput.ts` | 对外导出入口 |
| `frontend/src/stores/quickInputStore.ts` | Promise 状态与 resolve / cancel |
| `frontend/src/components/ui/QuickInputHost.tsx` | 全局 Host，挂载于 `App.tsx` |
| `frontend/src/components/ui/QuickInputDialog.tsx` | 纯 UI 组件 |

应用启动时 `App.tsx` 已渲染 `<QuickInputHost />`，业务代码只需 `import { quickInput }` 即可，**无需**在页面内手动挂载弹窗。

### 底层组件（高级用法）

一般应优先使用 `quickInput()` API。若需完全自定义交互，可直接使用 `QuickInputDialog`：

```typescript
import { QuickInputDialog } from "../components/ui/QuickInputDialog";

<QuickInputDialog
  open={open}
  title="标题"
  subtitle="说明"
  placeholder="占位符"
  defaultValue=""
  validate={(value) => (value.trim() ? null : "不能为空")}
  onConfirm={(value) => { /* 确认 */ }}
  onCancel={() => { /* 取消 */ }}
/>
```

---

## 待补充

后续新增的通用 API（如确认框、文件选择封装等）可继续追加到本文档对应章节。
