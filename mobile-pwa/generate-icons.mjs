import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))

function crc32(buf) {
  const table = Array.from({ length: 256 }, (_, i) => {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  })
  let crc = 0xffffffff
  for (const byte of buf) crc = (table[(crc ^ byte) & 0xff] ^ (crc >>> 8)) >>> 0
  return (crc ^ 0xffffffff) >>> 0
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function makePNG(width, height, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // RGB

  const rowSize = 1 + width * 3
  const raw = Buffer.alloc(height * rowSize)
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0 // filter: None
    for (let x = 0; x < width; x++) {
      const off = y * rowSize + 1 + x * 3
      raw[off] = r
      raw[off + 1] = g
      raw[off + 2] = b
    }
  }

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', deflateSync(raw)),
    makeChunk('IEND', Buffer.alloc(0)),
  ])
}

// Trudesk primary color #1976d2 = rgb(25, 118, 210)
const [R, G, B] = [25, 118, 210]
const outDir = join(__dir, 'public', 'icons')
mkdirSync(outDir, { recursive: true })

writeFileSync(join(outDir, 'icon-192.png'), makePNG(192, 192, R, G, B))
writeFileSync(join(outDir, 'icon-512.png'), makePNG(512, 512, R, G, B))
writeFileSync(join(outDir, 'icon-512-maskable.png'), makePNG(512, 512, R, G, B))

console.log('Generated PWA icons in public/icons/')
