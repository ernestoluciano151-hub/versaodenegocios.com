import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

async function main() {
  console.log('🌱 A iniciar seed...')

  // ─── Admin user ───────────────────────────────────────────────────────────
  const hashedAdminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@versaodenegocios.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@versaodenegocios.com',
      password: hashedAdminPassword,
      role: 'SUPER_ADMIN',
    },
  })
  console.log('✅ Admin criado:', admin.email)

  // ─── Test customer ────────────────────────────────────────────────────────
  const hashedCustomerPassword = await bcrypt.hash('cliente123', 12)
  const customer = await prisma.customer.upsert({
    where: { email: 'cliente@versaodenegocios.com' },
    update: {},
    create: {
      name: 'João Silva',
      email: 'cliente@versaodenegocios.com',
      password: hashedCustomerPassword,
      phone: '+244 923 456 789',
      active: true,
    },
  })
  console.log('✅ Cliente de teste criado:', customer.email)

  // ─── Payment methods ──────────────────────────────────────────────────────
  await prisma.paymentMethod.upsert({
    where: { type: 'cash_on_delivery' },
    update: {},
    create: { name: 'Pagamento na Entrega', type: 'cash_on_delivery', status: 'active' },
  })
  await prisma.paymentMethod.upsert({
    where: { type: 'multicaixa_express' },
    update: {},
    create: { name: 'Multicaixa Express', type: 'multicaixa_express', status: 'coming_soon' },
  })
  await prisma.paymentMethod.upsert({
    where: { type: 'bank_transfer' },
    update: {},
    create: { name: 'Transferência Bancária', type: 'bank_transfer', status: 'active' },
  })
  console.log('✅ Métodos de pagamento configurados.')

  // ─── Categories ───────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'smartphones' },
      update: {},
      create: { name: 'Smartphones', slug: 'smartphones', order: 1, active: true, description: 'Os melhores smartphones das principais marcas mundiais.' },
    }),
    prisma.category.upsert({
      where: { slug: 'computadores' },
      update: {},
      create: { name: 'Computadores', slug: 'computadores', order: 2, active: true, description: 'Laptops e desktops para trabalho e entretenimento.' },
    }),
    prisma.category.upsert({
      where: { slug: 'audio' },
      update: {},
      create: { name: 'Áudio', slug: 'audio', order: 3, active: true, description: 'Headphones, auriculares e sistemas de som de alta qualidade.' },
    }),
    prisma.category.upsert({
      where: { slug: 'tv-video' },
      update: {},
      create: { name: 'TV & Vídeo', slug: 'tv-video', order: 4, active: true, description: 'Televisores e equipamentos de vídeo para a sua sala.' },
    }),
    prisma.category.upsert({
      where: { slug: 'gaming' },
      update: {},
      create: { name: 'Gaming', slug: 'gaming', order: 5, active: true, description: 'Consolas, jogos e acessórios para gamers.' },
    }),
    prisma.category.upsert({
      where: { slug: 'acessorios' },
      update: {},
      create: { name: 'Acessórios', slug: 'acessorios', order: 6, active: true, description: 'Capas, carregadores e acessórios para os seus dispositivos.' },
    }),
    prisma.category.upsert({
      where: { slug: 'redes' },
      update: {},
      create: { name: 'Redes', slug: 'redes', order: 7, active: true, description: 'Routers, switches e equipamentos de rede.' },
    }),
    prisma.category.upsert({
      where: { slug: 'smart-home' },
      update: {},
      create: { name: 'Smart Home', slug: 'smart-home', order: 8, active: true, description: 'Dispositivos inteligentes para a sua casa conectada.' },
    }),
  ])
  console.log('✅ Categorias criadas:', categories.length)

  const [smartphones, computadores, audio, tvVideo, gaming, acessorios, redes, smartHome] = categories

  // ─── Products ─────────────────────────────────────────────────────────────
  const productsData = [
    {
      name: 'iPhone 15 Pro Max 256GB',
      slug: 'iphone-15-pro-max-256gb',
      brand: 'Apple',
      categoryId: smartphones.id,
      description: 'O iPhone 15 Pro Max com chip A17 Pro, câmara de 48MP e ecrã Super Retina XDR de 6,7". Titânio de grau aeroespacial, design mais leve e resistente.',
      technicalSpecs: {
        'Ecrã': '6,7" Super Retina XDR OLED',
        'Processador': 'Apple A17 Pro',
        'RAM': '8GB',
        'Armazenamento': '256GB',
        'Câmara Principal': '48MP f/1.78',
        'Câmara Ultra-wide': '12MP f/2.2',
        'Câmara Teleobjectiva': '12MP f/2.8 (5x zoom)',
        'Bateria': '4422 mAh',
        'Carregamento': '27W MagSafe, 15W Qi2',
        'OS': 'iOS 17',
        'Resistência': 'IP68',
        'Conectividade': '5G, Wi-Fi 6E, Bluetooth 5.3, UWB',
      },
      originCountry: 'China',
      images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80'],
      warranty: '1 ano',
      price: 1260000,
      salePrice: null,
      sku: 'APP-IPH15PM-256',
      stock: 15,
      minStock: 3,
      active: true,
      featured: true,
      isNew: true,
      isBestseller: false,
    },
    {
      name: 'Samsung Galaxy S24 Ultra 512GB',
      slug: 'samsung-galaxy-s24-ultra-512gb',
      brand: 'Samsung',
      categoryId: smartphones.id,
      description: 'Samsung Galaxy S24 Ultra com S Pen integrada, câmara de 200MP e display Dynamic AMOLED 2X de 6,8". O smartphone Android mais poderoso do mercado.',
      technicalSpecs: {
        'Ecrã': '6,8" Dynamic AMOLED 2X QHD+',
        'Processador': 'Snapdragon 8 Gen 3',
        'RAM': '12GB LPDDR5X',
        'Armazenamento': '512GB UFS 4.0',
        'Câmara Principal': '200MP f/1.7',
        'Câmara Teleobjectiva': '50MP (5x zoom)',
        'Câmara Periscópio': '10MP (10x zoom)',
        'Bateria': '5000 mAh',
        'Carregamento': '45W com fio, 15W sem fio',
        'OS': 'Android 14 / One UI 6.1',
        'Resistência': 'IP68',
        'S Pen': 'Integrada com Bluetooth',
      },
      originCountry: 'Coreia do Sul',
      images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80'],
      warranty: '1 ano',
      price: 1008000,
      salePrice: 924000,
      sku: 'SAM-GS24U-512',
      stock: 8,
      minStock: 2,
      active: true,
      featured: true,
      isNew: true,
      isBestseller: true,
    },
    {
      name: 'MacBook Pro 14" M3 Pro 18GB',
      slug: 'macbook-pro-14-m3-pro',
      brand: 'Apple',
      categoryId: computadores.id,
      description: 'MacBook Pro 14" com chip M3 Pro, 18GB de RAM unificada e SSD de 512GB. Performance profissional com autonomia de até 18 horas.',
      technicalSpecs: {
        'Ecrã': '14,2" Liquid Retina XDR (3024×1964)',
        'Processador': 'Apple M3 Pro (11-core CPU)',
        'GPU': '14-core GPU',
        'RAM': '18GB Unified Memory',
        'Armazenamento': '512GB SSD NVMe',
        'Autonomia': 'até 18 horas',
        'Portas': '3x Thunderbolt 4, HDMI, SD, MagSafe 3',
        'Webcam': '1080p FaceTime HD',
        'Peso': '1,61 kg',
        'OS': 'macOS Sonoma',
      },
      originCountry: 'China',
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'],
      warranty: '1 ano',
      price: 1848000,
      salePrice: null,
      sku: 'APP-MBP14-M3P',
      stock: 5,
      minStock: 2,
      active: true,
      featured: true,
      isNew: true,
      isBestseller: false,
    },
    {
      name: 'Sony WH-1000XM5 Headphones',
      slug: 'sony-wh-1000xm5-headphones',
      brand: 'Sony',
      categoryId: audio.id,
      description: 'Os melhores headphones com cancelamento de ruído do mundo. Qualidade de som excepcional com drivers de 30mm e chip V1 da Sony.',
      technicalSpecs: {
        'Tipo': 'Over-ear fechado',
        'Cancelamento de Ruído': 'ANC Activo com 8 microfones',
        'Drivers': '30mm',
        'Autonomia': '30h (com ANC ligado)',
        'Carregamento': 'USB-C, 3h carga rápida (10min = 5h)',
        'Conectividade': 'Bluetooth 5.2, NFC, multipoint',
        'Codecs': 'SBC, AAC, LDAC',
        'Peso': '250g',
        'Microfone': 'Integrado (chamadas)',
      },
      originCountry: 'Japão',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
      warranty: '1 ano',
      price: 126000,
      salePrice: 109200,
      sku: 'SON-WH1000XM5',
      stock: 20,
      minStock: 5,
      active: true,
      featured: true,
      isNew: false,
      isBestseller: true,
    },
    {
      name: 'Samsung Neo QLED 4K 55"',
      slug: 'samsung-neo-qled-4k-55',
      brand: 'Samsung',
      categoryId: tvVideo.id,
      description: 'TV Neo QLED 4K com Quantum Matrix Technology e processador Neo Quantum 4K. Qualidade de imagem premium para a sua sala de estar.',
      technicalSpecs: {
        'Ecrã': '55" Neo QLED 4K',
        'Resolução': '4K UHD (3840×2160)',
        'HDR': 'HDR10+ Adaptive',
        'Taxa de Actualização': '120Hz',
        'Smart TV': 'Tizen OS 7.0',
        'HDMI': '4x HDMI 2.1',
        'USB': '3x USB 3.0',
        'Wi-Fi': 'Wi-Fi 5 (802.11ac)',
        'Bluetooth': '5.2',
        'Som': '60W Dolby Atmos Object Tracking Sound',
      },
      originCountry: 'China',
      images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80'],
      warranty: '2 anos',
      price: 378000,
      salePrice: 336000,
      sku: 'SAM-NQLED55-4K',
      stock: 10,
      minStock: 2,
      active: true,
      featured: false,
      isNew: false,
      isBestseller: true,
    },
    {
      name: 'PlayStation 5 Slim + 2 Comandos',
      slug: 'ps5-slim-2-comandos',
      brand: 'Sony',
      categoryId: gaming.id,
      description: 'PlayStation 5 Slim com 2 comandos DualSense. Pack especial para jogar com amigos e família. Inclui 1TB de armazenamento interno.',
      technicalSpecs: {
        'CPU': 'AMD Ryzen Zen 2 (8 núcleos a 3.5GHz)',
        'GPU': 'AMD RDNA 2 (10.28 TFLOPS)',
        'RAM': '16GB GDDR6',
        'Armazenamento': '1TB SSD NVMe proprietário',
        'Resolução': 'até 8K (suporte a 4K/120fps)',
        'Frame Rate': 'até 120fps',
        'Áudio': 'Tempest 3D AudioTech',
        'Leitor': 'Ultra HD Blu-ray',
        'Comandos incluídos': '2x DualSense',
      },
      originCountry: 'Japão',
      images: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80'],
      warranty: '1 ano',
      price: 201600,
      salePrice: null,
      sku: 'SON-PS5S-2CTR',
      stock: 12,
      minStock: 3,
      active: true,
      featured: true,
      isNew: false,
      isBestseller: true,
    },
    {
      name: 'Xiaomi Redmi Note 13 Pro+ 5G 512GB',
      slug: 'xiaomi-redmi-note-13-pro-plus-5g',
      brand: 'Xiaomi',
      categoryId: smartphones.id,
      description: 'Smartphone 5G com câmara de 200MP, carregamento ultra-rápido de 120W e ecrã AMOLED 1.5K de 6,67". Melhor custo-benefício do mercado.',
      technicalSpecs: {
        'Ecrã': '6,67" AMOLED 1.5K (2712×1220) 120Hz',
        'Processador': 'MediaTek Dimensity 7200 Ultra',
        'RAM': '12GB LPDDR5',
        'Armazenamento': '512GB UFS 3.1',
        'Câmara Principal': '200MP f/1.65 OIS',
        'Câmara Ultra-wide': '8MP f/2.2',
        'Câmara Macro': '2MP',
        'Bateria': '5000mAh',
        'Carregamento': '120W HyperCharge (sem fio 15W)',
        'OS': 'Android 13 / MIUI 14',
        'Resistência': 'IP68',
      },
      originCountry: 'China',
      images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80'],
      warranty: '1 ano',
      price: 218400,
      salePrice: 193200,
      sku: 'XIA-RN13PP-5G',
      stock: 25,
      minStock: 5,
      active: true,
      featured: false,
      isNew: true,
      isBestseller: false,
    },
    {
      name: 'Apple AirPods Pro 2ª Geração',
      slug: 'airpods-pro-2a-geracao',
      brand: 'Apple',
      categoryId: audio.id,
      description: 'AirPods Pro com ANC adaptativo H2, Modo de Transparência e áudio espacial personalizado. O melhor par de auriculares sem fios da Apple.',
      technicalSpecs: {
        'Tipo': 'In-ear',
        'Chip': 'Apple H2',
        'Cancelamento de Ruído': 'ANC Activo Adaptativo',
        'Autonomia': '6h (30h com estojo MagSafe)',
        'Carregamento': 'Lightning/MagSafe, Qi, Apple Watch',
        'Conectividade': 'Bluetooth 5.3',
        'Resistência': 'IPX4 (auriculares e estojo)',
        'Áudio Espacial': 'Personalizado com head tracking',
        'Controlo': 'Touch e força (haste)',
      },
      originCountry: 'China',
      images: ['https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=800&q=80'],
      warranty: '1 ano',
      price: 168000,
      salePrice: null,
      sku: 'APP-APPRO2-WHT',
      stock: 30,
      minStock: 5,
      active: true,
      featured: true,
      isNew: false,
      isBestseller: true,
    },
    {
      name: 'Dell XPS 15 i7 RTX 4060 32GB',
      slug: 'dell-xps-15-i7-rtx-4060',
      brand: 'Dell',
      categoryId: computadores.id,
      description: 'Laptop premium com ecrã OLED 4K touch, Intel Core i7 de 13ª geração e GPU NVIDIA RTX 4060 8GB. Perfeito para criação de conteúdo e gaming.',
      technicalSpecs: {
        'Ecrã': '15,6" OLED 4K Touch (3840×2400) 60Hz',
        'Processador': 'Intel Core i7-13700H (14 núcleos)',
        'RAM': '32GB DDR5 4800MHz',
        'Armazenamento': '1TB PCIe Gen4 NVMe',
        'GPU': 'NVIDIA GeForce RTX 4060 8GB GDDR6',
        'Bateria': '86Wh',
        'Carregamento': '130W USB-C, 130W adaptador',
        'Portas': '2x Thunderbolt 4, USB-A, SD, 3.5mm',
        'Webcam': '720p IR com Windows Hello',
        'Peso': '1,86 kg',
        'OS': 'Windows 11 Home',
      },
      originCountry: 'Estados Unidos',
      images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'],
      warranty: '1 ano',
      price: 1512000,
      salePrice: 1344000,
      sku: 'DEL-XPS15-4060',
      stock: 4,
      minStock: 1,
      active: true,
      featured: true,
      isNew: false,
      isBestseller: false,
    },
    {
      name: 'TP-Link Deco XE75 Wi-Fi 6E Mesh (Pack 2)',
      slug: 'tp-link-deco-xe75-wifi-6e-mesh',
      brand: 'TP-Link',
      categoryId: redes.id,
      description: 'Sistema Mesh Wi-Fi 6E tri-banda com até 5400 Mbps para cobertura total da casa. Ideal para casas e apartamentos grandes em Luanda.',
      technicalSpecs: {
        'Padrão': 'Wi-Fi 6E (802.11axe)',
        'Bandas': 'Tri-banda (2.4GHz + 5GHz + 6GHz)',
        'Velocidade Máx.': 'até 5400 Mbps',
        'Cobertura': 'até 550m² (pack de 2 unidades)',
        'Portas': '2x Gigabit Ethernet por unidade',
        'Segurança': 'WPA3, HomeShield Pro',
        'Protocolo': 'OFDMA, MU-MIMO 4x4',
        'Dispositivos': 'até 200 dispositivos simultâneos',
        'Gestão': 'App Deco (iOS/Android)',
      },
      originCountry: 'China',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
      warranty: '3 anos',
      price: 84000,
      salePrice: null,
      sku: 'TPL-DXUE75-2P',
      stock: 18,
      minStock: 4,
      active: true,
      featured: false,
      isNew: false,
      isBestseller: false,
    },
    {
      name: 'Samsung Galaxy Watch 6 Classic 47mm',
      slug: 'samsung-galaxy-watch-6-classic-47mm',
      brand: 'Samsung',
      categoryId: acessorios.id,
      description: 'Smartwatch premium com coroa giratória clássica, monitorização avançada de saúde e bateria de 2 dias. O relógio inteligente mais elegante da Samsung.',
      technicalSpecs: {
        'Ecrã': '1,5" Super AMOLED (480×480)',
        'Processador': 'Exynos W930 Dual-Core 1.4GHz',
        'RAM': '2GB',
        'Armazenamento': '16GB',
        'Bateria': '425mAh (até 40h)',
        'Resistência': '5ATM + IP68 + MIL-STD-810H',
        'Sensores': 'ECG, BIA, SpO2, frequência cardíaca, GPS',
        'OS': 'Wear OS 4 / One UI Watch 5',
        'Conectividade': 'Bluetooth 5.3, Wi-Fi, NFC',
        'Coroa': 'Giratória física',
      },
      originCountry: 'Coreia do Sul',
      images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80'],
      warranty: '1 ano',
      price: 151200,
      salePrice: 134400,
      sku: 'SAM-GW6C-47MM',
      stock: 14,
      minStock: 3,
      active: true,
      featured: true,
      isNew: true,
      isBestseller: false,
    },
    {
      name: 'Xiaomi Mi Smart Band 8 Pro',
      slug: 'xiaomi-mi-smart-band-8-pro',
      brand: 'Xiaomi',
      categoryId: acessorios.id,
      description: 'Pulseira inteligente com ecrã AMOLED de 1,74", GPS integrado e mais de 150 modos desportivos. A melhor pulseira fitness do mercado.',
      technicalSpecs: {
        'Ecrã': '1,74" AMOLED (336×480)',
        'GPS': 'Integrado (L1+L5)',
        'Bateria': 'até 14 dias (até 6 dias com GPS)',
        'Resistência': '5ATM',
        'Sensores': 'SpO2, frequência cardíaca, temperatura',
        'Modos Desportivos': '150+',
        'Conectividade': 'Bluetooth 5.1',
        'OS compatível': 'Android 6.0+ / iOS 10.0+',
      },
      originCountry: 'China',
      images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80'],
      warranty: '1 ano',
      price: 37800,
      salePrice: 31500,
      sku: 'XIA-MSB8PRO',
      stock: 40,
      minStock: 8,
      active: true,
      featured: false,
      isNew: true,
      isBestseller: false,
    },
  ]

  const createdProducts: { id: string; name: string; price: number | string | object }[] = []

  for (const productData of productsData) {
    const { salePrice, ...rest } = productData
    const created = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...rest,
        salePrice: salePrice ?? undefined,
        videoUrls: [],
      },
    })
    await prisma.inventory.upsert({
      where: { productId: created.id },
      update: {},
      create: { productId: created.id, quantity: created.stock, minStock: created.minStock },
    })
    createdProducts.push({ id: created.id, name: created.name, price: created.price })
  }
  console.log(`✅ ${createdProducts.length} produtos criados.`)

  // ─── Supplier ─────────────────────────────────────────────────────────────
  const supplier = await prisma.supplier.upsert({
    where: { id: 'supplier-techimport-001' },
    update: {},
    create: {
      id: 'supplier-techimport-001',
      name: 'TechImport China Ltd',
      country: 'China',
      email: 'orders@techimport.cn',
      phone: '+86 755 8888 9999',
      website: 'https://techimport.cn',
      contact: 'Mr. Wei Zhang',
      notes: 'Fornecedor principal de electrónica. Lead time: 30-45 dias.',
      active: true,
    },
  })
  console.log('✅ Fornecedor criado:', supplier.name)

  // ─── Import ───────────────────────────────────────────────────────────────
  await prisma.import.upsert({
    where: { reference: 'IMP-2024-001' },
    update: {},
    create: {
      supplierId: supplier.id,
      reference: 'IMP-2024-001',
      products: [
        { name: 'iPhone 15 Pro Max 256GB', sku: 'APP-IPH15PM-256', quantity: 20, unitCost: 52000, totalCost: 1040000 },
        { name: 'Samsung Galaxy S24 Ultra 512GB', sku: 'SAM-GS24U-512', quantity: 15, unitCost: 42000, totalCost: 630000 },
        { name: 'Sony WH-1000XM5', sku: 'SON-WH1000XM5', quantity: 30, unitCost: 9500, totalCost: 285000 },
        { name: 'Apple AirPods Pro 2', sku: 'APP-APPRO2-WHT', quantity: 40, unitCost: 7200, totalCost: 288000 },
        { name: 'PlayStation 5 Slim', sku: 'SON-PS5S-2CTR', quantity: 15, unitCost: 18500, totalCost: 277500 },
      ],
      totalCost: 5000000,
      shippingCost: 800000,
      customsDuty: 400000,
      otherCosts: 0,
      totalLanded: 6200000,
      status: 'delivered',
      estimatedArrival: new Date('2024-01-10'),
      actualArrival: new Date('2024-01-15'),
      notes: 'Primeira importação do ano 2024. Chegou sem problemas na alfândega.',
    },
  })
  console.log('✅ Importação IMP-2024-001 criada.')

  // ─── Coupons ──────────────────────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { code: 'BEMVINDO10' },
    update: {},
    create: {
      code: 'BEMVINDO10',
      type: 'percentage',
      value: 10,
      minOrder: 50000,
      active: true,
    },
  })
  await prisma.coupon.upsert({
    where: { code: 'VIPTECH20' },
    update: {},
    create: {
      code: 'VIPTECH20',
      type: 'percentage',
      value: 20,
      minOrder: 200000,
      maxUses: 100,
      active: true,
      expiresAt: new Date('2024-12-31'),
    },
  })
  console.log('✅ Cupões BEMVINDO10 e VIPTECH20 criados.')

  // ─── Customer address ─────────────────────────────────────────────────────
  const existingAddress = await prisma.address.count({ where: { customerId: customer.id } })
  if (existingAddress === 0) {
    await prisma.address.create({
      data: {
        customerId: customer.id,
        label: 'Casa',
        street: 'Rua das Acácias, nº 42',
        city: 'Talatona',
        province: 'Luanda',
        municipality: 'Belas',
        district: 'Talatona',
        country: 'Angola',
        isDefault: true,
      },
    })
    console.log('✅ Endereço do cliente criado.')
  }

  // ─── Orders ───────────────────────────────────────────────────────────────
  const existingOrders = await prisma.order.count({ where: { customerId: customer.id } })
  if (existingOrders === 0) {
    const shippingAddress = {
      label: 'Casa',
      street: 'Rua das Acácias, nº 42',
      city: 'Talatona',
      province: 'Luanda',
      municipality: 'Belas',
      district: 'Talatona',
      country: 'Angola',
    }

    // Find products for orders
    const iphone = await prisma.product.findUnique({ where: { sku: 'APP-IPH15PM-256' } })
    const airpods = await prisma.product.findUnique({ where: { sku: 'APP-APPRO2-WHT' } })
    const sonyHeadphones = await prisma.product.findUnique({ where: { sku: 'SON-WH1000XM5' } })

    // Order 1 — delivered, paid
    if (iphone && airpods) {
      const order1Subtotal = Number(iphone.price) + Number(airpods.price)
      const order1Total = order1Subtotal + 5000 // shipping

      const order1 = await prisma.order.create({
        data: {
          customerId: customer.id,
          status: 'delivered',
          subtotal: order1Subtotal,
          discount: 0,
          shipping: 5000,
          total: order1Total,
          shippingAddress,
          notes: 'Por favor entregar de manhã.',
          createdAt: new Date('2024-02-10T10:00:00Z'),
          items: {
            create: [
              {
                productId: iphone.id,
                quantity: 1,
                price: iphone.price,
                salePrice: null,
                productSnapshot: {
                  name: iphone.name,
                  brand: iphone.brand,
                  sku: iphone.sku,
                  image: iphone.images[0] ?? null,
                },
              },
              {
                productId: airpods.id,
                quantity: 1,
                price: airpods.price,
                salePrice: null,
                productSnapshot: {
                  name: airpods.name,
                  brand: airpods.brand,
                  sku: airpods.sku,
                  image: airpods.images[0] ?? null,
                },
              },
            ],
          },
          payments: {
            create: {
              customerId: customer.id,
              paymentMethod: 'cash_on_delivery',
              amount: order1Total,
              currency: 'AOA',
              paymentStatus: 'paid',
              paymentDate: new Date('2024-02-15T14:30:00Z'),
              transactionReference: 'COD-20240215-001',
            },
          },
        },
      })
      console.log('✅ Pedido 1 (entregue) criado:', order1.id)

      // Order 2 — processing, awaiting_delivery
      if (sonyHeadphones) {
        const order2Total = Number(sonyHeadphones.salePrice ?? sonyHeadphones.price) + 5000

        const order2 = await prisma.order.create({
          data: {
            customerId: customer.id,
            status: 'processing',
            subtotal: Number(sonyHeadphones.salePrice ?? sonyHeadphones.price),
            discount: sonyHeadphones.salePrice ? Number(sonyHeadphones.price) - Number(sonyHeadphones.salePrice) : 0,
            shipping: 5000,
            total: order2Total,
            shippingAddress,
            createdAt: new Date('2024-03-01T09:00:00Z'),
            items: {
              create: [
                {
                  productId: sonyHeadphones.id,
                  quantity: 1,
                  price: sonyHeadphones.price,
                  salePrice: sonyHeadphones.salePrice,
                  productSnapshot: {
                    name: sonyHeadphones.name,
                    brand: sonyHeadphones.brand,
                    sku: sonyHeadphones.sku,
                    image: sonyHeadphones.images[0] ?? null,
                  },
                },
              ],
            },
            payments: {
              create: {
                customerId: customer.id,
                paymentMethod: 'cash_on_delivery',
                amount: order2Total,
                currency: 'AOA',
                paymentStatus: 'awaiting_delivery',
                transactionReference: 'COD-20240301-002',
              },
            },
          },
        })
        console.log('✅ Pedido 2 (em processamento) criado:', order2.id)
      }

      // Update customer totals
      const totalSpent = order1Total
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalSpent: totalSpent,
          ordersCount: 2,
        },
      })
      console.log('✅ Totais do cliente actualizados.')
    }
  }

  // ─── Wishlist ─────────────────────────────────────────────────────────────
  const existingWishlist = await prisma.wishlist.count({ where: { customerId: customer.id } })
  if (existingWishlist === 0) {
    const macbook = await prisma.product.findUnique({ where: { sku: 'APP-MBP14-M3P' } })
    const ps5 = await prisma.product.findUnique({ where: { sku: 'SON-PS5S-2CTR' } })

    if (macbook) {
      await prisma.wishlist.upsert({
        where: { customerId_productId: { customerId: customer.id, productId: macbook.id } },
        update: {},
        create: { customerId: customer.id, productId: macbook.id },
      })
    }
    if (ps5) {
      await prisma.wishlist.upsert({
        where: { customerId_productId: { customerId: customer.id, productId: ps5.id } },
        update: {},
        create: { customerId: customer.id, productId: ps5.id },
      })
    }
    console.log('✅ Lista de desejos criada com 2 produtos.')
  }

  // ─── Notifications ────────────────────────────────────────────────────────
  const existingNotifications = await prisma.notification.count({ where: { customerId: customer.id } })
  if (existingNotifications === 0) {
    const orders = await prisma.order.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: 'asc' } })
    const order1Id = orders[0]?.id ?? 'N/A'

    await prisma.notification.createMany({
      data: [
        {
          customerId: customer.id,
          type: 'order_confirmed',
          title: 'Pedido confirmado!',
          message: `O seu pedido #${order1Id.slice(-8).toUpperCase()} foi confirmado e está a ser preparado.`,
          read: true,
          createdAt: new Date('2024-02-10T10:05:00Z'),
        },
        {
          customerId: customer.id,
          type: 'order_delivered',
          title: 'Pedido entregue!',
          message: 'O seu pedido foi entregue com sucesso. Obrigado pela sua compra na VN Commerce!',
          read: true,
          createdAt: new Date('2024-02-15T15:00:00Z'),
        },
        {
          customerId: customer.id,
          type: 'promotion',
          title: '🔥 Promoção especial!',
          message: 'Aproveite 20% de desconto em toda a loja com o código VIPTECH20. Válido até 31 de Dezembro!',
          read: false,
          createdAt: new Date('2024-03-05T09:00:00Z'),
        },
      ],
    })
    console.log('✅ 3 notificações criadas para o cliente.')
  }

  // ─── Support ticket ───────────────────────────────────────────────────────
  const existingTickets = await prisma.supportTicket.count({ where: { customerId: customer.id } })
  if (existingTickets === 0) {
    await prisma.supportTicket.create({
      data: {
        customerId: customer.id,
        subject: 'Dúvida sobre garantia',
        message: 'Boa tarde, tenho uma dúvida sobre a garantia do produto que comprei. O iPhone 15 Pro Max que recebi tem garantia de quanto tempo e o que cobre exactamente?',
        status: 'resolved',
        adminReply: 'Olá João! A garantia é de 12 meses contra defeitos de fabrico. Cobre problemas de hardware mas não danos físicos ou por água. Qualquer problema não hesite em contactar-nos. Obrigado pela sua preferência!',
        repliedAt: new Date('2024-02-16T10:00:00Z'),
        createdAt: new Date('2024-02-15T18:00:00Z'),
      },
    })
    console.log('✅ Ticket de suporte criado.')
  }

  // ─── Expense ──────────────────────────────────────────────────────────────
  const existingExpenses = await prisma.expense.count({ where: { supplierId: supplier.id } })
  if (existingExpenses === 0) {
    await prisma.expense.create({
      data: {
        category: 'Importação',
        description: 'Custos de importação - Lote Janeiro 2024 (IMP-2024-001)',
        amount: 6200000,
        currency: 'AOA',
        date: new Date('2024-01-15'),
        supplierId: supplier.id,
      },
    })
    console.log('✅ Despesa de importação criada.')
  }

  // ─── Newsletter ───────────────────────────────────────────────────────────
  await prisma.newsletter.upsert({
    where: { email: 'maria.santos@gmail.com' },
    update: {},
    create: { email: 'maria.santos@gmail.com', name: 'Maria Santos', active: true },
  })
  await prisma.newsletter.upsert({
    where: { email: 'pedro.costa@hotmail.com' },
    update: {},
    create: { email: 'pedro.costa@hotmail.com', name: 'Pedro Costa', active: true },
  })
  await prisma.newsletter.upsert({
    where: { email: 'ana.ferreira@yahoo.com' },
    update: {},
    create: { email: 'ana.ferreira@yahoo.com', name: 'Ana Ferreira', active: true },
  })
  console.log('✅ 3 subscritores da newsletter criados.')

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('\n📋 Credenciais de acesso:')
  console.log('   ─── Admin ──────────────────────')
  console.log('   Email: admin@versaodenegocios.com')
  console.log('   Senha: admin123')
  console.log('   ─── Cliente de Teste ───────────')
  console.log('   Email: cliente@versaodenegocios.com')
  console.log('   Senha: cliente123')
  console.log('   Nome:  João Silva')
  console.log('   ─── Cupões ─────────────────────')
  console.log('   BEMVINDO10 → 10% off (min. 50.000 AOA)')
  console.log('   VIPTECH20  → 20% off (min. 200.000 AOA)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
