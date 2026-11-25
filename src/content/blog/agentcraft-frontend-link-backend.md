---
title: AgentCraft-前端到后端的链路
description: Github学习项目AgentCraft知识点梳理
pubDate: 2026-11-18
updatedDate: ''
categories:
  - Agent
tags: []
---

# 前端

### 1. 用户输入的内容先保存下来

- inputMessage 输入框内容
- currentConversation 当前会话对象
- uploadedImage 当前上传图片的相关信息
- uploadedImageId 已上传图片的ID
- messages 页面当前显示的消息列表 用户、AI消息等

### 2. 点击发送后先检查输入内容是否合法

- preventDefault()用来阻止表单默认提交行为
- 阻止没有有效文字并且也没有图片的行为
- 阻止没有当前会话的行为

### 3.构造页面显示的用户消息

- messageContent 在仅有文字的时候直接等于inputMessage
- 在既有文字又有图片的时候，将图片信息和文字消息拼接起来
- 最后前端拼接成再这个messageContent组装成userMessage

```plain
const userMessage = {
  id: Date.now(),
  conversationId: currentConversation.id,
  role: 'user',
  content: messageContent,
  imageUrl: uploadedImage?.url,
  createTime: new Date().toISOString()
};
理解为
```

```plain
userMessage = {
  id: 由当前时间生成的临时 ID,
  conversationId: 12,
  role: "user",
  content: "[图片: cat.png]\n这是什么？",
  imageUrl: 图片的 URL,
  createTime: 当前时间
}
```

##### 所以用户的输入信息的数据流为

```plain
inputMessage ────────┐
                     ├─→ messageContent ─→ userMessage.content
uploadedImage.name ──┘

uploadedImage.url ────────────────────────→ userMessage.imageUrl

currentConversation.id ──────────────────→ userMessage.conversationId
```

**`userMessage` 的作用是让前端页面立即显示用户刚发出的消息。** 它不是下面 `chatAPI.sendMessage` 直接发送的请求体。

### 4. 同时准备一个AI占位消息

- 此时后端还没有回答，为了良好的用户体验，所以前端先创建一个thinkingMessage

```mdx
const thinkingMessageId = Date.now() + 1;

const thinkingMessage = {
  id: thinkingMessageId,
  conversationId: currentConversation.id,
  role: 'assistant',
  content: '',
  isStreaming: true,
  processingStep: null,
  taskType: null,
  createTime: new Date().toISOString()
};
```

- thinkingMessage的主要作用就是等后端返回后，找到这条占位消息再替换它
- 同时将用户消息和AI占位消息先添加到页面消息列表上

```plain
setMessages(prev => [...prev, userMessage, thinkingMessage]);
```

- 随后就是清空输入框、清空图片状态、并且将loading设为true

### 5.接下来真正构建发给后端的内容

- 这里同样得考虑图片的问题分两种情况

```plain
let aiRequestContent = inputMessage;

if (uploadedImage && uploadedImageId) {
  aiRequestContent = `请根据图片内容回答问题。图片ID: ${uploadedImageId}\n图片名称: ${uploadedImage.name}\n图片URL: ${uploadedImage.url}\n问题: ${inputMessage}`;
}
```

- 这里图片内容更细就是为了和前面用来构造页面显示的userMessage.content做区别的，之前的只有图片名称和用户问题，这个真正要发送给后端内容中就应该传输提示词+图片ID+名称+URL+用户问题了

### 6.把三个关键业务字段打包，调用前端的API

- 真实调用接口的是:

```plain
const response = await chatAPI.sendMessage({
  userId,  //这里是简写等于{ userId: userId },localstorage里直接拿的
  conversationId: currentConversation.id,
  content: aiRequestContent
}, {
  signal: controller.signal
});
```

- sendMessage第一个参数就是业务数据

```plain
{
  userId: 1,  
  conversationId: 12,  
  content: "你好"
}
```

- 第二个参数signal用于支持前端取消请求。

### 7.chatAPI 把数据交给了Axios

- 跳转到api/index.js后

```plain
sendMessage: (data, config) => api.post('/chat/messages', data, config),
```

- 该文件前面配置了`baseURL:'/api'`
- 所以最后的请求路径为`POST /api/chat/messages`

# 后端

### 8.Java后端接受请求

> 接口在ChatController.java里

- 类上有`@RequsetMapping("api/chat")`
- 方法上有

```plain
@PostMapping("/messages")
public Result<Message> sendMessage(@RequestBody ChatRequest request) {
    return Result.success(
        chatService.sendMessage(
            request.getUserId(),
            request.getConversationId(),
            request.getContent()
        )
    );
}
```

- `@RequestBody ChatRequest request` 将请求体的数据绑定到ChatRequset对象，这个对象在方法里叫request，然后代码读取：

```plain
request.getUserId()           // 前端的userId
request.getConversationId()   // 前端的conversationId
request.getContent()          // 前端的content
```

- 接着Controller把三个值交给chatService.sendMessage
- 接下来就是Java调用AI服务了，这作为下一篇博客记录学习，先跳转到Java拿到AI服务的结果，然后返回前端

### 9.结果返回前端后，替换AI占位消息

- Java方法返回 `Result.success(...)`
- 前端的await成功后拿到结果后，继续执行

```plain
const aiMessage = {
  id: response.data.id || thinkingMessageId,
  conversationId: currentConversation.id,
  role: 'assistant',
  content: response.data.content,
  sources: response.data.sources,
  feedbackType: response.data.feedbackType || null,
  taskType: response.data.taskType || null,
  createTime: response.data.createTime || new Date().toISOString()
};
```

- 随后替换占位消息，根据thinkingMessageId找到之前的占位消息，替换真正的aiMessage

```plain
setMessages(prev =>
  prev.map(msg =>
    msg.id === thinkingMessageId ? aiMessage : msg
  )
);
```

- React 根据更新后的 `messages` 重新渲染，页面就显示出了 AI 回复。
- 如果请求失败，则会进入 `catch`；代码会判断是否为取消请求，并把占位消息替换为“已停止回答”或错误提示。
