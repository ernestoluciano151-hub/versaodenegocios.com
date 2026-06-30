'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  onRemove?: () => void
  showRemove?: boolean
  placeholder?: string
  index?: number
  folder?: string
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  showRemove = false,
  placeholder = 'URL da imagem ou clique para fazer upload...',
  index,
  folder = 'vn-tech/products',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens são permitidas')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Máximo 10MB por imagem')
      return
    }

    setError('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Erro no upload')
      const data = await res.json()
      onChange(data.url)
    } catch {
      setError('Erro ao fazer upload. Tente novamente.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        {index !== undefined && (
          <span className="text-xs text-gray-400 w-6 text-right flex-shrink-0">{index + 1}</span>
        )}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title="Fazer upload de imagem"
          className="flex-shrink-0"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </Button>
        {showRemove && onRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="flex-shrink-0">
            <X className="w-4 h-4 text-red-400" />
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 ml-8">{error}</p>}

      {value && (
        <div className="ml-8 relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <Image
            src={value}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized={value.startsWith('http')}
          />
        </div>
      )}
    </div>
  )
}
