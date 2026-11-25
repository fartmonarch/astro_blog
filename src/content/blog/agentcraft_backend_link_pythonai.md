---
title: AgentCraft-Java后端到PythonAI服务的链路
description: 项目学习 AgentCraft-Java后端到PythonAI服务的链路
pubDate: 2026-11-19
updatedDate: ''
categories:
  - Agent
tags: []
---

整体路线先看一遍：

ChatController.sendMessage
↓
ChatServiceImpl.sendMessage
保存消息、准备对话上下文
↓
AiServiceImpl.ask
检查缓存；需要时构造 HTTP 请求
↓
POST Python /api/ask
↓
Python ask_question
处理问题并返回 answer、sources、task_type
↓
Java 把结果组装成 AiResponse
↓
ChatServiceImpl 保存并返回 AI 消息
↓
Controller 包装结果，返回前端

# Java后端

### 1.从ChatController跳到ChatService

书接上篇前端到后端的链路，请求数据包是到了 chatService.sendMessage
其中包含着三个值

```plain
request.getUserId()           → 用户 ID
request.getConversationId()   → 会话 ID
request.getContent()          → 用户消息内容

```

这里溯源回去先回找到一个接口ChatService：它声明了“聊天服务有一个 `sendMessage` 方法”，但这里没有写具体怎么处理。

```plain
public interface ChatService {
    Message sendMessage(Long userId, Long conversationId, String content);
}

```

随后ChatServiceImpl实现了ChatService接口

```plain
public class ChatServiceImpl implements ChatService {
    // ...
}

```

# 2. ChatServiceImpl接受三个参数

```plain
public Message sendMessage(Long userId, Long conversationId, String content) {...}

```

##### 接受到参数后先做保存处理

```plain
Message userMsg = new Message();

userMsg.setConversationId(conversationId);
userMsg.setRole("user");
userMsg.setContent(content);
userMsg.setCreateTime(LocalDateTime.now());

messageMapper.insert(userMsg);

```

大致流程就是

```plain
content
   ↓
userMsg.content
   ↓
保存用户消息

```

这里还有一个额外处理，判断该消息是不是对话中的第一条消息，如果是会调用生成标题的逻辑。

# 3.Java整理对话上下文

```plain
List<Message> contextMessages =
    conversationContextService.getConversationContext(conversationId, 10);

```

它会根据conversationId获取最近的消息。代码随后把消息拼接成字符串：

```plain
StringBuilder contextBuilder = new StringBuilder();

for (Message msg : contextMessages) {
    contextBuilder
        .append(msg.getRole())
        .append(": ")
        .append(msg.getContent())
        .append("\n");
}

String conversationContext = contextBuilder.toString();

```

这里的变化是
列表中有多个 Message 对象
↓ 依次取出每条消息
只保留 role 和 content
↓ 加上冒号、空格和换行符，拼接
得到一个 String 字符串

# 4.调用AiService: 三个参数又换名称

```plain
AiResponse aiResponse = aiService.ask(content, conversationContext, userId);

```

这句话是Java调用AI服务逻辑的入口。右边先执行，得到结果后，放在左边的aiResponse变量中。

ChatServiceImpl 中 AiService.ask 中

content → question
conversationContext → context
userId → userId

# 5.先查缓存：命中时可能不请求Python

# 6.构造发给Python的请求体

```plain
Map<String, Object> requestBody = new HashMap<>();

requestBody.put("question", question);
requestBody.put("context", context);

```

随后再根据userId判断是不是管理员，再查询用户名

```plain
boolean isAdmin = (userId != null && userId == 1L);

```

如果查到用户，会加入：

```plain
requestBody.put("username", username);

```

最后加入：

```plain
requestBody.put("is_admin", isAdmin);

```

所以发给 Python 的请求体大致可能是：

```plain
{
  "question": "什么是数据库索引？",
  "context": "user: 什么是数据库索引？\n",
  "username": "某个用户名",
  "is_admin": false
}

```

# 7.Java发送HTTP请求

```plain
HttpHeaders headers = new HttpHeaders();
headers.setContentType(MediaType.APPLICATION_JSON);

HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

```

requestBody → 请求体，里面装 question、context 等数据
headers → 请求头，说明请求内容是 JSON
entity → 把请求体和请求头放在一起
随后构造地址：

```plain
String url = aiServiceUrl + "/ask";

```

`aiServiceUrl` 来自 src/main/resources/application.yml：

```plain
ai:
  service:
    url: ${AI_SERVICE_URL:http://127.0.0.1:8000/api}

```

含义是：如果设置了环境变量 `AI_SERVICE_URL`，使用它；否则使用默认值：

```plain
http://127.0.0.1:8000/api

```

默认情况下拼出来：

```plain
http://127.0.0.1:8000/api + /ask
                  ↓
POST http://127.0.0.1:8000/api/ask

```

真正发请求的是imAiServiceImpl.java：

```plain
response = restTemplate.postForEntity(url, entity, Map.class);

```

# 8.Python接收

在python-service/main.py中

```plain
app.include_router(router, prefix="/api")

```

这给路由加了 `/api` 前缀，然后在python-service/api/routes.py中

```plain
@router.post("/ask")
async def ask_question(request: ChatRequest):

```

Python 中的 `ChatRequest` 这里定义了接口接收的数据结构

```plain
class ChatRequest(BaseModel):
    question: str
    context: str = ""
    conversation_id: str = None
    username: str = None
    is_admin: bool = False

```

# 9.Python怎么样处理并且返回

这里也还有一个分支，根据问题中是否含有身份用户名关键词，来决定是不是直接构造身份回答还是调用pythonAI服务把问题和上下文等信息交给路由逻辑
这里会启用router_agent来将问题信息交给PythonAI服务

```plain
result = router_agent.route(
     input_text=request.question,
     conversation_id=request.conversation_id,
     context=request.context,
     username=request.username,
     is_admin=request.is_admin
)
 response = {
    "answer": result.get("answer", ""),
    "sources": result.get("sources", []),
    "task_type": result.get("task_type", "unknown")
}

return response

```

answer → 回答内容
sources → 参考来源
task_type → 任务类型
这里先不深入 `router_agent.route()` 内部；那正好是接下来 Python AI 服务内部的学习内容。

# 10.Python结果回到Java，再回前端

Python响应返回后，AiServicelmpl读取响应体：

```plain
Map<String, Object> body = response.getBody();

String answer = (String) body.get("answer");
aiResponse.setAnswer(answer);

```

也会读取 `task_type` 和 `sources`，设置到 Java 的 `aiResponse` 中。
数据流如下
Python 响应字段 Java AiResponse

answer → answer
sources → sources
task_type → taskType

随后 `AiServiceImpl.ask` 返回 `aiResponse`，回到 `ChatServiceImpl`

```plain
AiResponse aiResponse = aiService.ask(content, conversationContext, userId);

String answer = aiResponse.getAnswer();
String taskType = aiResponse.getTaskType();

```

接着 Java 创建 AI 消息：

```plain
Message aiMsg = new Message();
aiMsg.setConversationId(conversationId);
aiMsg.setRole("assistant");
aiMsg.setContent(answer);
aiMsg.setSources(sourcesJson);
aiMsg.setTaskType(taskType);

messageMapper.insert(aiMsg);

return aiMsg;

```

python回到前端内容字段的名称变化

Python 的 answer
↓
Java AiResponse 的 answer
↓
Java Message 的 content
↓
前端 response.data.content
↓
前端 aiMessage.content
