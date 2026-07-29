import { z } from 'zod'

export const cartItemSchema = z.object({
  productId: z.string().min(1, 'productId obrigatório'),
  quantity: z.number().int().positive('Quantidade inválida'),
  name: z.string().optional(),
  price: z.number().positive().optional(),
  salePrice: z.number().positive().optional().nullable(),
  brand: z.string().optional(),
  image: z.string().optional(),
})

/** Regra: telemóvel MCX Express obrigatório quando o método é multicaixa_express */
const mcxPhoneRule = {
  check: (d: { paymentMethod: string; mcxPhone?: string }) =>
    d.paymentMethod !== 'multicaixa_express' ||
    (d.mcxPhone ?? '').replace(/[\s+-]/g, '').replace(/^244/, '').length === 9,
  params: { message: 'Indique o nº de telemóvel Multicaixa Express (9 dígitos).', path: ['mcxPhone'] },
}

const checkoutBaseSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(9, 'Telefone inválido'),
  street: z.string().min(5, 'Morada inválida'),
  city: z.string().min(2, 'Cidade inválida'),
  province: z.string().min(2, 'Província inválida'),
  country: z.string().default('Angola'),
  notes: z.string().optional(),
  paymentMethod: z.enum(['cash_on_delivery', 'multicaixa_express', 'bank_transfer']),
  /** Nº de telemóvel associado à app Multicaixa Express (obrigatório para multicaixa_express) */
  mcxPhone: z.string().optional(),
  couponCode: z.string().optional(),
})

/** Used by react-hook-form on the checkout page (form fields only) */
export const checkoutFormSchema = checkoutBaseSchema.refine(mcxPhoneRule.check, mcxPhoneRule.params)

/** Full schema used by the API route (includes cart items + idempotency key) */
export const checkoutSchema = checkoutBaseSchema.extend({
  items: z.array(cartItemSchema).min(1, 'Carrinho vazio'),
  idempotencyKey: z.string().uuid('Chave de idempotência inválida').optional(),
}).refine(mcxPhoneRule.check, mcxPhoneRule.params)

export const productSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  brand: z.string().min(1, 'Marca obrigatória'),
  categoryId: z.string().min(1, 'Categoria obrigatória'),
  description: z.string().min(10, 'Descrição obrigatória'),
  originCountry: z.string().min(2, 'País de origem obrigatório'),
  price: z.number().positive('Preço inválido'),
  salePrice: z.number().positive().optional().nullable(),
  sku: z.string().min(1, 'SKU obrigatório'),
  internalCode: z.string().optional(),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(0).default(5),
  warranty: z.string().optional(),
  weight: z.number().positive().optional().nullable(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  technicalSpecs: z.record(z.string(), z.string()).default({}),
  images: z.array(z.string()).default([]),
  videoUrls: z.array(z.string()).default([]),
})

export const categorySchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
  active: z.boolean().default(true),
  order: z.number().int().default(0),
})

export const couponSchema = z.object({
  code: z.string().min(3, 'Código obrigatório').toUpperCase(),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive('Valor inválido'),
  minOrder: z.number().positive().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  active: z.boolean().default(true),
  expiresAt: z.string().datetime().optional().nullable(),
})

export const customerSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  nif: z.string().optional(),
  password: z.string().min(6, 'Palavra-passe deve ter pelo menos 6 caracteres').optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Palavra-passe obrigatória'),
})

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>
export type ProductFormData = z.infer<typeof productSchema>
export type CategoryFormData = z.infer<typeof categorySchema>
export type CouponFormData = z.infer<typeof couponSchema>
export type CustomerFormData = z.infer<typeof customerSchema>
export type LoginFormData = z.infer<typeof loginSchema>
