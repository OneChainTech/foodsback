# 饭搭子服务端部署文档

## 关于 PM2

PM2 是一个 Node.js 应用进程管理器，提供以下功能：
- 应用崩溃自动重启
- 服务器重启后自动启动应用
- 多核心负载均衡
- 实时监控和日志管理

## 部署步骤

### 1. 安装 PM2
```bash
npm install -g pm2
```

### 2. 安装项目依赖
```bash
# 进入项目目录
cd /path/to/foodsback

# 安装依赖
npm install --production
```

### 3. 初始化数据库
```bash
node src/database/seed.js
```

### 4. 启动服务
```bash
# 单核心启动
pm2 start src/app.js --name "foodsback"

# 或者多核心启动（推荐）
pm2 start src/app.js -i max --name "foodsback"

# 设置开机自启
pm2 startup
pm2 save
```

## 常用维护命令

### PM2 状态查看
```bash
# 查看所有应用状态
pm2 status

# 查看应用日志
pm2 logs foodsback

# 查看实时监控
pm2 monit
```

### 应用管理
```bash
# 重启应用
pm2 restart foodsback

# 停止应用
pm2 stop foodsback

# 删除应用
pm2 delete foodsback
```

### 日志管理
```bash
# 查看实时日志
pm2 logs foodsback

# 查看历史日志
pm2 logs foodsback --lines 1000

# 清空日志
pm2 flush
```

## 注意事项

1. 环境配置
   - 确保 `.env` 文件存在并配置正确
   - 检查 JWT_SECRET 是否已设置
   - 确保端口 8080 可访问

2. 数据库
   - 数据库文件位于项目根目录的 `database.sqlite`
   - 建议定期备份数据库文件

3. 性能优化
   - 使用多核心模式可以提高性能
   - 可以通过 `pm2 monit` 监控应用性能

4. 故障排查
   - 使用 `pm2 logs` 查看错误日志
   - 检查系统资源使用情况
   - 确保数据库文件权限正确

## 服务器要求

- Node.js v16.x 或更高版本
- 至少 1GB RAM
- 开放端口 8080
- 建议使用 Ubuntu 20.04 或更高版本

如需帮助或遇到问题，请查看：
- PM2 官方文档：https://pm2.keymetrics.io/docs/usage/quick-start/
- 项目 Issues：[GitHub Issues](https://github.com/your-repo/issues)
