# tldraw 项目运行指南

## ❗ 当前运行状态

经过测试，tldraw项目在当前环境下遇到了一些依赖构建问题，主要是SQLite相关的native模块编译失败。这是因为项目使用了较新的Node.js版本(v25.2.1)，而某些native依赖包还未完全适配。

## 📋 环境检查结果

✅ **满足要求的环境**:
- **Node.js**: v25.2.1 (要求 ^20.0.0) ✅
- **Yarn**: v4.12.0 (要求 4.12.0) ✅
- **操作系统**: Linux (支持) ✅

❌ **遇到的问题**:
- **SQLite依赖**: @rocicorp/zero-sqlite3 编译失败
- **Sharp依赖**: 图片处理库构建失败
- **Node.js版本兼容性**: 某些native模块与Node.js 25不完全兼容

## 🔧 解决方案

### 方案1: 使用Node.js LTS版本 (推荐)

```bash
# 1. 安装并切换到Node.js 20 LTS
nvm install 20
nvm use 20

# 2. 重新安装依赖
rm -rf node_modules
yarn install

# 3. 运行项目
yarn dev
```

### 方案2: 跳过有问题的依赖

```bash
# 1. 设置环境变量忽略可选依赖
export SKIP_NATIVE_BUILD=true

# 2. 尝试运行核心功能
yarn dev --filter='apps/examples' --filter='packages/tldraw'
```

### 方案3: 使用Docker (最稳定)

```bash
# 1. 构建Docker镜像
docker build -t tldraw-dev .

# 2. 运行容器
docker run -p 5420:5420 tldraw-dev
```

## 🚀 正常运行流程

### 基础运行

```bash
# 1. 确保使用正确的Node.js版本
node --version  # 应该是 20.x 或 18.x

# 2. 安装依赖
yarn install

# 3. 运行示例应用
yarn dev
# 访问: http://localhost:5420
```

### 其他运行选项

```bash
# 运行文档站点
yarn dev-docs
# 访问: http://localhost:3001

# 运行tldraw.com应用 (需要数据库)
yarn dev-app

# 运行VSCode扩展
yarn dev-vscode

# 运行特定模板
yarn dev-template vite
yarn dev-template nextjs
yarn dev-template sync-cloudflare
```

## 🛠️ 开发工具

### 测试

```bash
# 运行单元测试
yarn test

# 运行E2E测试
yarn e2e

# 运行特定包的测试
cd packages/editor && yarn test
```

### 代码质量

```bash
# 类型检查
yarn typecheck

# 代码检查
yarn lint

# 代码格式化
yarn format
```

### 构建

```bash
# 完整构建
yarn build

# 构建特定应用
yarn build-app
yarn build-docs

# API检查
yarn api-check
```

## 📁 项目结构理解

```
tldraw-ori/
├── packages/           # 核心SDK包
│   ├── editor/         # 编辑器引擎
│   ├── tldraw/         # 完整SDK
│   ├── store/          # 响应式数据库
│   ├── state/          # 状态管理
│   └── sync/           # 协作功能
├── apps/              # 应用程序
│   ├── examples/       # 示例应用 (主要开发目标)
│   ├── docs/           # 文档站点
│   └── dotcom/         # tldraw.com应用
├── templates/         # 项目模板
└── internal/          # 内部工具
```

## 🎯 推荐的开发流程

### 1. 环境准备

```bash
# 使用nvm管理Node.js版本
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# 验证环境
node --version  # 应显示 v20.x.x
yarn --version  # 应显示 4.12.0
```

### 2. 项目设置

```bash
# 克隆并进入项目
git clone https://github.com/tldraw/tldraw.git
cd tldraw

# 安装依赖
yarn install

# 初始化开发环境
yarn dev
```

### 3. 开发工作流

```bash
# 终端1: 运行开发服务器
yarn dev

# 终端2: 运行类型检查 (监听模式)
yarn typecheck --watch

# 终端3: 运行测试 (监听模式)
yarn test --watch
```

### 4. 调试技巧

```bash
# 查找相关文档
yarn context

# 刷新资源 (修改图标/字体后)
yarn refresh-assets

# 更新CONTEXT.md文件
yarn refresh-context
```

## 🔍 常见问题

### Q: 依赖安装失败怎么办？
A: 尝试以下解决方案：
1. 使用Node.js 20 LTS版本
2. 清理缓存: `yarn cache clean`
3. 删除node_modules重新安装

### Q: 如何运行特定示例？
A:
1. 访问 http://localhost:5420
2. 在左侧导航选择感兴趣的示例
3. 或直接访问特定路径: http://localhost:5420/examples/basic-shape

### Q: 如何贡献代码？
A:
1. Fork项目到你的GitHub
2. 创建功能分支
3. 运行 `yarn typecheck` 和 `yarn test` 确保代码质量
4. 提交Pull Request

### Q: 构建失败怎么办？
A:
1. 检查Node.js版本是否为LTS
2. 运行 `yarn clean` 清理构建缓存
3. 检查系统是否安装了必要的构建工具

## 📚 学习资源

### 官方资源
- [tldraw.dev](https://tldraw.dev) - 官方文档
- [examples.tldraw.com](https://examples.tldraw.com) - 在线示例
- [GitHub仓库](https://github.com/tldraw/tldraw) - 源代码

### 推荐学习路径
1. **基础概念**: 了解无限画布和响应式状态管理
2. **API学习**: 从基本shape和tool开始
3. **自定义扩展**: 创建自定义形状和工具
4. **集成实践**: 在实际项目中集成tldraw

### 代码示例
```typescript
// 基础使用示例
import { Tldraw } from 'tldraw'

function App() {
  return (
    <div style={{ height: '100vh' }}>
      <Tldraw />
    </div>
  )
}
```

## 🎉 下一步

一旦环境配置完成，你可以：

1. **浏览示例**: 查看apps/examples中的130+示例
2. **阅读源码**: 理解packages中各个模块的实现
3. **尝试自定义**: 基于templates创建自己的应用
4. **参与贡献**: 为开源项目做贡献

## 📞 获取帮助

- **GitHub Issues**: [项目问题反馈](https://github.com/tldraw/tldraw/issues)
- **Discord社区**: [开发者交流](https://discord.gg/tldraw)
- **Twitter**: [@tldraw](https://twitter.com/tldraw)

---

*这个指南会持续更新，以反映项目的最新变化和最佳实践。*