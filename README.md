# OpenClaw 本地运行监控系统

## 项目概述

开发一个Web面板，实时监控本地OpenClaw的运行状态，包括网关、Channel、Agent等核心组件的健康状况和任务进度。

## Gitee 仓库

https://gitee.com/marsonx/openclaw-operation-monitoring

## 技术栈

- **前端**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **后端**: Node.js + Express/ Fastify
- **数据采集**: OpenClaw CLI + Gateway API
- **定时刷新**: 前端轮询 (30秒) + Agent任务更新 (15分钟)

## 功能模块

### 1. 网关状态面板 (Gateway)

| 字段 | 数据来源 | 说明 |
|------|----------|------|
| IP地址 | 系统检测 + 配置 | 局域网IP，用于远程访问 |
| 运行状态 | `openclaw gateway status` | running/stopped/error |
| 当前模式 | 配置文件 | local/remote/dev |
| 已加载模型 | `openclaw models list` | 模型名称、提供商 |
| 端口 | 配置文件 | Gateway监听端口 |
| 运行时长 | 进程信息 | 从启动至今的时间 |
| 版本 | `openclaw --version` | 当前安装版本 |

### 2. Channel 状态面板

| 字段 | 数据来源 | 说明 |
|------|----------|------|
| Channel名称 | `openclaw channels list` | feishu/discord/telegram等 |
| 状态 | `openclaw channels status` | enabled/disabled/error |
| 已启用插件 | Channel配置 | feishu_doc, feishu_chat等 |
| 关联Agent | 路由配置 | 该Channel绑定的Agent |
| 最后活跃时间 | Session数据 | 最后一次消息时间 |

### 3. Agent 状态面板

| 字段 | 数据来源 | 说明 |
|------|----------|------|
| Agent总数 | `openclaw agents list` | 统计数量 |
| 活跃数量 | Session列表 | 最近15分钟有活动的Agent |
| Agent详情列表 | | |
| - Agent ID | `openclaw agents list` | 唯一标识 |
| - 名称 | IDENTITY.md | 显示名称 |
| - 使用模型 | Agent配置 | 当前分配的模型 |
| - 当前状态 | Session状态 | 活跃/空闲/离线 |

### 4. 任务追踪系统 (核心创新点)

#### 任务数据结构
```typescript
interface Task {
  id: string;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface AgentTaskList {
  agentId: string;
  historicalTasks: Task[];    // 历史任务 (最近7天)
  currentTask: Task | null;   // 当前执行任务
  pendingTasks: Task[];       // 待执行任务队列
}
```

#### Agent任务更新机制

每个Agent需要每15分钟向监控系统更新一次任务状态：

**更新方式**：
- Agent通过调用Monitor API更新任务状态
- 提供`updateTaskProgress`技能或API
- 也可通过Session文件自动解析任务

**更新API**:
```http
POST /api/agents/:agentId/tasks
{
  "currentTask": {
    "id": "task-001",
    "title": "修复登录接口Bug",
    "status": "in_progress",
    "progress": 65
  },
  "pendingTasks": [...],
  "historicalTasks": [...]
}
```

#### 任务进度可视化

- 🟢 已完成 (100%)
- 🔵 进行中 (0-99%) - 带进度条
- ⚪ 待执行 (0%)
- 每个Agent卡片显示当前任务和进度

## UI 设计

### 布局结构

