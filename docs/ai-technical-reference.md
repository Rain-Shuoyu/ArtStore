# ArtStore AI 与技术人员参考手册

> **读者：** 负责本项目的 AI、开发人员、服务器管理员和 Supabase 管理员。  
> **不适合日常运营人员。** 运营人员请只阅读仓库根目录的 [`README.md`](../README.md)。

本文件是 ArtStore 的技术事实来源，定义架构、数据契约、部署约束、安全边界、首次部署、发布、回滚、运维和故障排查要求。

---

## 1. 工作原则与授权边界

### 1.1 当前产品边界

ArtStore 是一个 React/Vite 艺术藏品展示网站：

- 访客可浏览公开上架的藏品、图片、价格、简介和库存状态；
- 运营人员在 Supabase Dashboard 上传图片、维护资料、上架和下架；
- 浏览器只读取公开数据；
- 企业服务器只托管构建后的静态网站和 HTTPS；
- Supabase 托管 PostgreSQL 元数据和 Storage 图片；
- GitHub 保存源码、发布标签和构建检查。

**当前明确不包含：** 支付、订单、购物车、用户登录、库存锁定、浏览器写入数据库、自建运营后台或自动化 SSH 部署。任何这些能力都需要新增受保护的后端或 Serverless Function，不能直接使用浏览器端 Supabase key 完成。

### 1.2 默认生产拓扑

```text
访客浏览器
    │ HTTPS
    ▼
Ubuntu 24.04 LTS 服务器
    │ Docker Compose
    ▼
Caddy 容器 ── 静态 dist/、TLS、缓存、安全响应头、SPA fallback
    │ 浏览器 HTTPS 请求（仅公开读取）
    ▼
Supabase
    ├── PostgreSQL: public.artworks
    └── Storage: artwork-images
```

生产方案固定为：

```text
Ubuntu 24.04 LTS + Docker Compose + Caddy + Supabase
```

不要将 Vercel、Nginx、Apache、Node 常驻开发服务器或本地 SQLite 并入同一生产流程，除非任务明确要求重新设计并获得人工批准。

### 1.3 必须人工确认的操作

在执行前，AI 或技术人员必须先说明影响并等待明确批准：

- SSH 登录生产服务器；
- 修改 DNS、域名、云安全组、UFW 或 SSH 策略；
- 创建、替换或删除 SSH/Deploy Key；
- 创建、停止、更新、回滚或删除生产容器/volume；
- 执行 Supabase SQL 或修改 RLS、Storage 策略、成员权限；
- 修改生产环境变量或密码管理器；
- 发布、回滚、推送 Git、创建/删除远程标签；
- 删除图片、藏品、数据库、分支或服务器文件；
- 配置支付、密钥、Webhook、外部 API 或自动化部署。

### 1.4 永远不要请求、读取、输出或提交的内容

```text
.env.local 的完整内容
.env.production 的完整内容
Supabase service_role key
Supabase secret key
Supabase 数据库密码或 Access Token
SSH 私钥
服务器 root 密码
GitHub Personal Access Token
域名服务商密码 / API token
支付平台 secret key
```

如果用户粘贴了这些内容，停止传播、建议立即撤销或更换，并避免把值写入代码、测试输出、日志或 Git 历史。

### 1.5 允许自动进行的本地操作

没有额外批准时可以：

- 阅读已跟踪源码与配置；
- 修改用户明确要求的本地代码和文档；
- 运行 `npm run build`、静态检查和非破坏性诊断；
- 检查 `git status`、`git diff`、`git diff --check`；
- 提出生产变更计划和生成命令，但不在真实服务器上执行。

禁止把 `git reset --hard`、`git clean`、`rm -rf`、`git push --force`、`docker compose down -v`、`docker volume rm` 用作排障捷径。

---

## 2. 仓库结构与运行时架构

