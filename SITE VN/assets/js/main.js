/* ═══════════════════════════════════════════
   Versão de Negócios — main.js
   Partilhado por todas as páginas do site
   ═══════════════════════════════════════════ */

const VN = {
  wa: '244936902736',
  email: 'geral@versaodenegocios.com',
  tel: '+244 936 902 736',
  morada: 'Bairro Militar, Luanda, Angola',
  nif: '5002174308',
  site: 'www.versaodenegocios.com',
  fb: 'https://www.facebook.com/share/1Gg79XWN8s/?mibextid=wwXIfr',
  ig: 'https://www.instagram.com/versaodenegocioslda',
};

const WA_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>`;

/* ── Helpers ── */
function openWA(service) {
  const msg = encodeURIComponent(`Olá! Tenho interesse no serviço: ${service}. Podem enviar uma proposta comercial?`);
  window.open(`https://wa.me/${VN.wa}?text=${msg}`, '_blank');
}

function sendContactWA() {
  const nome    = document.getElementById('cNome')?.value.trim() || '';
  const empresa = document.getElementById('cEmpresa')?.value.trim() || '';
  const tel     = document.getElementById('cTel')?.value.trim() || '';
  const servico = document.getElementById('cServico')?.value || '';
  const msg     = document.getElementById('cMsg')?.value.trim() || '';
  if (!nome || !tel || !servico) { alert('Por favor preencha os campos obrigatórios (*)'); return; }
  const txt = `🔧 *Nova Solicitação de Proposta*\n\n👤 *Nome:* ${nome}\n🏢 *Empresa:* ${empresa || '—'}\n📞 *Telefone:* ${tel}\n🔧 *Serviço:* ${servico}\n📋 *Projecto:* ${msg || '—'}`;
  window.open(`https://wa.me/${VN.wa}?text=${encodeURIComponent(txt)}`, '_blank');
}

/* ── Nav injection ── */
function getRoot() {
  const d = document.documentElement.dataset.root;
  return d !== undefined ? d : '';
}

function injectNav(activePage) {
  const root = getRoot();
  const logoPath = root + 'assets/img/logo.jpg';
  const navLinks = [
    { href: root + 'index.html#servicos',    label: 'Serviços',    id: 'servicos' },
    { href: root + 'projectos.html',          label: 'Projectos',   id: 'projectos' },
    { href: root + 'sobre.html',              label: 'Sobre Nós',   id: 'sobre' },
    { href: root + 'contacto.html',           label: 'Contacto',    id: 'contacto' },
  ];

  const links = navLinks.map(l =>
    `<a class="nav-link${activePage === l.id ? ' active' : ''}" href="${l.href}">${l.label}</a>`
  ).join('');

  const mobileLinks = navLinks.map(l =>
    `<a class="mobile-nav-link" href="${l.href}" onclick="document.getElementById('mobileNav').classList.remove('open')">${l.label}</a>`
  ).join('');

  const html = `
<header>
  <div class="container">
    <div class="nav-inner">
      <a class="nav-logo" href="${root}index.html">
        <img src="${logoPath}" alt="Versão de Negócios" onerror="this.style.display='none'">
        <span class="nav-logo-text">Versão de <em>Negócios</em></span>
      </a>
      <nav class="nav-links">${links}</nav>
      <div class="nav-actions">
        <a href="https://wa.me/${VN.wa}?text=Olá! Quero solicitar uma proposta comercial." class="nav-wa" target="_blank">
          ${WA_SVG} Pedir Proposta
        </a>
        <button class="hamburger" onclick="document.getElementById('mobileNav').classList.toggle('open')" aria-label="Menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
    </div>
  </div>
</header>
<div class="mobile-nav" id="mobileNav">${mobileLinks}</div>`;

  const el = document.getElementById('nav-placeholder');
  if (el) el.outerHTML = html;
}

