import { NextRequest, NextResponse } from 'next/server'
import { requireCustomerSession } from '@/lib/customer-auth'
import { uploadImage } from '@/lib/upload/cloudinary'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try { await requireCustomerSession() } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Ficheiro não encontrado' }, { status: 400 })

    // Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de ficheiro não suportado. Use JPG, PNG, WEBP ou PDF.' }, { status: 400 })
    }

    // 10 MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ficheiro demasiado grande. Máximo 10 MB.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    const result = await uploadImage(dataUri, 'vn-commerce/custom-orders')
    return NextResponse.json({ url: result.url, publicId: result.publicId })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Erro ao fazer upload.' }, { status: 500 })
  }
}
