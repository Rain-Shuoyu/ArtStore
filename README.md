# ArtStore：艺术藏品展示网站

这是一个可由非技术人员维护的艺术藏品展示网站。网站使用：

- **React + Vite**：网站界面；
- **Supabase**：保存藏品文字、价格、库存状态和图片；
- **Vercel**：发布为公网网站；
- **GitHub**：保存代码与部署历史。

日常维护者不需要修改代码：在 Supabase 后台上传图片、填写藏品表格、勾选上架即可。网站会自动读取已上架藏品。

> **本 README 是完整操作手册。** 请按顺序执行。每完成一步，都先检查“成功标志”，再做下一步。

---

## 目录

1. [先理解四个系统](#1-先理解四个系统)
2. [开始前的准备](#2-开始前的准备)
3. [第一次在本机打开项目](#3-第一次在本机打开项目)
4. [创建并配置 Supabase 数据库](#4-创建并配置-supabase-数据库)
5. [把本地网站连接到 Supabase](#5-把本地网站连接到-supabase)
6. [录入、上架与下架藏品](#6-录入上架与下架藏品)
7. [将网站部署到 Vercel](#7-将网站部署到-vercel)
8. [绑定自己的域名（可选）](#8-绑定自己的域名可选)
9. [每次修改代码后如何更新网站](#9-每次修改代码后如何更新网站)
10. [日常维护速查](#10-日常维护速查)
11. [常见错误与解决办法](#11-常见错误与解决办法)
12. [安全规则：给人和 LLM 都适用](#12-安全规则给人和-llm-都适用)
13. [项目文件说明](#13-项目文件说明)

---

## 1. 先理解四个系统

| 系统 | 用来做什么 | 谁应该操作 |
| --- | --- | --- |
| 本项目代码 | 网站外观、交互和数据读取逻辑 | 开发人员或 LLM |
| Supabase | 藏品资料、价格、上架状态和图片 | 日常运营人员 |
| GitHub | 保存每次代码修改的版本 | 开发人员或 LLM |
| Vercel | 把 GitHub 的代码变成可访问的网站 | 首次由开发人员配置，之后自动部署 |

### 数据流

```text
运营人员在 Supabase 上传图片和填写藏品
                 ↓
网站浏览器读取已上架的 Supabase 数据
                 ↓
访客看到藏品、价格、详情和库存状态

开发人员把代码推送到 GitHub
                 ↓
Vercel 自动重新部署网站
```

**重要区分：**

- 新增、编辑、上架或下架藏品：只需要 Supabase，**不需要重新部署网站**。
- 修改页面、字体、功能、文案结构或数据库读取逻辑：需要改代码并推送 GitHub，Vercel 才会重新部署。

---

## 2. 开始前的准备

### 2.1 需要准备的账号

首次部署时需要以下账号：

- GitHub 账号
- Supabase 账号
- Vercel 账号

建议用同一个邮箱注册，减少权限混乱。

### 2.2 需要安装的软件（仅本地开发者需要）

在 Mac 上安装：

1. **Node.js 20 或更高版本**。
2. **Git**（macOS 通常自带；若没有，首次执行 `git --version` 时系统会提示安装）。
3. 一个终端：macOS Terminal、iTerm 或 VS Code 内置终端均可。
4. 代码编辑器：推荐 VS Code。

打开终端，逐行执行：

```bash
node --version
npm --version
git --version
```

**成功标志：** 三条命令均返回版本号。

如果看到：

```text
command not found: node
```

说明尚未安装 Node.js。请安装后**完全关闭并重新打开终端**再试。

### 2.3 获取项目代码

如果项目已在电脑上，进入项目目录：

```bash
cd "/Users/shuoyuchen/Documents/ArtStore"
```

然后确认位置：

```bash
pwd
ls
```

**成功标志：** `pwd` 输出项目路径，`ls` 能看到 `package.json`、`src`、`supabase` 等文件。

如果你是在新电脑下载项目，执行：

```bash
git clone https://github.com/Rain-Shuoyu/ArtStore.git
cd ArtStore
```

> 如果 GitHub 仓库改为私有仓库，请先完成 GitHub 登录；不要把 GitHub 密码粘贴到终端、README、代码或 LLM 对话中。

---

## 3. 第一次在本机打开项目

### 3.1 安装项目依赖

确认终端当前目录是项目根目录后，执行：

```bash
npm install
```

**成功标志：** 终端最后出现类似：

```text
added ... packages
found 0 vulnerabilities
```

此操作会创建或更新 `node_modules` 文件夹。该文件夹很大，已被 Git 忽略，不需要上传到 GitHub。

### 3.2 本地启动网站

执行：

```bash
npm run dev
```

终端会显示类似：

```text
Local:   http://localhost:5173/
```

在浏览器打开这个地址。

**成功标志：** 能看到主页和藏品卡片。点击卡片应进入详情页。

### 3.3 停止本地网站

在运行 `npm run dev` 的终端窗口按：

```text
Control + C
```

### 3.4 检查生产构建

每次修改代码后、推送 GitHub 前建议执行：

```bash
npm run build
```

**成功标志：** 最后出现：

```text
✓ built in ...
```

如果构建失败，不要推送代码。把完整报错交给开发人员或 LLM 处理。

### 3.5 预览生产版本（可选）

先构建：

```bash
npm run build
```

再运行：

```bash
npm run preview
```

浏览器打开终端显示的地址，通常为：

```text
http://localhost:4173/
```

如果出现 `EPERM: process.cwd failed` 或 `uv_cwd`：

1. 关闭当前终端；
2. 新开终端；
3. 重新进入项目目录：

```bash
cd "/Users/shuoyuchen/Documents/ArtStore"
```

4. 在 macOS **系统设置 → 隐私与安全性 → 文件与文件夹** 中，允许 Terminal / iTerm / VS Code 访问 Documents 文件夹；
5. 重新执行命令。

---

## 4. 创建并配置 Supabase 数据库

这一步只需要在**第一次**配置时执行。完成后，日常人员通常只使用 Supabase 的 Storage 和 Table Editor。

### 4.1 创建 Supabase 项目

1. 打开 Supabase Dashboard 并登录。
2. 点击 **New project**。
3. 选择组织（Organization）。
4. 输入项目名称，例如：

```text
artstore
```

5. 选择离主要访客较近的地区（Region）。
6. 为数据库设置强密码，并把它保存在密码管理器中。
7. 点击 **Create new project**。
8. 等待项目状态变为可用。

**成功标志：** 可以看到项目 Dashboard，并能打开左侧菜单。

### 4.2 建表、设置权限和创建图片库

项目已包含初始化 SQL 文件：

```text
supabase/001_gallery_inventory.sql
```

在 Supabase Dashboard 中：

1. 左侧点击 **SQL Editor**。
2. 点击 **New query**。
3. 在本机用 VS Code 打开：

```text
supabase/001_gallery_inventory.sql
```

4. 复制文件全部内容。
5. 粘贴到 Supabase SQL Editor 的空白查询框。
6. 点击右下角或上方的 **Run**。

> 不要自行删改 SQL 中的 RLS（Row Level Security）部分。该部分决定公开访客只能读取上架藏品。

**成功标志：** SQL Editor 显示成功完成，没有红色错误。

然后在左侧确认：

- **Table Editor** 中出现 `artworks` 表；
- **Storage** 中出现 `artwork-images` bucket。

如果 SQL 报错：

- 不要反复修改并执行未知 SQL；
- 复制完整报错（不要复制任何 key）；
- 交给开发人员或 LLM。

### 4.3 获取项目 URL 和公开 key

在 Supabase Dashboard：

1. 左侧点击 **Project Settings**；
2. 点击 **API**；
3. 找到：
   - **Project URL**；
   - **Publishable key**。

如果界面只显示 **Project ID**，例如：

```text
example-project-ref
```

Project URL 的格式是：

```text
https://example-project-ref.supabase.co
```

### 4.4 绝对不要复制的密钥

在 API 页面可能同时看到以下密钥：

| 可以用于本网站前端 | 绝对不能放进前端、GitHub、Vercel 前端变量或聊天窗口 |
| --- | --- |
| `Publishable key` | `service_role` key |
| 旧版 `anon` key | `secret` key |

本项目只需要 **Publishable key**（或旧版 `anon` key）。它可以被浏览器使用，但数据库策略只允许它读取 `is_published = true` 的藏品。

---

## 5. 把本地网站连接到 Supabase

### 5.1 创建本地环境变量文件

在终端进入项目目录：

```bash
cd "/Users/shuoyuchen/Documents/ArtStore"
```

复制模板文件：

```bash
cp .env.example .env.local
```

用 VS Code 打开 `.env.local`，替换两行右侧内容：

```bash
VITE_SUPABASE_URL=https://你的项目标识.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=你的_publishable_key
```

真实示例的格式如下（示例 key 是假的，不能照抄）：

```bash
VITE_SUPABASE_URL=https://example-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_example_only_not_a_real_key
```

保存文件。

### 5.2 检查 `.env.local` 是否安全

运行：

```bash
git status --short
```

**正确结果：** 不应出现 `.env.local`。它已经在 `.gitignore` 中，不能被提交。

如果看到：

```text
?? .env.local
```

停止操作，确认 `.gitignore` 中包含：

```text
.env.local
```

然后再执行：

```bash
git status --short
```

### 5.3 重启本地网站

环境变量只会在启动时读取，因此必须停止并重启开发服务器：

```bash
npm run dev
```

**成功标志：**

- 本地网页能打开；
- Supabase 里勾选 `is_published` 的藏品显示在主页；
- 取消勾选后刷新网页，该藏品不显示。

### 5.4 如果页面没有任何藏品

按顺序检查：

1. Supabase **Table Editor → artworks** 是否已有记录；
2. 对应记录的 `is_published` 是否已勾选为 `true`；
3. 是否填写了必填字段：`inventory_number`、`title`、`material`、`dimensions`、`price`；
4. `.env.local` 变量名是否完全一致：

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

5. 修改 `.env.local` 后是否重启过 `npm run dev`；
6. 浏览器是否强制刷新（Mac：`Command + Shift + R`）。

该网站只显示：

```text
is_published = true
```

的记录。这是有意设置，不是错误。

---

## 6. 录入、上架与下架藏品

日常维护只在 Supabase Dashboard 中完成，**不需要打开代码、终端或 Vercel**。

### 6.1 图片准备建议

上传前建议：

- 使用 JPEG、WebP 或 AVIF；
- 详情图宽度不超过 2000px；
- 单张图片尽量小于 1 MB；
- 使用藏品编号作为文件名，例如：

```text
2026050301.jpg
2026050302.webp
```

> 图片方向以你上传的原始文件为准。网站会保持原图方向和比例，不会裁切。

### 6.2 上传图片到 Storage

1. 登录 Supabase Dashboard；
2. 左侧点击 **Storage**；
3. 打开 `artwork-images`；
4. 点击 **Upload file**；
5. 选择图片；
6. 上传完成后，点击文件右侧的 `⋮`；
7. 选择 **Get public URL** 或 **Copy URL**；
8. 复制该 URL。

不要手动拼接图片 URL。优先使用 Dashboard 的复制功能。

### 6.3 新增一件藏品

1. 左侧点击 **Table Editor**；
2. 打开 `artworks`；
3. 点击 **Insert → Insert row**；
4. 填写字段；
5. 保存。

建议填写模板：

| 字段 | 是否必填 | 说明与示例 |
| --- | --- | --- |
| `inventory_number` | 是 | 唯一编号，例如 `2026050301`。不能和已有记录重复。 |
| `title` | 是 | 英文名称，例如 `Puppet (Yoke Thay)`。 |
| `title_zh` | 否 | 中文名称，例如 `提线木偶`。 |
| `origin` | 否 | 产地，例如 `Myanmar (Burma) · 缅甸`。 |
| `material` | 是 | 材质，例如 `Wood, gold thread, fabric, embroidery · 木，金丝，布料，刺绣`。 |
| `technique` | 否 | 工艺说明，例如 `Handcrafted using multi-technique · 手工使用多种工艺制作`。 |
| `dimensions` | 是 | 尺寸，例如 `72 × 46 × 19 cm`。 |
| `price` | 是 | 对外显示的价格，例如 `￥15,000`。 |
| `inventory_status` | 是 | 从下拉框选择 `available`、`reserved` 或 `sold`。 |
| `is_published` | 是 | 勾选表示在网站显示；不勾选表示草稿或下架。 |
| `image_url` | 建议 | 粘贴 Storage 复制的 public URL。 |
| `sort_order` | 建议 | 首页排序数字；数字越小越靠前，例如 `1`。 |

### 6.4 填写样例

```text
inventory_number: 2026050301
title: Puppet (Yoke Thay)
title_zh: 提线木偶
origin: Myanmar (Burma) · 缅甸
material: Wood, gold thread, fabric, embroidery · 木，金丝，布料，刺绣
technique: 留空
dimensions: 72 × 46 × 19 cm
price: ￥15,000
inventory_status: available
is_published: true
image_url: 粘贴从 Storage 复制的 URL
sort_order: 1
```

### 6.5 上架、下架与售出

| 目标 | 在 `artworks` 表中如何操作 | 网站结果 |
| --- | --- | --- |
| 上架 | `is_published` 勾选 | 访客可见 |
| 下架 | `is_published` 取消勾选 | 访客不可见 |
| 暂时保留 | `inventory_status` 选 `reserved`，`is_published` 保持勾选 | 访客可见，详情显示 On hold |
| 已售出但仍展示 | `inventory_status` 选 `sold`，`is_published` 保持勾选 | 访客可见；当前版本不会出现在 Available 筛选中 |
| 已售出且不展示 | `inventory_status` 选 `sold`，并取消 `is_published` | 访客不可见 |
| 调整首页顺序 | 修改 `sort_order` | 数字小的在前 |

保存后刷新网站即可看到变化。**不需要 `npm run build`，不需要 GitHub，不需要 Vercel 重新部署。**

### 6.6 修改图片

1. 在 Storage 上传新图片；
2. 复制新图片 URL；
3. 在 `artworks` 表对应记录中替换 `image_url`；
4. 保存；
5. 浏览器强制刷新：

```text
Mac：Command + Shift + R
Windows：Ctrl + Shift + R
```

旧图片可在确认新图显示正常后再删除；删除前先确认没有其他藏品复用该 URL。

---

## 7. 将网站部署到 Vercel

Vercel 会从 GitHub 拉取代码并发布。以后每次推送代码，Vercel 会自动创建新部署。

### 7.1 先确保代码已经推送到 GitHub

在终端：

```bash
cd "/Users/shuoyuchen/Documents/ArtStore"
git status
git log --oneline -3
git remote -v
```

**成功标志：**

- `git status` 显示工作区干净，或仅显示你明确知道的文件；
- `git remote -v` 显示 GitHub 地址；
- 当前仓库的远程地址应是：

```text
https://github.com/Rain-Shuoyu/ArtStore.git
```

如果这是第一次推送当前分支，执行：

```bash
git push -u origin main
```

之后普通推送使用：

```bash
git push
```

> 推送前不要提交 `.env.local`。本项目已经忽略该文件，但每次仍应查看 `git status`。

### 7.2 在 Vercel 导入 GitHub 项目

1. 登录 Vercel Dashboard；
2. 点击 **Add New → Project**；
3. 在 **Import Git Repository** 中连接 GitHub；
4. 找到 `Rain-Shuoyu/ArtStore`；
5. 点击 **Import**；
6. 确认配置：

| Vercel 项目项 | 应使用的值 |
| --- | --- |
| Framework Preset | `Vite`（若自动识别，无需修改） |
| Root Directory | `./` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### 7.3 在 Vercel 配置 Supabase 环境变量

在点击 **Deploy** 前，展开 **Environment Variables**，新增两条：

```text
VITE_SUPABASE_URL
```

值粘贴你的 Supabase Project URL，例如：

```text
https://example-project-ref.supabase.co
```

再新增：

```text
VITE_SUPABASE_PUBLISHABLE_KEY
```

值粘贴 Supabase API 页的 **Publishable key**（或旧版 anon key）。

两条变量都选择：

- Production
- Preview
- Development（可选；本地 `.env.local` 已覆盖本地开发）

然后点击 **Deploy**。

**绝对不要在 Vercel 中填写：**

```text
service_role key
secret key
Supabase database password
Stripe secret key
```

### 7.4 首次部署验证

Vercel 显示 **Congratulations** 或 Deployment Ready 后：

1. 点击 **Visit**；
2. 打开主页；
3. 检查上架藏品是否显示；
4. 点击一件藏品，检查详情、图片、价格和库存状态；
5. 点击 `Available` 筛选；
6. 点击 `Menu` 和 `Continue viewing`；
7. 在手机浏览器再次检查一次。

如果部署成功但没有藏品：

1. 回到 [5.4 如果页面没有任何藏品](#54-如果页面没有任何藏品)；
2. 在 Vercel → Project → Settings → Environment Variables 检查变量名和值；
3. 修改 Vercel 环境变量后，进入 **Deployments**，选择最新部署的 `⋮` → **Redeploy**。

### 7.5 以后如何重新部署

- 修改 Supabase 藏品数据：无需重新部署；
- 修改代码并推送 GitHub：Vercel 自动部署；
- 修改 Vercel 环境变量：手动 Redeploy 一次；
- 需要手动重新部署：Vercel → Project → Deployments → 最新部署右侧 `⋮` → **Redeploy**。

---

## 8. 绑定自己的域名（可选）

在 Vercel 部署成功后再绑定域名。

1. Vercel → 进入本项目；
2. 点击 **Settings → Domains**；
3. 输入你的域名，例如：

```text
gallery.example.com
```

4. 点击 **Add**；
5. Vercel 会显示需要在域名服务商处添加的 DNS 记录；
6. 登录购买域名的平台，找到 **DNS / 域名解析**；
7. 按 Vercel 显示的记录逐字添加；
8. 回到 Vercel 等待验证。

**成功标志：** Vercel Domains 页面显示 `Valid Configuration`。

DNS 可能需要数分钟到 24 小时生效。不要因为等待而重复添加多条相同记录。

---

## 9. 每次修改代码后如何更新网站

仅在修改 `src/`、样式、功能、README、SQL 或其他代码文件时使用此流程。新增藏品不需要走此流程。

### 9.1 开始前查看改动

```bash
cd "/Users/shuoyuchen/Documents/ArtStore"
git status --short
git diff
```

确认只包含你期望提交的文件。

### 9.2 本地验证

```bash
npm run build
```

必须看到：

```text
✓ built in ...
```

### 9.3 提交代码

将 `<说明>` 换成简短中文或英文描述：

```bash
git add 具体文件路径
git commit -m "<说明>"
git push
```

示例：

```bash
git add src/App.tsx src/styles.css
git commit -m "Adjust artwork detail layout"
git push
```

**不要使用：**

```bash
git add .
git add -A
git push --force
git reset --hard
git clean -f
```

这些命令可能误提交凭据，或删除未保存的工作。

### 9.4 验证 Vercel 自动部署

1. 打开 Vercel → Project → Deployments；
2. 等待最新部署状态变为 **Ready**；
3. 点击部署 URL；
4. 检查刚修改的内容。

---

## 10. 日常维护速查

### 运营人员：新增一件藏品

```text
Supabase Storage 上传图片
→ 复制 Public URL
→ Supabase Table Editor 新增 artworks 记录
→ 填写资料、价格、状态、URL 和 sort_order
→ 勾选 is_published
→ 保存
→ 刷新网站确认
```

### 运营人员：下架一件藏品

```text
Supabase Table Editor → artworks
→ 找到该行
→ 取消 is_published
→ 保存
→ 刷新网站确认已消失
```

### 运营人员：标记售出

```text
Supabase Table Editor → artworks
→ inventory_status 改为 sold
→ 如仍需要展示，则保持 is_published 勾选
→ 如不再展示，则取消 is_published
→ 保存
```

### 开发人员：修改网站后发布

```bash
cd "/Users/shuoyuchen/Documents/ArtStore"
npm run build
git status --short
git add 具体文件路径
git commit -m "Describe the change"
git push
```

### 日常维护者不应执行

```text
npm install
npm run build
git add
git commit
git push
修改 .env.local
修改 Vercel 环境变量
修改 SQL/RLS 策略
```

除非明确由开发人员指导。

---

## 11. 常见错误与解决办法

### A. `npm` 提示 `uv_cwd` 或 `EPERM: process.cwd failed`

原因：终端对当前项目目录或 macOS Documents 权限失效。

解决：

```bash
cd ~
cd "/Users/shuoyuchen/Documents/ArtStore"
pwd
ls
```

如果仍提示 `Operation not permitted`：

1. 完全关闭终端或 VS Code；
2. 打开 macOS **系统设置 → 隐私与安全性 → 文件与文件夹**；
3. 允许当前应用访问 **Documents 文件夹**；
4. 重新打开终端，再执行上述命令。

不要因此执行 `git init`、`rm`、`git clean` 或创建新的同名文件夹。

### B. Supabase 已加藏品，网站却没有显示

按以下顺序检查：

1. `is_published` 是否为 `true`；
2. 浏览器是否刷新；
3. `image_url` 是否为 Storage 复制的 public URL；
4. Vercel 是否配置了两条 `VITE_SUPABASE_...` 变量；
5. 修改 Vercel 变量后是否 Redeploy；
6. 打开浏览器开发者工具 Console 是否有错误。

### C. 网站显示 `Loading collection…` 后不变化

通常是 Supabase URL/key 配置错误或网络无法连接。

检查 `.env.local`：

```bash
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=你的公开key
```

修改后必须停止并重新运行：

```bash
npm run dev
```

### D. 网站显示本地旧藏品，而不是 Supabase 数据

通常表示 `.env.local` 未加载。

1. 确认文件名是 `.env.local`，不是 `env.local.txt`；
2. 确认位于项目根目录，与 `package.json` 同级；
3. 确认变量名以 `VITE_` 开头；
4. 停止并重新启动 `npm run dev`。

### E. 图片打不开或显示空白

1. 在 Supabase Storage 打开该文件；
2. 用新浏览器标签打开 `image_url`；
3. 确认图片在 `artwork-images` bucket；
4. 确认使用的是 **Get public URL / Copy URL**，不是 Dashboard 内部编辑链接；
5. 确认 bucket 保持 Public。

### F. Vercel 部署失败

1. Vercel → Deployments → 点开失败部署；
2. 阅读最早出现的红色报错；
3. 本地运行：

```bash
npm run build
```

4. 如果本地也失败，先修复本地错误，再推送；
5. 不要用 `--no-verify`、`--force` 或删除文件绕过错误。

### G. 网站“看起来没了”或项目目录无法读取

如果终端提示：

```text
Operation not permitted
```

或：

```text
Unable to read current working directory
```

这通常是 macOS 权限问题，不代表文件被删除。请先按 [A](#a-npm-提示-uv_cwd-或-eperm-processcwd-failed) 恢复 Documents 权限，再检查：

```bash
cd ~
ls -la "$HOME/Documents/ArtStore"
git -C "$HOME/Documents/ArtStore" log --oneline -5
```

在恢复目录访问前，不要初始化新仓库或运行清理命令。

---

## 12. 安全规则：给人和 LLM 都适用

### 可以交给 LLM 的任务

- 修改视觉样式、文案、页面布局和交互；
- 新增字段显示；
- 检查构建错误；
- 编写 SQL 草案，但执行前必须由人检查；
- 生成提交前的变更说明；
- 解释 Supabase、GitHub 或 Vercel 的界面操作。

### 必须由人确认后才允许 LLM 做的任务

- 执行 SQL，特别是删除表、修改权限、删除数据；
- 推送到 GitHub；
- 修改 Vercel 环境变量；
- 创建或删除 Supabase 用户、成员、bucket；
- 配置 Stripe、支付、域名、DNS；
- 删除图片、订单、藏品或 Git 分支；
- 任何影响公开网站、付款或他人权限的操作。

### 永远不要提供给 LLM、提交到 GitHub 或写入前端的内容

```text
Supabase service_role key
Supabase secret key
Supabase 数据库密码
Stripe secret key
GitHub personal access token
Vercel token
邮箱密码、微信密码、域名服务商密码
```

如果密钥意外泄露：立即在对应平台**撤销并重新生成**，不要只删除聊天记录或 Git 文件。

### 给能力较弱的 LLM 的推荐指令模板

将以下内容与具体需求一起发送：

```text
这是一个 React + Vite + Supabase + Vercel 的艺术藏品网站。
请先阅读 README.md、docs/supabase-setup.md 和相关源码，再提出最小修改方案。

安全限制：
- 不要读取、打印、修改或提交 .env.local。
- 不要要求或输出 service_role、secret、Stripe secret、GitHub token 或任何密码。
- 不要执行 git reset --hard、git clean、rm -rf、git push --force。
- 不要修改 Supabase SQL/RLS、Vercel 环境变量、域名或支付配置，除非我明确确认。
- 修改代码后执行 npm run build；提交前先显示 git status 和 git diff。
- 不要提交代码，除非我明确说“创建 commit”。

本次任务：<把你的具体任务写在这里>
```

---

## 13. 项目文件说明

```text
ArtStore/
├── README.md                         # 本完整操作手册
├── .env.example                      # 环境变量格式示例，可提交
├── .env.local                        # 本机真实 Supabase 配置，不可提交
├── package.json                      # npm 命令和依赖
├── src/
│   ├── App.tsx                       # 页面、导航、筛选、详情页和 Supabase 数据读取
│   ├── gallery-data.ts               # TypeScript 数据结构与本地开发种子藏品
│   ├── supabase.ts                   # Supabase 浏览器客户端配置
│   ├── styles.css                    # 网站样式
│   └── assets/                       # 本地开发时的种子图片
├── supabase/
│   └── 001_gallery_inventory.sql     # 第一次配置 Supabase 时执行的 SQL
├── docs/
│   └── supabase-setup.md             # Supabase 专项简版说明
└── figures/                          # 原始藏品图片备份
```

### 本项目可用命令

| 命令 | 作用 | 何时使用 |
| --- | --- | --- |
| `npm install` | 安装项目依赖 | 第一次运行、换电脑或依赖更新后 |
| `npm run dev` | 启动本地开发网站 | 本地查看和修改时 |
| `npm run build` | 生成生产构建并检查 TypeScript | 推送代码前 |
| `npm run preview` | 本地预览生产构建 | 需要模拟部署效果时 |
| `git status --short` | 查看未提交改动 | 提交前 |
| `git diff` | 查看代码改动详情 | 提交前 |
| `git push` | 推送已提交代码到 GitHub | 人工确认后 |

---

## 支持与下一步

- 首次部署或 Supabase 问题：先检查 [常见错误](#11-常见错误与解决办法)。
- 数据字段、图片和库存维护：查看 [录入、上架与下架藏品](#6-录入上架与下架藏品)。
- 代码和设计修改：先本地运行、`npm run build`，再按 [每次修改代码后如何更新网站](#9-每次修改代码后如何更新网站) 操作。
- 未来接入 Stripe：需另行设计订单、支付 Webhook 与库存锁定，不能直接把 Stripe 密钥放进本前端项目。
