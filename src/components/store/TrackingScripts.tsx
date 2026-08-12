interface TrackingSettings {
  googleAnalyticsId?: string | null
  googleAnalyticsEnabled?: boolean
  googleTagManagerId?: string | null
  googleTagManagerEnabled?: boolean
  metaPixelId?: string | null
  metaPixelEnabled?: boolean
  tiktokPixelId?: string | null
  tiktokPixelEnabled?: boolean
  linkedinInsightId?: string | null
  linkedinInsightEnabled?: boolean
  hotjarId?: string | null
  hotjarEnabled?: boolean
  microsoftClarityId?: string | null
  microsoftClarityEnabled?: boolean
}

/**
 * Injeta os scripts de tracking (GA4, GTM, Meta Pixel, TikTok, LinkedIn,
 * Hotjar, Clarity) com base no que está activo em Configurações → Analytics.
 *
 * IMPORTANTE — porque não usamos next/script aqui:
 * Este componente já usou `next/script` (`<Script strategy="afterInteractive">`)
 * numa versão anterior. Em produção, verificámos que essas tags nunca chegavam
 * a materializar-se como <script> reais no DOM — ficavam presas na descrição
 * serializada do React Server Components (o payload de streaming
 * `self.__next_f.push(...)`), tanto no HTML inicial como depois da hidratação.
 * Resultado: o fbevents.js nunca era pedido, `window.fbq` nunca era criado, e
 * todos os eventos ficavam presos numa fila que nunca era esvaziada (nem
 * sequer havia stub — o próprio init nunca corria).
 *
 * A correcção é usar tags <script> simples, renderizadas directamente pelo
 * Server Component via `dangerouslySetInnerHTML` — isto entra no HTML como
 * markup literal e o browser executa-as em ordem de documento, tal como
 * qualquer página HTML estática, sem depender do ciclo de vida de
 * carregamento assíncrono do next/script.
 */
export function TrackingScripts({ settings }: { settings: TrackingSettings | null }) {
  if (!settings) return null

  return (
    <>
      {settings.googleAnalyticsEnabled && settings.googleAnalyticsId && (
        <>
          <script src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`} async />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${settings.googleAnalyticsId}');`,
            }}
          />
        </>
      )}

      {settings.googleTagManagerEnabled && settings.googleTagManagerId && (
        <>
          {/* eslint-disable-next-line @next/next/next-script-for-ga -- injecção directa é intencional, ver comentário no topo do ficheiro */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${settings.googleTagManagerId}');`,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${settings.googleTagManagerId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}

      {settings.metaPixelEnabled && settings.metaPixelId && (
        <>
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${settings.metaPixelId}');
fbq('track', 'PageView');`,
            }}
          />
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              alt=""
              src={`https://www.facebook.com/tr?id=${settings.metaPixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}

      {settings.tiktokPixelEnabled && settings.tiktokPixelId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `!function (w, d, t) {
w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<e.length;n++)ttq.setAndDefer(e,e[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=i+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
ttq.load('${settings.tiktokPixelId}');
ttq.page();
}(window, document, 'ttq');`,
          }}
        />
      )}

      {settings.linkedinInsightEnabled && settings.linkedinInsightId && (
        <>
          <script
            dangerouslySetInnerHTML={{
              __html: `_linkedin_partner_id = "${settings.linkedinInsightId}";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);`,
            }}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(l) {
if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
window.lintrk.q=[]}
var s = document.getElementsByTagName("script")[0];
var b = document.createElement("script");
b.type = "text/javascript";b.async = true;
b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
s.parentNode.insertBefore(b, s);})(window.lintrk);`,
            }}
          />
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              alt=""
              src={`https://px.ads.linkedin.com/collect/?pid=${settings.linkedinInsightId}&fmt=gif`}
            />
          </noscript>
        </>
      )}

      {settings.hotjarEnabled && settings.hotjarId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(h,o,t,j,a,r){
h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
h._hjSettings={hjid:${settings.hotjarId},hjsv:6};
a=o.getElementsByTagName('head')[0];
r=o.createElement('script');r.async=1;
r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
a.appendChild(r);
})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`,
          }}
        />
      )}

      {settings.microsoftClarityEnabled && settings.microsoftClarityId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${settings.microsoftClarityId}");`,
          }}
        />
      )}
    </>
  )
}
