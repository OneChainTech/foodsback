# 饭搭子 API 文档

## 基础信息

- 基础URL: `http://localhost:8080`
- 所有请求都需要在 Header 中携带 JWT Token:
  ```
  Authorization: Bearer <your_jwt_token>
  ```

## API 端点

### 1. 获取餐厅列表

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
    "code": 0,
    "message": "success",
    "data": {
        "total": 1,
        "restaurants": [
            {
                "id": "c8cc763d-f1e6-4856-949c-3f3de71e33b3",
                "name": "江南小馆",
                "address": "上海市黄浦区南京东路123号",
                "location": {
                    "latitude": 31.2304,
                    "longitude": 121.4737
                },
                "categories": ["江浙菜", "家常菜"],
                "rating": 4.5,
                "averagePrice": 88,
                "imageUrl": "https://example.com/restaurant1.jpg",
                "distance": 0
            }
        ]
    }
}
```

### 2. 开始匹配

创建一个新的匹配请求。

**请求**
- 方法: `POST`
- 路径: `/api/v1/matching/start`
- Content-Type: `application/json`
- 请求体:
```json
{
    "restaurantId": "c8cc763d-f1e6-4856-949c-3f3de71e33b3",
    "userId": "399cd738-6fdf-494e-b881-d0ef373022fb",
    "diningTime": "2024-12-10T14:00:00Z",
    "preferences": {
        "gender": "any",
        "ageRange": {
            "min": 20,
            "max": 40
        }
    }
}
```

**响应**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "matchingId": "eb94abdf-1097-46ac-9295-a219c9d9499d",
        "status": "matching",
        "startTime": "2024-12-10T02:16:03.923Z",
        "expiresIn": 3600
    }
}
```

### 3. 查询匹配用户

查询与当前用户匹配的其他用户。

**请求**
- 方法: `GET`
- 路径: `/api/v1/matching/users`
- 参数:
  - `restaurantId` (必需): 餐厅ID
  - `userId` (必需): 当前用户ID
  - `lastUpdateTime` (可选): 上次更新时间，格式为ISO8601

**响应**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "users": [
            {
                "id": "user-id",
                "nickname": "用户昵称",
                "avatarUrl": "头像URL",
                "gender": "性别",
                "age": 25
            }
        ],
        "updateTime": "2024-12-10T02:16:13.536Z"
    }
}
```

### 4. WebSocket 聊天

通过 WebSocket 进行实时聊天。

**连接**
- URL: `ws://localhost:8080/ws/chat`
- 参数:
  - `token`: JWT token
  - `chatId`: 聊天ID

**消息格式**

发送消息:
```json
{
    "type": "message",
    "data": {
        "receiverId": "接收者用户ID",
        "content": "消息内容",
        "contentType": "text",
        "timestamp": "2024-12-10T02:16:13Z"
    }
}
```

接收消息:
```json
{
    "type": "message",
    "data": {
        "senderId": "发送者用户ID",
        "content": "消息内容",
        "contentType": "text",
        "timestamp": "2024-12-10T02:16:13Z",
        "status": "delivered"
    }
}
```

## 状态码说明

- 0: 成功
- 400: 请求参数错误
- 401: 未授权
- 404: 资源不存在
- 500: 服务器内部错误

## 注意事项

1. 所有请求必须包含有效的 JWT Token
2. 时间格式统一使用 ISO8601 标准
3. WebSocket 连接在断开后需要自动重连
4. 匹配状态会在1小时后过期
