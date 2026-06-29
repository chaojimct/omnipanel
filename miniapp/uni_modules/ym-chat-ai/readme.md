# YM Chat AI 组件文档

## 组件概览

YM Chat AI 提供了四个核心组件，用于构建完整的聊天应用：

- **YmBubble**: 消息气泡组件
- **YmSender**: 消息发送组件  
- **YmAttachments**: 文件附件组件
- **YmTypewriter**: 打字机效果组件

---

## YmBubble - 消息气泡组件

### 功能描述
用于显示聊天消息的气泡组件，支持用户消息和AI消息的区分显示，支持Markdown渲染和打字机效果。

### Props 配置

| 属性名 | 类型 | 默认值 | 必填 | 描述 |
|--------|------|--------|------|------|
| `message` | string | - | ✅ | 消息内容 |
| `position` | 'left' \| 'right' | 'left' | ❌ | 消息位置，left为AI消息，right为用户消息 |
| `isMarkdown` | boolean | false | ❌ | 是否启用Markdown渲染 |
| `isError` | boolean | false | ❌ | 是否为错误消息 |
| `loading` | boolean | false | ❌ | 是否显示加载状态 |
| `typing` | boolean | false | ❌ | 是否启用打字机效果 |
| `typingSpeed` | number | 50 | ❌ | 打字机速度（毫秒） |
| `cursorChar` | string | '|' | ❌ | 光标字符 |
| `resources` | object | - | ❌ | 资源对象 |
| `files` | Array | [] | ❌ | 附件文件列表 |
| `messageId` | string | - | ❌ | 消息ID |

### 事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| `bubble-click` | messageId | 点击气泡时触发 |

### 插槽

| 插槽名 | 描述 |
|--------|------|
| `header` | 消息头部内容 |
| `content` | 消息主体内容 |
| `footer` | 消息底部内容 |

### 使用示例

```vue
<template>
  <!-- 用户消息 -->
  <YmBubble 
    message="你好，AI助手！" 
    position="right" 
  />
  
  <!-- AI消息 -->
  <YmBubble 
    message="# 你好！👋\n\n我是AI助手，很高兴为您服务。" 
    position="left" 
    :is-markdown="true"
  />
  
  <!-- 带打字机效果的消息 -->
  <YmBubble 
    message="正在思考中..." 
    position="left" 
    :typing="true"
    :typing-speed="100"
  />
  
  <!-- 加载状态 -->
  <YmBubble 
    message="" 
    position="left" 
    :loading="true"
  />
  
  <!-- 错误消息 -->
  <YmBubble 
    message="发送失败，请重试" 
    position="left" 
    :is-error="true"
  />
</template>
```

### 样式定制

```less
.ym-bubble {
  // 自定义气泡样式
  &--left {
    .ym-bubble-content {
      background-color: #ffffff;
      color: #333333;
    }
  }
  
  &--right {
    .ym-bubble-content {
      background-color: #007bff;
      color: #ffffff;
    }
  }
}
```

---

## YmSender - 消息发送组件

### 功能描述
用于消息输入和发送的组件，支持多行文本输入、文件上传、联网搜索等功能。

### Props 配置

| 属性名 | 类型 | 默认值 | 必填 | 描述 |
|--------|------|--------|------|------|
| `placeholder` | string | '请输入消息...' | ❌ | 输入框占位符 |
| `loading` | boolean | false | ❌ | 是否显示发送中状态 |
| `disabled` | boolean | false | ❌ | 是否禁用输入 |
| `showInput` | boolean | true | ❌ | 是否显示输入框 |
| `showUpload` | boolean | true | ❌ | 是否显示上传按钮 |
| `showOnline` | boolean | false | ❌ | 是否显示联网按钮 |
| `showSend` | boolean | true | ❌ | 是否显示发送按钮 |
| `maxLength` | number | 1000 | ❌ | 最大输入长度 |
| `autoFocus` | boolean | false | ❌ | 是否自动聚焦 |