```
┌─────────────────────────────────────────────────────────┐
│  🦞 OpenClaw 运行监控                    [刷新] [设置]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─── 网关状态 ─────────────────────────────────────┐   │
│  │ 🟢 运行中    IP: 192.168.3.56    端口: 18789    │   │
│  │ 模式: local   版本: 2026.3.12                   │   │
│  │ 运行时长: 3天 5小时                              │   │
│  │ 已加载模型: xiaomi/mimo-v2-omni, mimo-v2-pro    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─── Channel 状态 ─────────────────────────────────┐   │
│  │ 🟢 Feishu (5个实例)  插件: doc, chat, wiki       │   │
│  │   └─ tom ✅ | ken ✅ | boy ✅ | gk ✅           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─── Agent 状态 (共4个, 活跃4个) ──────────────────┐   │
│  │                                                   │   │
│  │ 🟢 Tom (项目总监)                                 │   │
│  │    模型: mimo-v2-omni  当前任务: 项目需求整理     │   │
│  │    ████████████░░░░░ 75%                          │   │
│  │                                                   │   │
│  │ 🟢 Ken (后端助理)                                 │   │
│  │    模型: mimo-v2-pro   当前任务: 待分配           │   │
│  │    ░░░░░░░░░░░░░░░░░░ 0%                          │   │
│  │                                                   │   │
│  │ ...                                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─── 任务历史 ─────────────────────────────────────┐   │
│  │ Tom: [已完成] Admin-system归档 [2h前]           │   │
│  │ Ken: [已完成] 后端API开发 [5h前]                 │   │
│  │ ...                                              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## API 接口设计

### 数据采集接口

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/gateway/status` | GET | 获取网关状态 |
| `/api/gateway/models` | GET | 获取已加载模型列表 |
| `/api/channels` | GET | 获取所有Channel状态 |
| `/api/agents` | GET | 获取所有Agent列表和状态 |
| `/api/agents/:id` | GET | 获取单个Agent详情 |
| `/api/agents/:id/tasks` | GET | 获取Agent任务列表 |
| `/api/agents/:id/tasks` | POST | 更新Agent任务状态 |
| `/api/dashboard` | GET | 聚合数据，一次性获取全部状态 |
| `/api/health` | GET | 监控系统自身健康检查 |

## Gitee 仓库结构

```
openclaw-operation-monitoring/
├── README.md
├── package.json
├── docker-compose.yml (可选)
├── .gitignore
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── GatewayStatus.tsx
│   │   │   ├── ChannelStatus.tsx
│   │   │   ├── AgentList.tsx
│   │   │   ├── AgentCard.tsx
│   │   │   ├── TaskProgress.tsx
│   │   │   └── TaskHistory.tsx
│   │   ├── hooks/
│   │   │   └── useMonitor.ts
│   │   ├── lib/
│   │   │   └── api.ts
│   │   └── types/
│   │       └── index.ts
│   └── public/
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   ├── gateway.ts
│   │   │   ├── channels.ts
│   │   │   ├── agents.ts
│   │   │   └── tasks.ts
│   │   ├── services/
│   │   │   ├── openclaw-cli.ts
│   │   │   ├── gateway-api.ts
│   │   │   └── task-manager.ts
│   │   └── types/
│   │       └── index.ts
│   └── tests/
└── skill/ (ClawHub 发布目录)
    ├── SKILL.md
    └── README.md
```

## 开发任务分配

| 任务 | 负责人 | 预计时间 |
|------|--------|----------|
| 项目初始化 + 仓库建立 | Tom | 30分钟 |
| 后端数据采集服务 | Ken | 2小时 |
| 前端Web面板开发 | Boy | 2.5小时 |
| Agent任务更新机制 | Ken + Tom | 1小时 |
| 功能测试 | GK | 1小时 |
| 本地部署验证 | 全员 | 30分钟 |
| Skill打包 + ClawHub发布 | Tom | 1小时 |

## 时间计划

- **上午 8:00 - 12:00**: 完成研发、测试、本地部署
- **下午 14:00 - 17:00**: 打包成Skill，发布到ClawHub

## Skill 发布规范

```markdown
---
name: openclaw-monitor
description: OpenClaw本地运行监控面板 - 实时查看网关、Channel、Agent状态和任务进度
version: 1.0.0
author: MarsonX Team
tags: [monitor, dashboard, openclaw, status]
---

# OpenClaw Monitor Skill
...
```
