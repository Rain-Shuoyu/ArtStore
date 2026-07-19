# Supabase 部署与日常维护

本项目将 Supabase 用于保存藏品资料和图片。网站前端只读取已上架藏品；新增、编辑、上下架均在 Supabase Dashboard 内完成。管理员密钥与 Stripe 密钥绝不能放入本项目或浏览器环境变量。

## 首次部署

### 1. 创建云项目

1. 登录 Supabase Dashboard，新建一个项目并设置强密码。
2. 待项目初始化完成，进入 **SQL Editor**。
3. 打开项目中的 `supabase/001_gallery_inventory.sql`，将全部内容粘贴并执行一次。

脚本会创建：

- `artworks` 藏品表；
- `artwork-images` 公开图片 Bucket；
- 仅允许公开读取 `is_published = true` 藏品的 RLS 策略；
- 自动更新时间字段与排序索引。

### 2. 配置网站环境变量

1. 在 Dashboard 的 **Project Settings → API** 复制 Project URL。
2. 复制 **Publishable key**；旧项目可使用 `anon` key。不要使用 `service_role` key。
3. 复制 `.env.example` 为 `.env.local`，填写这两个值：

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_or_anon_key
```

4. 启动或重新启动本地网站：

```bash
npm run dev
```

部署到 Vercel、Netlify 等平台时，在项目的 Environment Variables 中配置同名变量后重新部署。

## 日常维护

### 上传图片

1. 进入 **Storage → artwork-images**。
2. 上传压缩后的 WebP、AVIF 或 JPEG。建议保留详情图在 2000px 宽以内，并另存适合列表的缩略图；单张图片尽量控制在 1 MB 左右。
3. 点击文件菜单，复制 **Get public URL**。

### 新增或编辑藏品

1. 进入 **Table Editor → artworks**，选择新增行或已有记录。
2. 填写这些字段：

| 字段 | 用途 | 示例 |
| --- | --- | --- |
| `inventory_number` | 唯一藏品编号 | `2026050301` |
| `title` / `title_zh` | 英文 / 中文名称 | `Puppet (Yoke Thay)` / `提线木偶` |
| `origin` | 产地 | `Myanmar (Burma) · 缅甸` |
| `material` | 材质 | `Wood, gold thread, fabric, embroidery · 木，金丝，布料，刺绣` |
| `technique` | 工艺，可留空 | `Handcrafted using multi-technique · 手工使用多种工艺制作` |
| `dimensions` | 尺寸 | `72 × 46 × 19 cm` |
| `price` | 对外显示价格 | `￥15,000` |
| `inventory_status` | `available`、`reserved` 或 `sold` | `available` |
| `image_url` | 上一步取得的公开图片 URL | `https://...` |
| `sort_order` | 展示顺序，数值越小越靠前 | `1` |
| `is_published` | 是否在网站公开显示 | 勾选为上架，取消为下架 |

3. 保存后，网站下次加载会自动读取最新已上架资料。无需重新构建前端。

## 权限与协作

- 在 Supabase **Organization / Project Members** 中邀请维护人员，并仅给予他们完成录入所需的 Dashboard 权限。
- 网站端只使用公开读取 key；这把 key 可以公开，但只能读取已上架的藏品。
- 不要建立任何允许 `anon` 写入 `artworks` 或 `storage.objects` 的策略。
- 将来接 Stripe 时，由 Serverless Function 或后端使用服务端密钥处理订单与库存，前端绝不直接写库存。

## 本地开发回退

如果 `.env.local` 不存在，网站会显示 `src/gallery-data.ts` 中的本地种子藏品，方便未配置 Supabase 时继续开发。配置 Supabase 后，云端资料会自动替代这些种子数据。