### 事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| `send` | { message: string } | 发送消息时触发 |
| `cancel` | - | 取消发送时触发 |
| `toggle-attachments` | boolean | 切换附件显示时触发 |
| `toggle-online` | boolean | 切换联网状态时触发 |
| `input` | string | 输入内容变化时触发 |
| `focus` | - | 输入框聚焦时触发 |
| `blur` | - | 输入框失焦时触发 |

### 插槽

| 插槽名 | 描述 |
|--------|------|
| `header` | 头部内容，通常用于附件预览 |
| `footer` | 底部内容 |

### 使用示例

```vue
<template>
  <YmSender 
    :placeholder="'请输入消息...'"
    :loading="isSending"
    :show-online="true"
    @send="handleSend"
    @cancel="handleCancel"
    @toggle-attachments="handleToggleAttachments"
    @toggle-online="handleToggleOnline"
  >
    <template #header>
      <YmAttachments 
        :items="attachmentFiles" 
        @update:items="onItemsUpdate" 
      />
    </template>
  </YmSender>
</template>

<script setup>
const handleSend = (event) => {
  console.log('发送消息:', event.message);
};

const handleCancel = () => {
  console.log('取消发送');
};

const handleToggleAttachments = (visible) => {
  console.log('附件显示状态:', visible);
};

const handleToggleOnline = (enabled) => {
  console.log('联网状态:', enabled);
};
</script>
```

### 样式定制

```less
.ym-sender {
  // 自定义发送器样式
  &__input {
    font-size: 16px;
    line-height: 1.5;
  }
  
  &__control-btn {
    background-color: #f0f0f0;
    
    &:hover {
      background-color: #e0e0e0;
    }
  }
}
```

---

## YmAttachments - 文件附件组件

### 功能描述
用于文件选择和管理的组件，支持多种文件类型，提供文件预览、删除、选择等功能。

### Props 配置

| 属性名 | 类型 | 默认值 | 必填 | 描述 |
|--------|------|--------|------|------|
| `items` | Array | [] | ✅ | 文件列表 |
| `count` | number | 9 | ❌ | 最大文件数量 |
| `showRemove` | boolean | true | ❌ | 是否显示删除按钮 |
| `selectionMode` | 'none' \| 'single' \| 'multiple' | 'none' | ❌ | 选择模式 |
| `scrollDirection` | 'horizontal' \| 'vertical' | 'horizontal' | ❌ | 滚动方向 |
| `disabled` | boolean | false | ❌ | 是否禁用 |

### 事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| `update:items` | Array | 文件列表更新时触发 |
| `file-add` | Array | 添加文件时触发 |
| `file-remove` | object | 删除文件时触发 |
| `file-select` | { file: object, selected: boolean } | 选择文件时触发 |

### 文件对象结构

```typescript
interface AttachmentFile {
  id?: string;           // 文件ID
  name: string;          // 文件名
  size?: number;         // 文件大小（字节）
  type?: string;         // 文件类型
  url?: string;          // 文件URL
  status?: string;       // 文件状态
  progress?: number;     // 上传进度
  selected?: boolean;    // 是否选中
}
```

### 使用示例

```vue
<template>
  <YmAttachments 
    :items="files"
    :count="5"
    :show-remove="true"
    selection-mode="multiple"
    scroll-direction="horizontal"
    @update:items="onItemsUpdate"
    @file-add="onFileAdd"
    @file-remove="onFileRemove"
    @file-select="onFileSelect"
  />
</template>

<script setup>
import { ref } from 'vue';

const files = ref([]);

const onItemsUpdate = (newItems) => {
  files.value = newItems;
};

const onFileAdd = (newFiles) => {
  console.log('添加文件:', newFiles);
};

const onFileRemove = (file) => {
  console.log('删除文件:', file);
};

const onFileSelect = (file, selected) => {
  console.log('选择文件:', file, selected);
};
</script>
```

### 支持的文件类型

