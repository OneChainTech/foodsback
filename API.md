# 饭搭子 API 文档

## 基础信息

- 基础URL: `http://localhost:8080`
- 所有请求（除了登录）都需要在 Header 中携带 JWT Token:
  ```
  Authorization: Bearer <your_jwt_token>
  ```

## API 端点

### 1. 用户登录

获取访问令牌（JWT Token）。

**请求**
- 方法: `POST`
- 路径: `/api/v1/auth/login`
- Content-Type: `application/json`
- 请求体:
```json
{
    "userId": "user-001"
}
```

**响应**
```json
{
    "code": 200,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIs...",
        "user": {
            "id": "user-001",
            "name": "张三",
            "avatar": "https://example.com/avatar1.jpg"
        }
    }
}
```

### 2. 获取餐厅列表

获取指定位置附近的餐厅列表。

**请求**
- 方法: `GET`
- 路径: `/api/v1/restaurants`
- 参数:
  - `latitude` (必需): 纬度，如 31.2304
  - `longitude` (必需): 经度，如 121.4737
  - `radius` (可选): 搜索半径，单位米，默认 3000
  - `page` (可选): 页码，默认 1
  - `pageSize` (可选): 每页数量，默认 20

**响应**
```json
{
    "code": 200,
    "data": {
        "restaurants": [
            {
                "id": "rest-001",
                "name": "江南小馆",
                "address": "上海市黄浦区南京东路123号",
                "latitude": 31.2304,
                "longitude": 121.4737,
                "categories": ["江浙菜", "家常菜"],
                "rating": 4.5,
                "averagePrice": 88,
                "imageUrl": "https://example.com/restaurant1.jpg",
                "distance": 0
            }
        ],
        "total": 1,
        "page": 1,
        "pageSize": 20
    }
}
```

### 3. 开始匹配

创建一个新的匹配请求。用户ID会从认证token中获取。

**请求**
- 方法: `POST`
- 路径: `/api/v1/matching/start`
- Content-Type: `application/json`
- 请求体:
```json
{
    "restaurantId": "rest-001",
    "diningTime": "2024-12-10T19:00:00.000Z",
    "preferences": {
        "gender": "female",
        "minAge": 25,
        "maxAge": 35
    }
}
```

**响应**
```json
{
    "code": 200,
    "data": {
        "matchId": "e67055fd-03fe-4f77-b3d8-3e6c8d976c35",
        "status": "pending"
    }
}
```

### 4. 查询匹配用户

查询与当前用户匹配的其他用户。用户ID会从认证token中获取。

**请求**
- 方法: `GET`
- 路径: `/api/v1/matching/users`
- 参数:
  - `restaurantId` (必需): 餐厅ID
  - `lastUpdateTime` (可选): 上次更新时间，用于增量更新

**响应**
```json
{
    "code": 200,
    "data": {
        "users": [
            {
                "userId": "user-002",
                "name": "李四",
                "avatar": "https://example.com/avatar2.jpg",
                "preferences": {
                    "gender": "female",
                    "age": 28
                },
                "matchId": "e67055fd-03fe-4f77-b3d8-3e6c8d976c35",
                "diningTime": "2024-12-10T19:00:00.000Z"
            }
        ]
    }
}
```

### 5. WebSocket 聊天

通过 WebSocket 进行实时聊天。

**连接**
- URL: `ws://localhost:8080/api/v1/chat`
- 参数:
  - `token`: JWT token（必需，用于认证）
  - `matchId`: 匹配ID（必需，标识聊天会话）

**消息格式**

1. 发送消息：
```json
{
    "type": "message",
    "data": {
        "content": "你好，一起吃饭吧！",
        "contentType": "text"
    }
}
```

2. 接收消息：
```json
{
    "type": "message",
    "data": {
        "messageId": "msg-001",
        "senderId": "user-001",
        "senderName": "张三",
        "content": "你好，一起吃饭吧！",
        "contentType": "text",
        "timestamp": "2024-12-10T08:31:33.000Z",
        "status": "delivered"
    }
}
```

3. 系统消息：
```json
{
    "type": "system",
    "data": {
        "messageId": "sys-001",
        "content": "对方已加入聊天",
        "timestamp": "2024-12-10T08:31:33.000Z"
    }
}
```

4. 错误消息：
```json
{
    "type": "error",
    "data": {
        "code": 400,
        "message": "Invalid message format"
    }
}
```

**消息类型 (contentType)**
- `text`: 文本消息
- `image`: 图片消息（base64编码）
- `location`: 位置信息

**消息状态 (status)**
- `sending`: 发送中
- `delivered`: 已送达
- `read`: 已读
- `failed`: 发送失败

### 6. 获取聊天历史

获取与特定匹配用户的聊天历史记录。

**请求**
- 方法: `GET`
- 路径: `/api/v1/chat/history`
- 参数:
  - `matchId`: 匹配ID（必需）
  - `before`: 消息ID（可选，用于分页，获取此消息之前的历史记录）
  - `limit`: 每页消息数量（可选，默认20，最大50）

**响应**
```json
{
    "code": 200,
    "data": {
        "messages": [
            {
                "messageId": "msg-001",
                "senderId": "user-001",
                "senderName": "张三",
                "content": "你好，一起吃饭吧！",
                "contentType": "text",
                "timestamp": "2024-12-10T08:31:33.000Z",
                "status": "read"
            }
        ],
        "hasMore": false
    }
}
```

### 7. 更新消息状态

更新消息的状态（例如标记为已读）。

**请求**
- 方法: `PUT`
- 路径: `/api/v1/chat/messages/status`
- Content-Type: `application/json`
- 请求体:
```json
{
    "matchId": "match-001",
    "messageIds": ["msg-001", "msg-002"],
    "status": "read"
}
```

**响应**
```json
{
    "code": 200,
    "data": {
        "updated": 2
    }
}
```

## 错误码

- 200: 成功
- 400: 请求参数错误
- 401: 未认证（缺少token）
- 403: token无效或过期
- 404: 资源不存在
- 500: 服务器内部错误

## 数据库模型

### Restaurant
- id: 餐厅ID
- name: 餐厅名称
- address: 地址
- latitude: 纬度
- longitude: 经度
- categories: 分类（数组）
- rating: 评分
- averagePrice: 人均价格
- imageUrl: 图片URL

### User
- id: 用户ID
- name: 用户名
- avatar: 头像URL
- preferences: 用户偏好（JSON对象）

### Match
- id: 匹配ID
- restaurantId: 餐厅ID
- userId: 用户ID
- diningTime: 用餐时间
- preferences: 匹配偏好（JSON对象）
- status: 匹配状态（pending/matched/expired）

### Message
- id: 消息ID
- matchId: 匹配ID
- senderId: 发送者ID
- content: 消息内容
- contentType: 消息类型（text/image/location）
- timestamp: 发送时间
- status: 消息状态（sending/delivered/read/failed）
