# 用户认证系统设置指南

本项目已成功集成了完整的用户认证系统，包括登录、会话管理和用户管理功能。

## 🚀 功能特性

### ✅ 已实现的功能

1. **用户认证**
   - 安全的密码哈希（bcrypt）
   - 基于 iron-session 的会话管理
   - 自动会话检查和续期

2. **登录系统**
   - 美观的登录页面 (`/login`)
   - 表单验证和错误处理
   - 登录后自动跳转到管理面板

3. **权限保护**
   - 管理面板路由保护
   - 未登录用户自动重定向到登录页
   - API 路由权限验证

4. **用户管理**
   - 用户列表查看 (`/admin/users`)
   - 用户搜索和分页
   - 用户状态管理

5. **用户界面**
   - 顶部导航显示当前用户信息
   - 用户头像（支持自定义或自动生成）
   - 下拉菜单包含退出登录功能

## 📋 数据库表结构

系统使用以下用户表结构：

```sql
CREATE TABLE "user" (
  "id" varchar(32) PRIMARY KEY NOT NULL,
  "user_name" varchar(255),
  "password" varchar(255) NOT NULL,
  "avatar" varchar(255),
  "email" varchar(255),
  "role" varchar(255),
  "status" varchar(255) NOT NULL DEFAULT 'NORMAL',
  "create_time" timestamp(6) NOT NULL DEFAULT now()
);
```

## 🛠️ 快速开始

### 1. 安装依赖

所需的依赖已经安装：
- `bcryptjs` - 密码哈希
- `iron-session` - 会话管理
- `zod` - 数据验证

### 2. 创建默认管理员账户

运行以下命令创建默认管理员账户：

```bash
npm run create-admin
```

这将创建一个默认管理员账户：
- **用户名**: `admin`
- **密码**: `admin123`
- **邮箱**: `admin@example.com`
- **角色**: `admin`

⚠️ **重要**: 首次登录后请立即修改密码！

### 3. 环境变量设置

确保设置了以下环境变量（用于会话加密）：

```env
SECRET_COOKIE_PASSWORD=your-super-secret-password-at-least-32-characters-long
```

如果不设置，系统将使用默认值，但建议在生产环境中设置自定义密钥。

### 4. 启动应用

```bash
npm run dev
```

现在您可以：
1. 访问 `http://localhost:3000/login` 登录
2. 使用创建的管理员账户登录
3. 登录后自动跳转到 `http://localhost:3000/admin`

## 🗂️ 文件结构

### 新增的核心文件

```
src/
├── app/
│   ├── login/
│   │   └── page.tsx                 # 登录页面
│   ├── admin/
│   │   ├── layout.tsx               # 更新：集成认证保护
│   │   ├── Header.tsx               # 更新：用户信息显示
│   │   ├── ImprovedSidebar.tsx      # 更新：添加用户管理链接
│   │   └── users/
│   │       └── page.tsx             # 用户管理页面
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts       # 登录 API
│       │   ├── logout/route.ts      # 登出 API
│       │   └── profile/route.ts     # 用户信息 API
│       └── users/
│           └── route.ts             # 用户管理 API
├── components/
│   └── AuthGuard.tsx                # 认证守卫组件
├── server/
│   ├── auth.ts                      # 会话管理工具
│   ├── domain/
│   │   └── models.ts                # 更新：添加 User 模型
│   ├── repositories/
│   │   └── users.repository.ts      # 用户数据访问层
│   ├── services/
│   │   └── users.service.ts         # 用户业务逻辑层
│   ├── db.ts                        # 更新：添加用户表创建
│   └── validators.ts                # 更新：添加用户相关验证
└── scripts/
    └── create-admin-user.mjs        # 创建管理员脚本
```

## 🔐 API 端点

### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/profile` - 获取当前用户信息

### 用户管理
- `GET /api/users` - 获取用户列表（需要认证）
- `POST /api/users` - 创建新用户（需要认证）
- `PUT /api/users` - 更新用户信息（需要认证）
- `DELETE /api/users` - 删除用户（需要认证）

## 🔧 自定义配置

### 会话配置

在 `src/server/auth.ts` 中可以自定义会话设置：

```typescript
export const sessionOptions: SessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD || "default-secret",
  cookieName: "admin-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
  },
};
```

### 密码策略

当前密码要求：
- 最少 6 个字符
- 使用 bcrypt 进行哈希（成本因子：12）

您可以在 `src/server/validators.ts` 中修改密码验证规则。

## 🛡️ 安全特性

1. **密码安全**
   - 使用 bcrypt 进行密码哈希
   - 高强度成本因子（12）

2. **会话安全**
   - HttpOnly cookies
   - 安全的会话令牌
   - 自动会话过期

3. **输入验证**
   - 使用 Zod 进行严格的数据验证
   - SQL 注入防护（参数化查询）

4. **路由保护**
   - 自动重定向未认证用户
   - API 路由权限检查

## 🎨 用户界面特性

1. **响应式设计**
   - 移动设备友好
   - 深色主题
   - 现代化 UI 组件

2. **用户体验**
   - 加载状态指示器
   - 错误信息显示
   - 自动表单验证

3. **可访问性**
   - 键盘导航支持
   - 屏幕阅读器友好
   - ARIA 标签

## 🔄 下一步改进建议

1. **功能增强**
   - [ ] 忘记密码功能
   - [ ] 二次认证（2FA）
   - [ ] 更细粒度的角色权限
   - [ ] 用户注册功能

2. **安全改进**
   - [ ] 登录尝试限制
   - [ ] 密码复杂度要求
   - [ ] 会话活动日志

3. **用户体验**
   - [ ] 用户头像上传
   - [ ] 个人资料编辑
   - [ ] 深色/浅色主题切换

## 🐛 故障排除

### 常见问题

1. **无法登录**
   - 检查数据库连接
   - 确认用户账户已创建（运行 `npm run create-admin`）
   - 验证用户名和密码是否正确

2. **会话问题**
   - 检查 `SECRET_COOKIE_PASSWORD` 环境变量
   - 清除浏览器 cookies
   - 重启开发服务器

3. **权限问题**
   - 确认用户状态为 'NORMAL'
   - 检查 API 路由权限验证

### 调试技巧

1. 查看浏览器控制台的错误信息
2. 检查网络请求的响应状态
3. 使用 `console.log` 在服务端添加调试信息

## 📞 支持

如果您遇到任何问题或需要帮助，请：

1. 检查控制台错误信息
2. 查看本文档的故障排除部分
3. 检查相关代码文件的注释

---

🎉 **恭喜！** 您的管理面板现在已经具备完整的用户认证系统！
