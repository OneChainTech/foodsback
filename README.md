# Restaurant Matching API

A Node.js/Express.js backend for a restaurant matching application with real-time chat capabilities.

## Features

- Restaurant listing with geolocation support
- User matching system
- Real-time chat using WebSocket
- JWT authentication
- Rate limiting
- Error handling

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and update the values
4. Start the server:
   ```bash
   npm start
   ```
   
For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Restaurants

- `GET /api/v1/restaurants` - Get restaurant list
  - Query parameters:
    - `latitude` (required): User's latitude
    - `longitude` (required): User's longitude
    - `radius` (optional): Search radius in meters (default: 3000)
    - `page` (optional): Page number (default: 1)
    - `pageSize` (optional): Items per page (default: 20)

### Matching

- `POST /api/v1/matching/start` - Start matching
  - Body parameters:
    - `restaurantId` (required): Restaurant ID
    - `userId` (required): User ID
    - `diningTime` (required): ISO8601 format
    - `preferences` (optional): Matching preferences

- `GET /api/v1/matching/users` - Get matching users
  - Query parameters:
    - `restaurantId` (required): Restaurant ID
    - `userId` (required): User ID
    - `lastUpdateTime` (optional): ISO8601 format

### WebSocket Chat

Connect to: `ws://localhost:3000/ws/chat?token={jwt_token}&chatId={chat_id}`

## Authentication

All API endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Error Codes

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error
