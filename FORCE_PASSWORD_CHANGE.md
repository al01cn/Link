# 强制修改默认管理员密码功能

## 功能概述

为了提高系统安全性，当用户使用默认管理员账号密码（Loooong/Loooong123）登录时，系统会强制弹出修改密码对话框，要求用户立即修改管理员账号和密码。

## 功能特点

### 1. 强制性
- 对话框无法关闭（没有关闭按钮）
- 无法通过ESC键或点击背景关闭
- 必须完成密码修改才能继续使用系统

### 2. 安全性
- 自动检测默认账号（isDefault标识）
- 显示明确的安全警告信息
- 提供密码强度要求（至少6位）
- 确认密码验证

### 3. 用户体验
- 清晰的警告提示和操作指导
- 实时表单验证
- 友好的错误提示
- 密码可见性切换
- 安全建议提示

### 4. 国际化
- 支持中英文切换
- 所有文本都已翻译

## 技术实现

### 文件结构

```
components/
  └── ForcePasswordChangeDialog.tsx    # 强制修改密码对话框组件
lib/
  ├── AdminContext.tsx                 # 管理员上下文（已更新）
  └── translations.ts                  # 翻译文件（已添加相关翻译）
app/api/admin/
  ├── login/route.ts                   # 登录API（返回isDefault标识）
  └── change-password/route.ts         # 修改密码API（更新isDefault为false）
```

### 核心逻辑

1. **登录检测**
   - 用户登录时，API返回`isDefault`标识
   - AdminContext接收并存储该标识

2. **对话框显示**
   - AdminContext检测到`isAuthenticated && isDefaultAccount`时
   - 自动渲染ForcePasswordChangeDialog组件
   - 对话框设置为modal模式，无法关闭

3. **密码修改**
   - 用户填写表单并提交
   - 调用`/api/admin/change-password`接口
   - 成功后将`isDefault`设置为false
   - 清除登录状态，要求重新登录

4. **重新登录**
   - 用户使用新凭据登录
   - 由于`isDefault`已为false，不再弹出强制修改对话框

## 数据库模型

Admin表包含以下字段：

```prisma
model Admin {
  id        String   @id @default(uuid())
  username  String   @unique
  password  String   // 加密后的密码
  isDefault Boolean  @default(false) // 是否为默认账户
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## API接口

### 登录接口 POST /api/admin/login

**请求体：**
```json
{
  "username": "Loooong",
  "password": "Loooong123"
}
```

**响应：**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "username": "Loooong",
  "isDefault": true  // 标识是否为默认账户
}
```

### 修改密码接口 POST /api/admin/change-password

**请求头：**
```
Authorization: Bearer {token}
```

**请求体：**
```json
{
  "currentPassword": "Loooong123",
  "newUsername": "admin",
  "newPassword": "newpassword123"
}
```

**响应：**
```json
{
  "success": true,
  "message": "管理员信息已更新"
}
```

## 使用流程

### 首次登录（默认账号）

1. 用户访问系统
2. 输入默认账号：Loooong / Loooong123
3. 点击登录
4. **立即弹出强制修改密码对话框**
5. 用户必须修改密码才能继续
6. 修改成功后自动退出
7. 使用新凭据重新登录

### 后续登录（已修改密码）

1. 用户访问系统
2. 输入新的账号密码
3. 点击登录
4. 直接进入系统，不再弹出强制修改对话框

## 安全建议

对话框中显示的安全建议：

- ✅ 使用强密码，包含字母、数字和特殊字符
- ✅ 不要使用容易猜测的用户名和密码
- ✅ 定期更换管理员密码

## 测试步骤

1. **准备环境**
   ```bash
   bun run dev
   ```

2. **访问系统**
   - 打开浏览器访问 http://localhost:3000

3. **使用默认账号登录**
   - 用户名：Loooong
   - 密码：Loooong123

4. **验证强制弹窗**
   - 确认对话框自动弹出
   - 确认无法关闭对话框
   - 确认显示安全警告

5. **测试表单验证**
   - 测试空表单提交
   - 测试错误密码
   - 测试密码长度验证
   - 测试确认密码不匹配

6. **成功修改密码**
   - 输入正确信息
   - 提交表单
   - 验证自动退出

7. **使用新凭据登录**
   - 使用新账号密码登录
   - 验证不再弹出强制修改对话框

## 注意事项

1. **默认账号创建**
   - 首次使用默认账号登录时，系统会自动创建Admin记录
   - isDefault字段设置为true

2. **密码修改后**
   - isDefault字段更新为false
   - 用户需要使用新凭据重新登录

3. **重置默认账号**
   - 如需重置，删除数据库中的Admin表记录
   - 下次使用默认账号登录时会重新创建

4. **生产环境建议**
   - 部署前应该修改或禁用默认账号
   - 考虑添加首次部署时的强制初始化流程
   - 定期提醒管理员更换密码

## 相关文件

- `components/ForcePasswordChangeDialog.tsx` - 强制修改密码对话框
- `lib/AdminContext.tsx` - 管理员上下文
- `lib/translations.ts` - 翻译文件
- `app/api/admin/login/route.ts` - 登录API
- `app/api/admin/change-password/route.ts` - 修改密码API
- `test-force-password.html` - 测试指南

## 更新日志

### 2024-12-18
- ✅ 创建ForcePasswordChangeDialog组件
- ✅ 更新AdminContext支持isDefault标识
- ✅ 更新登录API返回isDefault
- ✅ 添加中英文翻译
- ✅ 实现强制修改密码逻辑
- ✅ 添加表单验证
- ✅ 完成功能测试
- ✅ 添加防止改回默认凭据的验证
- ✅ 前端和后端双重验证防护
- ✅ 移除登录页面默认账号显示
- ✅ 在README中添加默认账号说明

## 防止改回默认凭据功能

### 验证规则

为了确保系统安全，系统会阻止用户将管理员凭据改回默认值：

1. **完全匹配检查**：不能同时使用用户名 `Loooong` 和密码 `Loooong123`
2. **用户名检查**：不能单独使用默认用户名 `Loooong`
3. **密码检查**：不能单独使用默认密码 `Loooong123`

### 实现层面

- **前端验证**：在ForcePasswordChangeDialog组件中进行实时验证
- **后端验证**：在修改密码API中进行服务端验证
- **错误提示**：提供清晰的中英文错误提示信息

### 错误提示

- 中文：`不能使用默认的管理员账号和密码，请设置不同的凭据以确保安全`
- 英文：`Cannot use default admin username and password, please set different credentials for security`
