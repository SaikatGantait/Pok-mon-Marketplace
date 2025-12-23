import { Web3Storage, File as W3File } from 'web3.storage'

const token = process.env.NEXT_PUBLIC_WEB3STORAGE_TOKEN

function getClient() {
  if (!token) throw new Error('Missing NEXT_PUBLIC_WEB3STORAGE_TOKEN')
  return new Web3Storage({ token })
}

export async function uploadImageAndMetadata(image: File, metadata: Record<string, any>) {
  const client = getClient()
  const img = new W3File([image], image.name, { type: image.type })
  const metaBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  const meta = new W3File([metaBlob], 'metadata.json', { type: 'application/json' })
  const cid = await client.put([img, meta], { wrapWithDirectory: true })
  const base = `https://${cid}.ipfs.w3s.link`
  return {
    imageUrl: `${base}/${encodeURIComponent(image.name)}`,
    metadataUrl: `${base}/metadata.json`,
    cid,
  }
}
