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

    // Convert File to base64 data URI for Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    const result = await uploadImage(dataUri, folder)
    return NextResponse.json({ url: result.url, publicId: result.publicId })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Erro ao fazer upload da imagem' }, { status: 500 })
  }
}