```text
ArtStore/
├── README.md                         # 人用操作手册
├── docs/
│   └── ai-technical-reference.md     # 本文件：AI/开发/运维技术事实来源
├── src/
│   ├── main.tsx                      # React 入口和 BrowserRouter
│   ├── App.tsx                       # 主页、详情、菜单、筛选、数据 hook
│   ├── gallery-data.ts               # Artwork 类型、Supabase record 映射、种子数据
│   ├── supabase.ts                   # 浏览器 Supabase 客户端
│   ├── styles.css                    # 全局视觉与响应式样式
│   └── assets/                       # 本地开发种子图片
├── supabase/
│   ├── 001_gallery_inventory.sql      # 新建空项目的最小权限初始化
│   └── 000_reset_gallery_inventory.sql # 危险：清空数据后按实际历史策略重建
├── Dockerfile                        # Vite 多阶段构建，Caddy 运行镜像
├── compose.yaml                      # 网站容器、端口、volume、日志轮转
├── Caddyfile                         # HTTPS、缓存、安全响应头、SPA fallback
├── .dockerignore                     # 构建上下文隔离
├── .env.example                      # 本地变量格式模板
├── .env.production.example           # 服务器变量格式模板
└── .github/workflows/ci.yml          # npm 构建检查，不部署
```

### 2.1 前端构建与路由

`package.json` 定义：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

- `npm run build` 是必须的本地和 CI 质量门禁；
- 输出目录为 `dist/`；
- `src/main.tsx` 使用 React Router 的 `BrowserRouter`；
- `BrowserRouter` 使 `/artwork/:id` 依赖 Web 服务器把未知路径返回 `index.html`；
- 不要改成 hash router 来掩盖部署配置错误。

### 2.2 数据加载与本地回退

`src/supabase.ts`：

```ts
const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(url && publishableKey)
export const supabase = isSupabaseConfigured
  ? createClient(url!, publishableKey!)
  : null
```

`src/App.tsx` 的 `useArtworks` 行为：

1. 初始使用 `seedArtworks`；
2. 配置 Supabase 后读取 `artworks`；
3. 查询过滤 `is_published = true` 并按 `sort_order` 排序；
4. 查询失败时保留种子数据并显示错误提示；
5. 若查询成功但返回空数组，正式页面显示空收藏，而不是种子数据。

该语义是有意的：已配置的正式数据库是权威来源。不要为了填充空页面而隐藏数据库问题或无条件显示种子数据。

### 2.3 藏品类型与 UI 行为

`src/gallery-data.ts` 的前端核心类型：

```ts
export type InventoryStatus = 'available' | 'reserved' | 'sold'

export type Artwork = {
  id: string
  sequence: string
  title: string
  titleZh?: string
  artist: string
  year: string
  origin?: string
  medium: string
  technique?: string
  dimensions: string
  price: string
  availability: InventoryStatus
  ratio: string
  image?: string
}
```

重要映射约束：

- 数据库 `id` 是 UUID，详情页路由使用该 UUID；
- `inventory_number` 是运营使用的唯一编号，不是详情路由 ID；
- 目前 UI 将 `origin` 映射为 `artist` 显示字段；不要在没有完整页面/数据库迁移方案时擅自改义；
- 数据库当前没有 artist/year 字段；`year` 在映射中为 `—`；
- `ratio` 只用于无图片占位，真实图片必须保持原始方向和比例；
- `available` 进入 Available 筛选；`reserved` 和 `sold` 不进入；当前 UI 对非 available 的详情显示为 On hold，若要单独显示 Sold 应同时修改 UI、测试和文档。

### 2.4 已确认的视觉与交互约束

- 维持克制的 Artsy 风格：白底、黑色细分隔线、无衬线排版、低装饰；
- 不复制 Artsy 品牌、源码或素材；
- 不旋转用户上传的原图；
- 真实图片使用原图方向和比例，不裁切，不放进固定纵横比画框；
- 图片本身界定视觉边界；无图时才使用 `ratio` 占位；
- 详情图当前为 `width: min(50%, 345px)`；
- `All works` / `Available` 必须是实际筛选状态；
- `Menu` 必须在桌面和移动端可展开；
- `Continue viewing` 跳转到下一件藏品；
- 路由切换需通过 `ScrollToTop` 回到顶部；hash 导航可跳到首页区段。

