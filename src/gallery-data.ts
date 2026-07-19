export type Artwork = {
  id: string
  sequence: string
  title: string
  artist: string
  year: string
  medium: string
  dimensions: string
  price: string
  availability: 'available' | 'reserved'
  ratio: string
}

export const gallery = {
  name: 'YOUR GALLERY',
  email: 'hello@yourgallery.com',
  wechat: 'your_wechat_id',
  xiaohongshu: '@yourgallery',
  address: ['Your venue address', 'City, Country'],
}

export const artworks: Artwork[] = [
  { id: 'work-01', sequence: '01', title: 'Untitled', artist: 'Artist name', year: '—', medium: 'Medium to be confirmed', dimensions: 'Dimensions to be confirmed', price: 'Price upon request', availability: 'available', ratio: '3 / 4' },
  { id: 'work-02', sequence: '02', title: 'Untitled', artist: 'Artist name', year: '—', medium: 'Medium to be confirmed', dimensions: 'Dimensions to be confirmed', price: 'Price upon request', availability: 'available', ratio: '4 / 3' },
  { id: 'work-03', sequence: '03', title: 'Untitled', artist: 'Artist name', year: '—', medium: 'Medium to be confirmed', dimensions: 'Dimensions to be confirmed', price: 'Price upon request', availability: 'reserved', ratio: '1 / 1' },
  { id: 'work-04', sequence: '04', title: 'Untitled', artist: 'Artist name', year: '—', medium: 'Medium to be confirmed', dimensions: 'Dimensions to be confirmed', price: 'Price upon request', availability: 'available', ratio: '3 / 5' },
  { id: 'work-05', sequence: '05', title: 'Untitled', artist: 'Artist name', year: '—', medium: 'Medium to be confirmed', dimensions: 'Dimensions to be confirmed', price: 'Price upon request', availability: 'available', ratio: '5 / 4' },
  { id: 'work-06', sequence: '06', title: 'Untitled', artist: 'Artist name', year: '—', medium: 'Medium to be confirmed', dimensions: 'Dimensions to be confirmed', price: 'Price upon request', availability: 'available', ratio: '4 / 5' },
  { id: 'work-07', sequence: '07', title: 'Untitled', artist: 'Artist name', year: '—', medium: 'Medium to be confirmed', dimensions: 'Dimensions to be confirmed', price: 'Price upon request', availability: 'reserved', ratio: '16 / 10' },
  { id: 'work-08', sequence: '08', title: 'Untitled', artist: 'Artist name', year: '—', medium: 'Medium to be confirmed', dimensions: 'Dimensions to be confirmed', price: 'Price upon request', availability: 'available', ratio: '2 / 3' },
]