- **图片**: jpg, jpeg, png, gif, webp, svg
- **视频**: mp4, avi, mov, wmv, flv, webm
- **音频**: mp3, wav, flac, aac, ogg
- **文档**: pdf, doc, docx, xls, xlsx, ppt, pptx
- **文本**: txt, md
- **代码**: js, ts, vue, html, css, less, scss, json, xml, php, java, py
- **压缩**: zip, rar, 7z, tar, gz

---

## YmTypewriter - 打字机效果组件

### 功能描述
模拟打字机效果的组件，支持逐字符显示文本，可控制速度、光标显示等。

### Props 配置

| 属性名 | 类型 | 默认值 | 必填 | 描述 |
|--------|------|--------|------|------|
| `text` | string | '' | ✅ | 要显示的文本 |
| `speed` | number | 50 | ❌ | 打字速度（毫秒） |
| `mode` | 'normal' \| 'cursor' | 'normal' | ❌ | 显示模式 |
| `cursorSuffix` | string | '|' | ❌ | 光标字符 |
| `pauseOnComplete` | boolean | false | ❌ | 完成后是否暂停 |

### 事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| `complete` | - | 打字完成时触发 |
| `start` | - | 开始打字时触发 |

### 方法

| 方法名 | 参数 | 返回值 | 描述 |
|--------|------|--------|------|
| `pause` | - | void | 暂停打字 |
| `resume` | - | void | 恢复打字 |
| `reset` | - | void | 重置打字效果 |

### 使用示例

```vue
<template>
  <!-- 基础用法 -->
  <YmTypewriter 
    :text="message" 
    :speed="100"
    @complete="onComplete"
  />
  
  <!-- 带光标效果 -->
  <YmTypewriter 
    :text="message" 
    :speed="50"
    mode="cursor"
    cursor-suffix="|"
    :pause-on-complete="true"
    @complete="onComplete"
  />
</template>

<script setup>
import { ref } from 'vue';

const message = ref('Hello, World!');

const onComplete = () => {
  console.log('打字完成');
};
</script>
```

### 高级用法

```vue
<template>
  <YmTypewriter 
    ref="typewriterRef"
    :text="dynamicText" 
    :speed="typingSpeed"
    mode="cursor"
    @complete="onTypingComplete"
  />
</template>

<script setup>
import { ref } from 'vue';

const typewriterRef = ref();
const dynamicText = ref('');
const typingSpeed = ref(50);

const onTypingComplete = () => {
  console.log('打字完成');
};

// 控制打字机
const pauseTyping = () => {
  typewriterRef.value?.pause();
};

const resumeTyping = () => {
  typewriterRef.value?.resume();
};

const resetTyping = () => {
  typewriterRef.value?.reset();
};
</script>
```

---

## 组合使用示例

### 完整的聊天界面

