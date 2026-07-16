import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadImage } from '@/lib/upload/cloudinary'

export async function POST(req: NextRequest) {
  const session = await auth()
  const user = session?.user as { type?: string } | undefined
  if (!session || user?.type !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'vn-commerce/products'

    if (!file) {
      return NextResponse.json({ error: 'Ficheiro não encontrado' }, { status: 400 })
    }

    // Validate MIME type — images only for the admin panel
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de ficheiro não suportado. Use JPG, PNG, WEBP, GIF ou SVG.' }, { status: 400 })
    }

    // 5 MB hard limit for admin uploads
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ficheiro demasiado grande. Máximo 5 MB.' }, { status: 400 })
    }

    // Restrict folder to safe prefixes — prevent path traversal
    const allowedFolders = ['vn-commerce/products', 'vn-commerce/categories', 'vn-commerce/banners', 'vn-commerce/avatars']
    const safeFolder = allowedFolders.includes(folder) ? folder : 'vn-commerce/products'

    // Convert File to base64 data URI for Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    const result = await uploadImage(dataUri, safeFolder)
    return NextResponse.json({ url: result.url, publicId: result.publicId })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Erro ao fazer upload da imagem' }, { status: 500 })
  }
}