---

## 3. Supabase 数据与权限契约

### 3.1 SQL 文件与初始化范围

默认初始化脚本：

```text
supabase/001_gallery_inventory.sql
```

它只用于**全新的空 Supabase 项目**，创建：

1. `public.inventory_status` 枚举：`available`、`reserved`、`sold`；
2. `public.artworks` 表；
3. `(is_published, sort_order)` 索引；
4. `updated_at` trigger；
5. RLS；
6. 匿名与已认证用户读取已上架藏品的 select policy；
7. 公共 `artwork-images` Storage bucket；
8. 对该 bucket 的公开图片 select policy。

该脚本不是可反复安全执行的全幂等 migration。已有 schema 或数据的项目不可重跑；应创建明确的非破坏性 migration，先备份并经人工审核。

### 3.2 危险的实际重置脚本

```text
supabase/000_reset_gallery_inventory.sql
```

该文件准确记录了一份实际执行过的重置脚本，但它开头会执行：

```sql
DROP TABLE IF EXISTS public.artworks CASCADE;
DROP TYPE IF EXISTS public.inventory_status CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
```

因此它会永久删除所有藏品记录及依赖对象。只能在以下条件**全部满足**时运行：

- 环境是可丢弃的测试项目，或负责人明确批准清空正式项目；
- 已验证数据库和图片备份可恢复；
- 执行人知道清空范围且拥有 Supabase 管理权限；
- 已取得明确、可审计的人工批准。

绝不将它用作日常新增藏品、常规上线或“修复数据不显示”的手段。

这个历史脚本包含 `authenticated` 的全表 `SELECT` / `INSERT` / `UPDATE` / `DELETE` 策略。当前前端没有 Supabase Auth 登录或浏览器写入路径，不依赖这些策略。它们只为准确记录历史重置配置而保留，不是正式生产基线，也不能直接用作未来后台的授权模型。

### 3.3 `public.artworks` schema

```sql
create table public.artworks (
  id uuid primary key default gen_random_uuid(),
  inventory_number text not null unique,
  title text not null,
  title_zh text,
  origin text,
  material text not null,
  technique text,
  dimensions text not null,
  price text not null,
  inventory_status public.inventory_status not null default 'available',
  is_published boolean not null default false,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

运营要求：

- `inventory_number` 不可重复；
- 正式访客只会读到 `is_published = true`；
- `sort_order` 越小越靠前；
- 图片 URL 必须由 Supabase Storage Dashboard 的 Public URL 复制；
- 使用 Dashboard 项目成员权限维护表和上传图片，不为浏览器创建写入策略。

### 3.4 RLS 安全模型

当前公开读取策略：

```sql
create policy "Published artworks are publicly readable"
on public.artworks
for select
to anon, authenticated
using (is_published = true);
```

强制要求：

- 保留 RLS；
- 默认基线只允许公开读取 `is_published = true` 的藏品；
- 当前网站没有 Supabase Auth 登录或浏览器写入路径，因此不添加 `authenticated` 或 `anon` 的 `insert`、`update`、`delete` policy；
- `000_reset_gallery_inventory.sql` 中的 `authenticated ... USING (true)` / `WITH CHECK (true)` 是历史重置配置记录，不能复制到新的正式方案；它会让每个已认证用户操作全部藏品；
- 运营写入使用 Supabase Dashboard 的项目成员权限，不需要依赖浏览器的 table RLS write policy；
- 绝不把 `service_role`/`secret` key 放进 `VITE_` 变量或浏览器代码；
- 未来后台必须使用明确的 Auth、角色/owner 约束、受控服务端写接口和审计，而不是全表 `USING (true)` 授权。

### 3.5 Storage 约束

当前 bucket：

```text
artwork-images
```

它是公开 bucket，允许公开读取。图片上传操作仍应由拥有 Supabase Dashboard 权限的运营成员完成。

生产建议：

- JPEG、WebP 或 AVIF；
- 列表/详情图宽度不超过 2000px；
- 单图优先小于 1 MB；
- 保留受控的原图备份；
- 更新 `image_url` 并确认页面显示正确后，才能删除旧图；
- 不手动拼接 URL。

### 3.6 Vite 环境变量

只有以下两个可用于构建：

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_or_anon_key
```