```vue
<template>
  <view class="chat-container">
    <!-- 消息列表 -->
    <scroll-view class="message-list">
      <YmBubble 
        v-for="(msg, index) in messages" 
        :key="index"
        :message="msg.content"
        :position="msg.position"
        :is-markdown="msg.isMarkdown"
        :typing="msg.typing"
        :loading="msg.loading"
        :is-error="msg.isError"
        :files="msg.files"
        @bubble-click="onBubbleClick"
      >
        <template #footer v-if="msg.position === 'left'">
          <view class="message-actions">
            <button @click="copyMessage(msg.content)">复制</button>
          </view>
        </template>
      </YmBubble>
    </scroll-view>
    
    <!-- 消息发送器 -->
    <YmSender 
      :loading="isSending"
      :placeholder="'请输入消息...'"
      :show-online="true"
      @send="handleSend"
      @cancel="handleCancel"
    >
      <template #header>
        <YmAttachments 
          :items="attachmentFiles"
          :count="5"
          @update:items="onAttachmentsUpdate"
          @file-add="onFileAdd"
          @file-remove="onFileRemove"
        />
      </template>
    </YmSender>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const messages = ref([]);
const isSending = ref(false);
const attachmentFiles = ref([]);

const handleSend = async (event) => {
  const message = event.message?.trim();
  if (!message) return;
  
  // 添加用户消息
  messages.value.push({
    content: message,
    position: 'right',
    timestamp: Date.now()
  });
  
  // 添加AI消息（带打字机效果）
  messages.value.push({
    content: '',
    position: 'left',
    typing: true,
    isMarkdown: true
  });
  
  // 模拟AI回复
  setTimeout(() => {
    const aiResponse = generateAIResponse();
    const lastMessage = messages.value[messages.value.length - 1];
    lastMessage.content = aiResponse;
    lastMessage.typing = false;
  }, 1000);
};

const onAttachmentsUpdate = (files) => {
  attachmentFiles.value = files;
};

const onFileAdd = (files) => {
  console.log('添加文件:', files);
};

const onFileRemove = (file) => {
  console.log('删除文件:', file);
};

const copyMessage = (content) => {
  uni.setClipboardData({
    data: content,
    success: () => {
      uni.showToast({ title: '复制成功', icon: 'success' });
    }
  });
};

const generateAIResponse = () => {
  return `# 你好！👋\n\n我是AI助手，很高兴为您服务。有什么我可以帮助您的吗？`;
};
</script>
```

---

## 样式定制

### 全局样式变量

```less
// 在 App.vue 或全局样式文件中定义
:root {
  // 气泡样式
  --ym-bubble-padding: 20rpx 30rpx;
  --ym-bubble-radius: 50rpx;
  --ym-bubble-font-size: 30rpx;
  --ym-bubble-user-color: #4999FF;
  --ym-bubble-bot-color: #ffffff;
  
  // 发送器样式
  --ym-sender-border-radius: 50rpx;
  --ym-sender-background: #ffffff;
  --ym-sender-input-height: 80rpx;
  
  // 附件样式
  --ym-attachments-padding-bottom: 20rpx;
  --ym-attachments-scroll-gap: 20rpx;
  
  // 打字机样式
  --ym-typewriter-font-family: monospace;
}
```

### 主题定制

```less
// 深色主题
.dark-theme {
  --ym-bubble-bot-color: #2d2d2d;
  --ym-bubble-text-color: #ffffff;
  --ym-sender-background: #2d2d2d;
}

// 浅色主题
.light-theme {
  --ym-bubble-bot-color: #ffffff;
  --ym-bubble-text-color: #333333;
  --ym-sender-background: #ffffff;
}
```

---

## 最佳实践

### 1. 性能优化
- 使用 `v-if` 而不是 `v-show` 来控制组件显示
- 对于大量消息，考虑虚拟滚动
- 合理使用 `key` 属性

### 2. 用户体验
- 提供适当的加载状态
- 处理网络错误情况
- 支持键盘快捷键

### 3. 可访问性
- 添加适当的 `aria-label`
- 支持键盘导航
- 提供屏幕阅读器支持

### 4. 响应式设计
- 适配不同屏幕尺寸
- 支持横竖屏切换
- 考虑不同设备的输入方式

---

## 故障排除

### 常见问题

1. **组件不显示**
   - 检查是否正确导入组件
   - 确认 props 配置正确
   - 查看控制台错误信息

2. **样式不生效**
   - 检查 CSS 变量是否正确定义
   - 确认样式优先级
   - 查看是否有样式冲突

3. **事件不触发**
   - 检查事件名称是否正确
   - 确认事件处理函数存在
   - 查看组件是否被正确渲染

4. **打字机效果不工作**
   - 检查文本内容是否正确
   - 确认速度设置合理
   - 查看是否有其他样式干扰

### 调试技巧

1. 使用 Vue DevTools 检查组件状态
2. 在控制台输出关键变量
3. 检查网络请求和响应
4. 使用断点调试复杂逻辑

---

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基础聊天功能
- 支持文件上传
- 支持打字机效果
- 支持Markdown渲染

---

## 技术支持

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱: your-email@example.com
- 微信: your-wechat-id

---

**YM Chat AI** - 让聊天更智能，让沟通更高效！