/* ── Footer injection ── */
function injectFooter() {
  const root = getRoot();
  const SOCIAL = `
    <a class="social-btn" href="${VN.fb}" target="_blank" title="Facebook">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
    </a>
    <a class="social-btn" href="${VN.ig}" target="_blank" title="Instagram">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
    </a>
    <a class="social-btn" href="https://wa.me/${VN.wa}" target="_blank" title="WhatsApp">
      ${WA_SVG.replace('width="15" height="15"', 'width="18" height="18"')}
    </a>`;

  const html = `
<footer>
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <p>Soluções integradas de tecnologia, segurança e comunicação para empresas e instituições em Angola.</p>
        <div style="font-size:.78rem;color:var(--text3)">NIF: ${VN.nif} · Luanda, Angola</div>
        <div class="social-row" style="margin-top:1rem">${SOCIAL}</div>
      </div>
      <div class="footer-col">
        <h4>Serviços</h4>
        <ul class="footer-links">
          <li><a href="${root}servicos/controlo-acessos.html">Controlo de Acessos</a></li>
          <li><a href="${root}servicos/cftv.html">CFTV / Vigilância</a></li>
          <li><a href="${root}servicos/redes-dados.html">Redes de Dados</a></li>
          <li><a href="${root}servicos/audiovisual.html">Audiovisual</a></li>
          <li><a href="${root}servicos/marketing-digital.html">Marketing Digital</a></li>
          <li><a href="${root}servicos/cowork.html">Azul Cowork</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Empresa</h4>
        <ul class="footer-links">
          <li><a href="${root}sobre.html">Sobre Nós</a></li>
          <li><a href="${root}projectos.html">Projectos</a></li>
          <li><a href="${root}contacto.html">Contacto</a></li>
          <li><a href="https://wa.me/${VN.wa}" target="_blank">WhatsApp</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Contacto</h4>
        <ul class="footer-links" style="gap:.7rem">
          <li style="color:var(--text2);font-size:.82rem">${VN.tel}</li>
          <li style="color:var(--text2);font-size:.82rem">${VN.email}</li>
          <li style="color:var(--text2);font-size:.82rem">${VN.site}</li>
          <li style="color:var(--text2);font-size:.82rem">${VN.morada}</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Versão de Negócios, Lda · NIF: ${VN.nif}</span>
      <span>Tecnologia &amp; Segurança · Luanda, Angola</span>
    </div>
  </div>
</footer>`;

  const el = document.getElementById('footer-placeholder');
  if (el) el.outerHTML = html;
}

/* ── Services catalogue ── */
const SERVICES = [
  {id:1,cat:'acessos',emoji:'🔐',name:'Controlo de Acessos Biométrico',spec:'Leitor Suprema BioEntryW2 · Fechadura ZKT LM-2805 · Standalone',price:'Sob Consulta',badges:['hot'],features:['Leitores biométricos Suprema BioEntryW2','Fechaduras magnéticas ZKT LM-2805','Suportes ZL e botões de saída IR ASF908','Módulos Secure I/O 2 (Suprema)','Carregadores 12V 2A dedicados','Cablagem e ligações eléctricas','Configuração, testes e documentação','Trabalhos de construção civil incluídos']},
  {id:2,cat:'redes',emoji:'🌐',name:'Rede de Dados Estruturada',spec:'FTP Cat.6 · 100% Cobre · Topologia Estrela · TIA/EIA-568',price:'Sob Consulta',badges:['new'],features:['Cabo FTP Cat.6 Cabilex/Furukawa 100% cobre','Patch panels 48 portas Cat.6 FTP','Esteira metálica portacabos 100x60mm','Keystones RJ-45 e faceplates duplas','Etiquetagem profissional ambas extremidades','Testes de continuidade 100% dos pontos','Organização e penteado de rack','Documentação completa e acta de recepção']},
  {id:3,cat:'cftv',emoji:'📷',name:'Sistema CFTV – Câmeras IP',spec:'Hikvision/Dahua · 5MP PoE · NVR 16 Canais · Gravação 24/7',price:'Sob Consulta',badges:['hot'],features:['Câmeras IP 5MP Full HD PoE','NVR 16 canais H.265+ 4K','Disco rígido 6TB classe surveillance','Gravação contínua 30–45 dias','Acesso remoto via smartphone/PC','Detecção de movimento e alertas','Cabagem FTP Cat.6 Outdoor','Configuração e formação ao utilizador']},
  {id:4,cat:'audiovisual',emoji:'🎬',name:'Soluções Audiovisuais',spec:'Projetores · Sistemas de Som · Videoconferência · Instalação',price:'Sob Consulta',badges:['new'],features:['Projetores e ecrãs de projecção','Sistemas de som profissional','Equipamentos de videoconferência','Suportes e fixações profissionais','Cablagem HDMI/VGA/Audio','Configuração completa do sistema','Formação ao utilizador','Suporte técnico pós-instalação']},
  {id:5,cat:'marketing',emoji:'📢',name:'Marketing Digital – Versão Digital',spec:'Gestão Redes Sociais · Branding · Identidade Visual · Campanhas',price:'Sob Consulta',badges:['new'],features:['Gestão de redes sociais (Facebook, Instagram, LinkedIn)','Criação de conteúdo visual e textual','Identidade visual e branding','Campanhas de publicidade digital','Gestão de comunidade e interacção','Relatórios mensais de desempenho','Criação e optimização de website','Fotografia e vídeo profissional']},
  {id:6,cat:'cowork',emoji:'🏢',name:'Azul Cowork – Espaço de Trabalho',spec:'Escritórios Privados · Sala Reuniões · Wi-Fi · Endereço Fiscal',price:'Sob Consulta',badges:['new'],features:['Escritórios privados e postos flexíveis','Sala de reuniões equipada','Wi-Fi de alta velocidade','Impressão, digitalização e cópia','Endereço fiscal e postal','Recepção e gestão de correspondência','Serviço de café e água','Ambiente profissional e tranquilo']},
  {id:7,cat:'acessos',emoji:'🔑',name:'Fechaduras Magnéticas ZKT',spec:'LM-2805 · 280kg de Força · Suporte ZL · Alimentação 12V',price:'Sob Consulta',badges:[],features:['Fechadura magnética ZKT LM-2805','Força de retenção 280kg','Suporte ZL incluso (LMB-280ZL)','Carregador 12V 2A dedicado','Botão de saída IR ASF908','Instalação profissional incluída','Compatível com leitores biométricos','Teste e entrega documentada']},
  {id:8,cat:'redes',emoji:'🔌',name:'Patch Panel e Rack de Telecomunicações',spec:'48 Portas Cat.6 FTP · Organização · Etiquetagem',price:'Sob Consulta',badges:[],features:['Patch panel 48 portas Cat.6 FTP 2U 19"','Organizador horizontal cabos 1U','Montagem e organização de rack','Patch cords FTP 0,5m e 2m','Etiquetagem codificada +10 anos','Penteado e amarração de cabos','Documentação: esquema de patch panel','Testes de conectividade completos']},
];

