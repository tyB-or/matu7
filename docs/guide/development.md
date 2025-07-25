# Matu7 开发者指南

本文档提供了Matu7项目的开发指南，包括项目结构、环境搭建、编译打包和贡献指南。

## 项目结构

Matu7项目采用Go语言开发后端，使用HTML/CSS/JavaScript开发前端，整体结构如下：

```
/matu7/
├── config/              # 配置文件目录
├── docs/                # 文档目录
│   ├── api/             # API文档
│   ├── examples/        # 示例文档
│   └── guide/           # 使用指南
├── handlers/            # HTTP请求处理器
│   ├── auth.go          # 认证处理器
│   ├── offline_tools.go # 离线工具处理器
│   ├── web_notes.go     # 网页笔记处理器
│   └── web_tools.go     # 网页工具处理器
├── main.go              # 程序入口
├── models/              # 数据模型
│   ├── offline_tool.go  # 离线工具模型
│   ├── web_note.go      # 网页笔记模型
│   └── web_tool.go      # 网页工具模型
├── notes/               # 笔记存储目录
├── public/              # 前端资源
│   ├── css/             # 样式文件
│   ├── icons/           # 图标文件
│   ├── img/             # 图片资源
│   ├── js/              # JavaScript文件
│   ├── index.html       # 主页面
│   └── login.html       # 登录页面
├── routes/              # 路由配置
│   ├── offline_tools.go # 离线工具路由
│   └── routes.go        # 主路由配置
├── services/            # 业务逻辑服务
│   ├── auth_service.go  # 认证服务
│   ├── offline_tools.go # 离线工具服务
│   ├── proc_other.go    # 非Windows平台进程处理
│   ├── proc_windows.go  # Windows平台进程处理
│   ├── web_notes.go     # 网页笔记服务
│   └── web_tools.go     # 网页工具服务
└── utils/               # 工具函数
    ├── file.go          # 文件操作工具
    └── scanner.go       # 扫描工具
```

## 开发环境搭建

### 前提条件

- Go 1.16或更高版本
- Git
- 任意代码编辑器（推荐：VSCode、GoLand）

### 环境设置