Vite 将 `VITE_` 变量编译进浏览器 bundle。它们可见但必须受 RLS 限制。不要把真正机密变量改为 `VITE_` 前缀。

本地：

```bash
cp .env.example .env.local
```

生产：

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

`.env.local` 和 `.env.production` 均被 Git 忽略。不要打印其内容；如要验证，只输出键名：

```bash
cut -d= -f1 .env.production
```

预期键：

```text
SITE_DOMAIN
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

---

## 4. 生产配置契约

### 4.1 `Dockerfile`

构建方式：

1. `node:22-alpine` build stage；
2. `npm ci` 按 lockfile 安装依赖；
3. 从 `ARG`/`ENV` 获取两个公开 Vite 配置；
4. 执行 `npm run build`；
5. 使用 `caddy:2-alpine` final stage；
6. 仅复制 `/app/dist` 和 `Caddyfile` 到运行镜像；
7. 暴露 80 和 443。

不变量：

- 不在 final image 复制源码、`node_modules`、Git、`.env` 或原图；
- 不将 Node 开发服务器用于生产；
- 修改 Vite 变量后必须重新 build image，单纯 restart 不会让 bundle 获得新值；
- 依赖 Node 主版本与 GitHub Actions 一致，当前为 22。

### 4.2 `.dockerignore`

必须排除：

```text
.env
.env.*
.git
.github
.claude
node_modules
dist
figures
*.mhtml
```

`.env.example` 和 `.env.production.example` 是可提交模板，通过否定规则保留。任何新增凭据、备份或本地工具目录也应在进入 Docker build context 前排除。

### 4.3 `compose.yaml`

唯一服务：`artstore`。

职责：

- 在 build stage 传递 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_PUBLISHABLE_KEY`；
- 运行时仅传递 `SITE_DOMAIN` 给 Caddy；
- 映射 host `80:80` 与 `443:443`；
- 使用 `restart: unless-stopped`；
- 用 Docker local logging driver 轮转日志：5 个文件、每个最大 10 MB；
- 使用 named volumes `caddy_data:/data` 与 `caddy_config:/config` 持久化证书和配置。

强制命令格式：

```bash
docker compose --env-file .env.production <subcommand>
```

不要执行：

```bash
docker compose down -v
docker volume rm caddy_data
docker volume rm caddy_config
```

除非已有备份并经人工明确批准。

### 4.4 `Caddyfile`

Caddy 以 `{$SITE_DOMAIN}` 为 site address，负责：

