import md5 from "md5"

const identiconCache = new Map<string, string>()

function sliceWrap<T>(array: Array<T>, start: number, end: number) {
  if (array.length === 0) return []
  const result: typeof array = []
  for (let i = start; i < end; i++) {
    result.push(array[i % array.length]!)
  }
  return result
}

export function createIdenticon(address: string) {
  const lowercasedAddress = address.toLowerCase()

  // Check the cache first
  const cachedIdenticon = identiconCache.get(lowercasedAddress)
  if (cachedIdenticon) {
    return cachedIdenticon
  }

  const hash = md5(lowercasedAddress)
  const bytesPerPixel = 3
  const pixels = 5
  const rowPadding = (4 - ((pixels * bytesPerPixel) % 4)) % 4
  const pixelArraySize = pixels * (pixels * bytesPerPixel + rowPadding)
  const fileHeaderSize = 14
  const dibHeaderSize = 40
  const totalHeaderSize = fileHeaderSize + dibHeaderSize
  const bufferSize = totalHeaderSize + pixelArraySize
  const buffer = new Uint8Array(bufferSize)

  // Set up the bitmap headers
  buffer[0] = 0x42 // 'B'
  buffer[1] = 0x4d // 'M'
  buffer[2] = bufferSize & 0xff
  buffer[3] = (bufferSize >> 8) & 0xff
  buffer[4] = (bufferSize >> 16) & 0xff
  buffer[5] = (bufferSize >> 24) & 0xff
  buffer[10] = totalHeaderSize // Pixel data offset
  buffer[14] = dibHeaderSize
  buffer[18] = pixels & 0xff
  buffer[19] = (pixels >> 8) & 0xff
  buffer[22] = pixels & 0xff
  buffer[23] = (pixels >> 8) & 0xff
  buffer[26] = 1 // Planes
  buffer[28] = 24 // Bits per pixel

  // Determine the primary color based on the hash
  const match = /#(..)(..)(..)/.exec(`#${hash.slice(0, 6)}`)
  if (!match) throw new Error("[createIdenticon] Invalid color format")
  const [r, g, b] = match.slice(1).map((hex) => parseInt(hex, 16)) as [number, number, number]
  type BGR = [number, number, number]
  const primaryColor: BGR = [b, g, r]
  const backgroundColor: BGR = [255, 255, 255]

  // Draw the image
  const hashBinary = hash
    .split("")
    .map((el) => parseInt(el, 16))
    .map((num) => (num < 8 ? 0 : 1))
  const hashBinaryMap: (0 | 1)[][] = []
  const columns = Math.ceil(pixels / 2)
  for (let x = 0; x < columns; x++) {
    hashBinaryMap[x] = sliceWrap(hashBinary, x * pixels, (x + 1) * pixels)
  }
  let position = totalHeaderSize
  for (let y = pixels - 1; y >= 0; y--) {
    for (let x = 0; x < pixels; x++) {
      const color: BGR = hashBinaryMap[x > columns - 1 ? pixels - 1 - x : x]?.[y] ? primaryColor : backgroundColor
      buffer[position++] = color[0]
      buffer[position++] = color[1]
      buffer[position++] = color[2]
    }
    position += rowPadding
  }

  // Convert the image to a base64 string
  let binary = ""
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]!)
  }
  const identicon = `data:image/bmp;base64,${btoa(binary)}`

  // Store it in the cache, then return it
  identiconCache.set(lowercasedAddress, identicon)
  return identicon
}
