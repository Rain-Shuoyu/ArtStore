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

export type ArtworkRecord = {
  id: string
  inventory_number: string
  title: string
  title_zh: string | null
  origin: string | null
  material: string
  technique: string | null
  dimensions: string
  price: string
  inventory_status: InventoryStatus
  image_url: string | null
  sort_order: number
}

export function mapArtworkRecord(record: ArtworkRecord): Artwork {
  return {
    id: record.id,
    sequence: String(record.sort_order).padStart(2, '0'),
    title: record.title,
    titleZh: record.title_zh ?? undefined,
    artist: record.origin ?? '',
    year: '—',
    origin: record.origin ?? undefined,
    medium: record.material,
    technique: record.technique ?? undefined,
    dimensions: record.dimensions,
    price: record.price,
    availability: record.inventory_status,
    ratio: '3 / 4',
    image: record.image_url ?? undefined,
  }
}

export const gallery = {
  name: 'OPENLAND',
  email: 'hello@yourgallery.com',
  wechat: 'your_wechat_id',
  xiaohongshu: 'OPENLAND 博物馆',
  address: ['华侨城创意文化园南区 OCAT A馆', '人类学博物馆'],
}

export const seedArtworks: Artwork[] = [
  {
    id: '2026050301',
    sequence: '01',
    title: 'Puppet (Yoke Thay)',
    titleZh: '提线木偶',
    artist: 'Myanmar (Burma) · 缅甸',
    year: '—',
    origin: 'Myanmar (Burma) · 缅甸',
    medium: 'Wood, gold thread, fabric, embroidery · 木，金丝，布料，刺绣',
    dimensions: '72 × 46 × 19 cm',
    price: '￥15,000',
    availability: 'available',
    ratio: '4 / 3',
    image: new URL('./assets/puppet-yoke-thay.jpg', import.meta.url).href,
  },
  {
    id: '2026050302',
    sequence: '02',
    title: 'Perahera Bronze Elephant',
    titleZh: '骑象巡游摆件',
    artist: 'Sri Lanka · 斯里兰卡',
    year: '—',
    origin: 'Sri Lanka · 斯里兰卡',
    medium: 'Copper Alloy · 铜合金',
    technique: 'Handcrafted using multi-technique · 手工使用多种工艺制作',
    dimensions: '45 × 45 × 20.5 cm',
    price: '￥45,000',
    availability: 'available',
    ratio: '4 / 3',
    image: new URL('./assets/perahera-bronze-elephant.jpg', import.meta.url).href,
  },
]