1. 安装Go：
   - 访问[Go官方网站](https://golang.org/dl/)下载并安装适合您操作系统的Go版本
   - 验证安装：`go version`

2. 克隆代码仓库：
   ```bash
   git clone https://github.com/用户名/matu7.git
   cd matu7
   ```

3. 安装依赖：
   ```bash
   go mod download
   ```

## 编译与运行

### 本地开发运行

```bash
go run main.go
```

### 编译可执行文件

```bash
# 当前平台
go build -o matu7 main.go

# Windows平台
GOOS=windows GOARCH=amd64 go build -o matu7.exe main.go

# macOS平台
GOOS=darwin GOARCH=amd64 go build -o matu7-darwin main.go

# Linux平台
GOOS=linux GOARCH=amd64 go build -o matu7-linux main.go
```

### 跨平台打包

Matu7支持跨平台打包，可以在一个平台上构建适用于多个平台的可执行文件：

```bash
# 创建发布目录
mkdir -p release

# Windows (64位)
GOOS=windows GOARCH=amd64 go build -o release/matu7-windows-amd64.exe main.go

# macOS (Intel)
GOOS=darwin GOARCH=amd64 go build -o release/matu7-darwin-amd64 main.go

# macOS (Apple Silicon)
GOOS=darwin GOARCH=arm64 go build -o release/matu7-darwin-arm64 main.go

# Linux (64位)
GOOS=linux GOARCH=amd64 go build -o release/matu7-linux-amd64 main.go

# 复制必要的资源文件到发布目录
cp -r public release/
mkdir -p release/config
```

## 代码规范

### Go代码规范

- 遵循[Effective Go](https://golang.org/doc/effective_go)中的建议
- 使用`gofmt`或`goimports`格式化代码
- 添加适当的注释，特别是导出的函数和类型
- 错误处理：检查所有错误，提供有意义的错误信息
- 使用`context`处理请求的取消和超时

### 前端代码规范

- HTML：使用语义化标签，确保可访问性
- CSS：使用清晰的命名约定，避免过度嵌套
- JavaScript：使用ES6+语法，避免全局变量，模块化代码

## 核心模块说明

### 认证模块

认证模块位于`handlers/auth.go`和`services/auth_service.go`，实现了基于JWT的认证机制。

主要功能：
- 用户登录验证
- JWT令牌生成与验证
- 认证中间件

### 离线工具模块

离线工具模块主要由以下文件组成：
- `models/offline_tool.go`：定义离线工具数据模型
- `handlers/offline_tools.go`：处理离线工具相关的HTTP请求
- `services/offline_tools.go`：实现离线工具的业务逻辑
- `services/proc_windows.go`和`services/proc_other.go`：处理不同平台下的进程执行

主要功能：
- 扫描本地工具库
- 管理工具信息
- 执行工具命令
- 管理工具笔记

### 网页工具模块

网页工具模块主要由以下文件组成：
- `models/web_tool.go`：定义网页工具数据模型
- `handlers/web_tools.go`：处理网页工具相关的HTTP请求
- `services/web_tools.go`：实现网页工具的业务逻辑

主要功能：
- 管理网页工具信息
- 获取网站图标
- 管理工具笔记
- 打开网页工具

### 网页笔记模块

网页笔记模块主要由以下文件组成：
- `models/web_note.go`：定义网页笔记数据模型
- `handlers/web_notes.go`：处理网页笔记相关的HTTP请求
- `services/web_notes.go`：实现网页笔记的业务逻辑

主要功能：
- 管理网页笔记
- 搜索笔记内容
- 打开笔记来源URL

## 扩展开发

### 添加新的工具类型

如果您想添加新的工具类型，需要完成以下步骤：

1. 在`models`目录下创建新的数据模型
2. 在`services`目录下实现相关的业务逻辑
3. 在`handlers`目录下添加HTTP请求处理器
4. 在`routes/routes.go`中注册新的路由
5. 更新前端界面以支持新的工具类型

### 修改前端界面

前端界面文件位于`public`目录下：

1. `public/index.html`：主界面HTML
2. `public/login.html`：登录界面HTML
3. `public/css/`：样式文件
4. `public/js/`：JavaScript文件

修改这些文件以自定义界面外观和行为。

### 添加新的API端点

添加新的API端点需要完成以下步骤：

1. 在相应的`handlers`文件中添加新的处理函数
2. 在`routes/routes.go`中注册新的路由
3. 更新API文档以反映新的端点

## 贡献指南

我们欢迎所有形式的贡献，包括但不限于：

- 代码贡献
- 文档改进
- 问题报告
- 功能建议

### 提交Pull Request

1. Fork项目仓库
2. 创建您的功能分支：`git checkout -b feature/amazing-feature`
3. 提交您的更改：`git commit -m 'Add some amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交Pull Request

### 代码审查标准

- 代码必须通过所有测试
- 代码应遵循项目的代码规范
- 新功能应包含适当的文档和测试
- 提交信息应清晰描述更改内容

## 测试

### 运行测试

```bash
# 运行所有测试
go test ./...

# 运行特定包的测试
go test ./services

# 运行特定测试
go test -run TestAuthService ./services
```

### 添加新测试

添加新功能时，请同时添加相应的测试：

1. 在相应的包目录下创建`*_test.go`文件
2. 实现测试函数，函数名应以`Test`开头
3. 使用Go的标准测试库编写测试用例

## 发布流程

1. 更新版本号：
   - 在`main.go`文件中更新版本号
   - 遵循[语义化版本](https://semver.org/)规范

2. 更新CHANGELOG：
   - 记录所有重要的更改、新功能和修复

3. 构建发布版本：
   - 按照上述"跨平台打包"部分的说明构建各平台的可执行文件

4. 创建GitHub Release：
   - 标记版本号
   - 上传构建的可执行文件
   - 添加发布说明，包括更改日志

## 常见问题

### 编译错误

**问题**：编译时出现依赖相关错误  
**解决方案**：运行`go mod tidy`更新依赖，然后重新编译

### 跨平台兼容性问题

**问题**：在不同平台上行为不一致  
**解决方案**：检查平台特定代码（如`proc_windows.go`和`proc_other.go`），确保正确处理平台差异

### 资源文件路径问题

**问题**：程序无法找到资源文件  
**解决方案**：确保资源文件（如`public`目录）与可执行文件位于同一目录，或者修改代码以支持相对路径 