let currentCat = 'todos';

function filterCat(cat) {
  currentCat = cat;
  document.querySelectorAll('[data-cat]').forEach(b => {
    b.classList.toggle('admin-btn-gold', b.dataset.cat === cat || (cat === 'todos' && b.dataset.cat === 'todos'));
  });
  renderGrid();
}

function renderGrid() {
  const grid = document.getElementById('mainGrid');
  if (!grid) return;
  const items = currentCat === 'todos' ? SERVICES : SERVICES.filter(s => s.cat === currentCat);
  grid.innerHTML = items.map(buildCard).join('');
}

function buildCard(s) {
  const badgeHtml = s.badges.map(b => {
    if (b === 'new') return '<span class="prod-badge pb-new">NOVO</span>';
    if (b === 'hot') return '<span class="prod-badge pb-hot">DESTAQUE</span>';
    return '';
  }).join('');
  return `
<div class="product-card" data-cat="${s.cat}" onclick="openModal(${s.id})">
  <div class="product-img">
    <div style="font-size:4.5rem">${s.emoji}</div>
    <div class="product-badge-wrap">${badgeHtml}</div>
  </div>
  <div class="product-body">
    <p class="product-cat">${s.cat.toUpperCase()}</p>
    <h3 class="product-name">${s.name}</h3>
    <p class="product-spec">${s.spec}</p>
    <div class="product-price-row"><span class="product-price">${s.price}</span></div>
    <div class="product-actions">
      <button class="product-btn-wa" onclick="event.stopPropagation();openWA('${s.name}')">
        ${WA_SVG} Pedir Proposta
      </button>
      <button class="product-btn-info" onclick="event.stopPropagation();openModal(${s.id})" title="Ver detalhes">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </button>
    </div>
  </div>
</div>`;
}

function openModal(id) {
  const s = SERVICES.find(x => x.id === id);
  if (!s) return;
  const feats = s.features.map(f => `<li>${f}</li>`).join('');
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-emoji">${s.emoji}</div>
    <div class="modal-name">${s.name}</div>
    <div class="modal-spec">${s.spec}</div>
    <ul class="modal-features">${feats}</ul>
    <div class="modal-price">${s.price}</div>
    <div class="modal-btns">
      <button class="btn btn-wa" style="flex:1;justify-content:center" onclick="openWA('${s.name}')">
        ${WA_SVG.replace('15', '16')} Solicitar Proposta
      </button>
      <button class="btn btn-ghost" onclick="closeModal()">Fechar</button>
    </div>`;
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