- 自动 HTTPS 与 HTTP→HTTPS redirect；
- `zstd` / `gzip`；
- security headers：`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、`Permissions-Policy`、HSTS；
- 所有 HTML 默认 `Cache-Control: no-cache`；
- `/assets/*` 有 `public, max-age=31536000, immutable`；
- `try_files {path} /index.html`；
- `file_server`；
- stdout 访问日志。

**SPA fallback 不变量：**

```caddyfile
try_files {path} /index.html
```

不得删除、移动到不生效的 matcher，或让前置的 Nginx/Apache/load balancer 对 `/artwork/:uuid` 先返回 404。每次部署都必须测试详情页 URL 的直接打开和刷新。

### 4.5 GitHub Actions CI

`.github/workflows/ci.yml`：

- 触发：push 与 pull request；
- 权限：`contents: read`；
- Node 22；
- 只运行 `npm ci` 和 `npm run build`；
- 不含服务器、Supabase 或部署凭据；
- 不会自动部署。

CI 成功是发布的前提，不是生产验收的替代。发布后仍需浏览器验证。

---

## 5. 服务器基线与首次部署 runbook

> 以下每个外部/生产动作必须由负责人明确批准。保留云服务商控制台访问，避免 SSH 配置错误后无法登录。

### 5.1 前提

- Ubuntu 24.04 LTS；
- 固定公网 IPv4，必要时固定 IPv6；
- 最低 2 vCPU / 2 GB RAM / 40 GB SSD；
- 服务器区域接近主要访客；
- 已有 GitHub、Supabase 和域名服务商访问权；
- 域名可配置 A/AAAA 记录；
- 密码管理器和 MFA 已启用。

### 5.2 初始更新与 deploy 用户

以初始管理员登录：

```bash
ssh 初始管理员用户名@服务器公网IP
sudo apt update
sudo apt upgrade -y
sudo reboot
```

重连后创建部署用户：

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
id deploy
```

用管理员本地电脑生成专门 SSH key：

```bash
ssh-keygen -t ed25519 -C "artstore-production-admin"
```

建议文件：

```text
~/.ssh/artstore-production-admin
```

将 `.pub` 公钥放入服务器：

```bash
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
sudo nano /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

在**独立终端**测试，而不是先关闭原管理员连接：

```bash
ssh -i ~/.ssh/artstore-production-admin deploy@服务器公网IP
```

### 5.3 SSH 加固

仅在 key 登录成功后创建：

```bash
sudo nano /etc/ssh/sshd_config.d/99-artstore.conf
```

内容：

```text
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AllowUsers deploy
```

先验证、再加载：

```bash
sudo sshd -t
sudo systemctl reload ssh
```

保持当前 session，重新从另一个终端验证 key 登录。若失败，使用云控制台恢复；不要继续锁死 SSH。

### 5.4 UFW

先允许 SSH，再启用 firewall：

```bash
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

仅应开放 SSH、HTTP 和 HTTPS。不要公开 Docker daemon、数据库、Vite 开发端口或 Caddy 管理端口。

### 5.5 DNS

示例目标域名：

```text
gallery.example.com
```

在域名服务商添加：

| 类型 | 主机 | 值 |
| --- | --- | --- |
| A | `gallery` | 服务器公网 IPv4 |
| AAAA | `gallery` | 服务器公网 IPv6（仅启用时） |

本地确认：

```bash
dig +short gallery.example.com A
dig +short gallery.example.com AAAA
```

输出必须与服务器 IP 完全匹配。DNS 和云安全组/UFW 的 80/443 未就绪前，不要启动 Caddy 申请证书。

### 5.6 Docker 安装

以 `deploy` 登录并确认：

```bash
whoami
```

应输出 `deploy`。

安装基础依赖：

```bash
sudo apt update
sudo apt install -y git ca-certificates curl
```

安装 Docker 官方仓库与组件：

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker deploy
exit
```

重新以 `deploy` 登录后验证：

```bash
docker --version
docker compose version
docker run --rm hello-world
```

确认 80/443 未被已存在服务占用：

```bash
sudo ss -ltnp '( sport = :80 or sport = :443 )'
```

若看到未知 Nginx、Apache 或旧 Caddy，不要停止服务；先识别其业务归属并制定迁移计划。

### 5.7 GitHub 只读 Deploy Key

在服务器以 `deploy` 创建专用 key：

```bash
ssh-keygen -t ed25519 -f ~/.ssh/artstore_github_deploy -C "artstore-production-readonly"
cat ~/.ssh/artstore_github_deploy.pub
```

在 GitHub 仓库 **Settings → Deploy keys → Add deploy key** 添加公钥：

- 名称：`artstore-production-readonly`；
- 不勾选 **Allow write access**。

服务器创建配置：

```bash
nano ~/.ssh/config
```

```text
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/artstore_github_deploy
  IdentitiesOnly yes
```

```bash
chmod 600 ~/.ssh/config
ssh -T git@github.com
```

GitHub 显示认证成功但无 shell 是正常现象。不要改用 Personal Access Token。

### 5.8 克隆与生产变量

创建目录：

```bash
sudo install -d -m 0750 -o deploy -g deploy /opt/artstore
```

从 GitHub **Code → SSH** 获取真实 clone URL：

```bash
cd /opt/artstore
git clone <真实 SSH clone URL> .
git status
git log --oneline -3
```

创建生产变量：

```bash
cd /opt/artstore
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

填写：

```bash
SITE_DOMAIN=你的正式域名
VITE_SUPABASE_URL=https://你的项目标识.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=你的_publishable_key
```

不打印值地验证：

```bash
cut -d= -f1 .env.production
```

### 5.9 首次构建与启动

```bash
cd /opt/artstore
git status --short
docker compose --env-file .env.production config
docker compose --env-file .env.production up --build -d
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs --tail=100 artstore
```

期望：服务为 `running`，日志中 Caddy 成功监听与申请证书。DNS/certificate errors 必须先查 DNS、云安全组、UFW 与端口占用，不要无止境重启。

检查：

```bash
curl -I https://你的正式域名
```

应返回 200；HTTP 应跳转 HTTPS；浏览器无证书警告。

### 5.10 首次验收

必须用电脑与手机真实浏览器检查：

- 首页和已上架藏品；
- 图片方向/比例、价格、材质、尺寸、库存；
- 藏品详情；
- `/artwork/<真实 UUID>` 直接打开和刷新无 404；
- All works / Available；
- Menu；
- Continue viewing；
- 页脚联系方式。

可选 HTTP header 验证：

```bash
curl -I https://你的正式域名
```

应出现部分：

```text
strict-transport-security
x-content-type-options
x-frame-options
referrer-policy
```

不要猜测 build asset 名称。需要检查静态资源时，从浏览器 Network 或容器 `/srv/assets` 获取真实路径。

---

## 6. 发布与回滚 runbook

### 6.1 发布前的本地步骤

在本地仓库：

```bash
git status --short
git diff
npm run build
```

确认：

- 变更符合任务；
- 未包含 `.env.local`、`.env.production`、私钥、token 或密码；
- 构建成功；
- UI 变更需在浏览器测试 golden path 和相关边界；若无法测试，明确报告；
- GitHub CI 绿色前不发布。

Stage 精确文件，禁止大范围暂存：

```bash
git add <明确文件路径>
git commit -m "Describe the change"
git push
```

不在未授权时创建 commit 或 push。

### 6.2 发布标签

在构建和 CI 均成功、并得到发布批准后：

```bash
git tag -a vYYYY.MM.DD.N -m "Production release vYYYY.MM.DD.N"
git push origin vYYYY.MM.DD.N
```

示例：

```bash
git tag -a v2026.07.19.1 -m "Production release v2026.07.19.1"
git push origin v2026.07.19.1
```

生产标签不可移动、删除或覆盖；它是回滚与审计锚点。

### 6.3 服务器部署明确标签

通过管理员 SSH key 登录后：

```bash
cd /opt/artstore
git describe --tags --always
git status --short
git fetch --tags origin
git show --no-patch vYYYY.MM.DD.N
git checkout --detach vYYYY.MM.DD.N
docker compose --env-file .env.production build --pull
docker compose --env-file .env.production up -d --remove-orphans
git describe --tags --always
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs --tail=100 artstore
```

生产 checkout 使用 `--detach` 是刻意设计：服务器应运行经过审查的 immutable tag，而非跟随 main 的最新未审核内容。

如 `.env.production` 变更，必须在 `build` 前完成；Vite build-time 变量不会通过 container restart 更新。

### 6.4 部署后验收

必须重复首次验收中的浏览器功能检查，至少包含：首页、当前修改、详情路由刷新、移动端、Supabase 数据、筛选、Menu、Continue viewing 和 HTTPS。

记录：

- 发布标签；
- 部署时间；
- 执行人；
- 验收人；
- 验收结果；
- 如有异常，日志位置与回滚决定。

### 6.5 回滚

发生线上回归时：

1. 不直接编辑生产文件；
2. 选择最近一次完整验收的 tag；
3. 从服务器列出候选标签：

```bash
cd /opt/artstore
git tag --sort=-creatordate | head -10
```

4. 明确回滚 tag 后执行：

```bash
cd /opt/artstore
git fetch --tags origin
git show --no-patch vYYYY.MM.DD.N
git checkout --detach vYYYY.MM.DD.N
docker compose --env-file .env.production build --pull
docker compose --env-file .env.production up -d --remove-orphans
git describe --tags --always
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs --tail=100 artstore
```

5. 用浏览器执行验收；
6. 记录故障版本、回滚版本、时间和症状；
7. 在本地修复，创建新 commit 和新 tag；
8. 不删除坏 tag，不重写历史，不使用强制 push。

---

## 7. 运维、备份与恢复

### 7.1 日常状态与日志

```bash
cd /opt/artstore
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs --tail=100 artstore
```

实时日志：

```bash
docker compose --env-file .env.production logs -f artstore
```

`Control + C` 停止查看，不会停止容器。

日志配置限制为 5 个、每个 10 MB。它避免容器访问日志无限消耗磁盘，但不替代集中式日志和业务审计需求。

### 7.2 磁盘与构建缓存

```bash
docker system df
df -h
```

确认无用 build cache 后，可在维护窗口执行：

```bash
docker builder prune
```

不要用 `-a` 或在未备份时清理 volume。磁盘异常增长应先识别来源并保留排障证据。

### 7.3 证书与系统更新

Caddy 自动签发和续期 TLS。其状态位于 named volumes：

```text
caddy_data
caddy_config
```

不要运行 `docker compose down -v` 或删除这两个 volume。证书问题优先检查：DNS、云安全组、UFW、80/443 占用和 Caddy logs。

在维护窗口更新 OS：

```bash
sudo apt update
sudo apt upgrade
```

若需重启：

```bash
sudo reboot
```

重连后：

```bash
cd /opt/artstore
docker compose --env-file .env.production ps
```

`restart: unless-stopped` 应恢复容器。必须验证外部 HTTPS。

### 7.4 恢复资产

| 资产 | 位置/责任 |
| --- | --- |
| 源码、提交、发布 tags | GitHub；至少两名代码管理员。 |
| 藏品元数据 | Supabase PostgreSQL；依套餐能力配置备份并周期验证。 |
| 藏品与原图 | Supabase Storage + 受控独立原图备份。 |
| 域名/DNS | 域名服务商；保存恢复与管理员访问权。 |
| `.env.production` | 企业密码管理器；不进 Git。 |
| Caddy TLS state | 服务器级备份中的 `caddy_data` volume。 |
| 当前生产标签与部署记录 | 企业运行记录。 |

每月至少检查：第二管理员访问、Supabase 可访问、近期图片、HTTPS、服务器磁盘、当前生产 tag、密码管理器恢复路径。

### 7.5 服务器重建顺序

1. 创建新的 Ubuntu 24.04 LTS；
2. 重复 SSH 用户、key、SSH 加固和 UFW；
3. 安装 Docker；
4. 配置 GitHub read-only Deploy Key；
5. 重建 `/opt/artstore` 并 clone；
6. 从密码管理器恢复 `.env.production`；
7. checkout 最后验证 tag；
8. 确认 DNS 指向新 IP；
9. build / up；
10. 完整浏览器验收；
11. 确认 Supabase 记录与 Storage 图片。

不要尝试从浏览器缓存恢复代码或生产配置。

---

## 8. 故障诊断

### 8.1 本地 `EPERM` / `uv_cwd`

macOS 常见 Documents 授权问题，不表示仓库已删除。

```bash
cd ~
cd "/你的本地路径/ArtStore"
pwd
ls
```

若仍 `Operation not permitted`：关闭终端/VS Code，在 macOS **系统设置 → 隐私与安全性 → 文件与文件夹** 允许应用访问 Documents，再新开终端。不要 `git init`、`git clean`、删除目录或新建同名仓库。

### 8.2 Docker 构建后没有 Supabase 数据

不打印值地检查：

```bash
cd /opt/artstore
cut -d= -f1 .env.production
```

必须存在：

```text
SITE_DOMAIN
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

变量修正后重建：

```bash
docker compose --env-file .env.production build --pull
docker compose --env-file .env.production up -d
```

若显示种子数据，通常说明 Vite 公共变量没有构建进 bundle。若完全空，检查 `is_published = true`、RLS、浏览器 network/console 和 Supabase endpoint。

### 8.3 Caddy TLS 失败

按顺序检查：

1. A/AAAA 解析到正确 IP；
2. 云安全组允许 TCP 80/443；
3. UFW 允许 80/443；
4. 没有其他 Web server 监听 80/443；
5. Caddy logs：

```bash
cd /opt/artstore
docker compose --env-file .env.production logs --tail=200 artstore
```

不要切换自签名证书来假装生产恢复，也不要重启造成 ACME rate limit。

### 8.4 首页正常，但详情页刷新 404

检查 `Caddyfile`：

```caddyfile
try_files {path} /index.html
```

检查前置 proxy/load balancer 不先返回 404。修复配置后 rebuild/redeploy：

```bash
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d
```

### 8.5 单件藏品/图片不可见

检查：

1. `artworks.is_published = true`；
2. `image_url` 来自 Storage Public URL；
3. 该 URL 能在新标签打开；
4. 对象在 `artwork-images` bucket；
5. bucket 是 public；
6. 图片未被替换/删除；
7. 浏览器强制刷新。

不要为匿名用户添加写策略来解决显示问题。

### 8.6 容器未运行或端口冲突

先看 logs：

```bash
cd /opt/artstore
docker compose --env-file .env.production logs --tail=200 artstore
sudo ss -ltnp '( sport = :80 or sport = :443 )'
```

根据第一个明确错误修复。不要删除容器、volume 或执行 broad prune 作为第一反应。

### 8.7 磁盘空间不足

```bash
df -h
docker system df
```

确认 unreferenced cache 后：

```bash
docker builder prune
```

如果仍增长，保留日志并排查。不要删除 Caddy data 或 `/opt/artstore`。

---

## 9. AI 修改与交付规范

### 9.1 修改前

1. 阅读 `README.md`、本文件和相关源码/配置；
2. 查看 `git status --short`，尊重用户已有变更；
3. 将任务最小化，不借任务重构无关区域；
4. 涉及多文件、基础设施、数据模型、权限或外部服务时先提出计划；
5. 明确哪些动作需要人工批准。

### 9.2 修改中

- 优先修改已有文件；
- 不给当前静态展示产品加入支付、订单、auth、后台或不可验证的新抽象；
- 保持图片原始方向/比例；
- 不移除 SPA fallback、RLS、Git ignore 或 Caddy volumes；
- 不在有数据环境运行 `supabase/000_reset_gallery_inventory.sql`，除非用户明确确认可以永久清空数据并已完成可恢复备份；
- 不添加浏览器数据库写权限；
- 不复制真实 key 到 README、examples、tests 或 build log；
- UI 变更需在浏览器验证；若环境无法测试，明确说明限制。

### 9.3 修改后

至少运行：

```bash
npm run build
git diff --check
git status --short
```

基础设施配置变动额外：

```bash
docker compose --env-file .env.production.example config
```

若本机没有 Docker，不要伪称完成容器启动验证；报告该限制和服务器上应执行的验证命令。

提交或推送前：

- 复核 staged/unstaged diff；
- 检查未跟踪文件；
- 检查不存在凭据；
- 仅在用户明确要求时创建 commit；
- 仅在用户明确要求时推送。

### 9.4 推荐后续架构演进

以下任何事项均需单独设计和批准：

| 目标 | 正确方向 |
| --- | --- |
| 支付与订单 | 服务端/Serverless Function 创建订单、锁库存、验证 webhook；secret 不进入浏览器。 |
| 运营后台 | 有认证、最小角色权限、审计记录与受控服务端写接口。 |
| 更高图片性能 | 生成 WebP/AVIF、缩略图与详情图；考虑 CDN。 |
| staging 环境 | 独立 Supabase 项目/数据、独立域名/服务器与显式环境变量。 |
| 自动部署 | GitHub Actions 环境审批 + 受限 deploy key + 可审计日志；不直接在仓库保存私钥。 |
| 私有藏品图片 | 私有 Storage bucket、短期签名 URL 与受保护的访问控制。 |

在这些能力真正实现并通过安全审查前，不要在 README 或对外描述中声称系统已经具备。
