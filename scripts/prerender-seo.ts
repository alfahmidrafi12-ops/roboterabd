import fs from 'node:fs';
import path from 'node:path';
import { BLOG_POSTS, CATEGORIES, PRODUCTS } from '../src/data/catalog';
import {
  CANONICAL_ORIGIN,
  DEFAULT_OG_IMAGE,
  DocumentSeoPayload,
  buildCategorySeo,
  buildGuideSeo,
  buildProductSeo,
  buildSectionSeo,
  getCategorySeoInfo,
} from '../src/lib/seo';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsonForHtmlScript(json: unknown): string {
  return JSON.stringify(json).replace(/</g, '\\u003c');
}

function renderHtmlPage(template: string, payload: DocumentSeoPayload, bodyHtml: string): string {
  const cleanPath = payload.canonicalPath.startsWith('/')
    ? payload.canonicalPath
    : `/${payload.canonicalPath}`;
  const canonicalUrl = cleanPath === '/' ? `${CANONICAL_ORIGIN}/` : `${CANONICAL_ORIGIN}${cleanPath}`;
  const ogImage = payload.imageUrl || DEFAULT_OG_IMAGE;
  const imageAlt = payload.imageAlt || payload.title;
  const ogType = payload.ogType || 'website';

  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(payload.title)}</title>`);

  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(payload.description)}" />`
  );

  html = html.replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${payload.noIndex ? 'noindex, nofollow' : 'index, follow'}" />`
  );

  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`
  );

  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(payload.title)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(payload.description)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="${escapeHtml(ogType)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:alt" content="${escapeHtml(imageAlt)}" />`
  );

  html = html.replace(
    /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:url" content="${escapeHtml(canonicalUrl)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeHtml(payload.title)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeHtml(payload.description)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:image:alt"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}" />`
  );

  if (ogType === 'product' && payload.productMeta) {
    const productMetaTags = [
      `<meta property="product:price:amount" content="${escapeHtml(String(payload.productMeta.priceAmount))}" />`,
      `<meta property="product:price:currency" content="${escapeHtml(payload.productMeta.priceCurrency)}" />`,
      `<meta property="product:availability" content="${escapeHtml(payload.productMeta.availability)}" />`,
    ].join('\n    ');
    html = html.replace(/<\/head>/i, `    ${productMetaTags}\n  </head>`);
  }

  if (payload.jsonLd && !payload.noIndex) {
    const ldTag = `<script id="robotera-dynamic-jsonld" type="application/ld+json">${escapeJsonForHtmlScript(payload.jsonLd)}</script>`;
    html = html.replace(/<\/head>/i, `    ${ldTag}\n  </head>`);
  }

  html = html.replace(
    /<noscript>[\s\S]*?<\/noscript>/i,
    `<noscript>\n      <main style="min-height:100vh;width:100%;margin:0;box-sizing:border-box;padding:40px 20px;background:#040F24;color:#F8FAFC;font-family:system-ui,-apple-system,sans-serif;line-height:1.6;">\n        <div style="max-width:860px;width:100%;margin:0 auto;">\n${bodyHtml}\n        </div>\n      </main>\n    </noscript>`
  );

  return html;
}

function writeRouteHtml(routePath: string, html: string) {
  const normalized = routePath.replace(/^\/+|\/+$/g, '');
  if (!normalized) return;
  const outFile = path.join(DIST_DIR, `${normalized}.html`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html, 'utf8');
}

function buildNavFooterHtml(): string {
  const linkStyle =
    'color:#E2E8F0;text-decoration:none;font-size:12px;font-weight:600;padding:5px 10px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(148,163,184,0.22);';
  const categoryLinks = CATEGORIES.map(
    (c) => `<a href="/category/${escapeHtml(c.id)}" style="${linkStyle}">${escapeHtml(c.name)}</a>`
  ).join('\n          ');

  return `<nav aria-label="Storefront links" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid rgba(148,163,184,0.2);">
          <a href="/" style="${linkStyle}">Home</a>
          <a href="/shop" style="${linkStyle}">All Hardware</a>
          ${categoryLinks}
          <a href="/guides" style="${linkStyle}">Engineering Guides</a>
        </nav>`;
}

function run() {
  if (!fs.existsSync(INDEX_HTML_PATH)) {
    throw new Error('dist/index.html not found. Run vite build before prerender-seo.');
  }

  const template = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  const categoryNameMap = new Map(CATEGORIES.map((c) => [c.id, c.name]));
  let generatedCount = 0;

  // 1. Core public storefront pages
  const sectionPaths: Array<{ path: string; heading: string; summary: string; linksHtml?: string }> = [
    {
      path: '/shop',
      heading: 'Shop Robotics, ESP32, Arduino & Electronics Catalog in Bangladesh',
      summary:
        'Browse all bench-tested microcontrollers, LiDAR sensors, servo and stepper motors, robotics kits, LiPo batteries, OLED displays, LoRa wireless modules, and lab debugging tools at Robotera BD.',
      linksHtml: `<ul>${PRODUCTS.map(
        (p) =>
          `<li><a href="/product/${escapeHtml(p.id)}" style="color:#E2E8F0;">${escapeHtml(p.name)} — ৳${p.price.toLocaleString('en-IN')}</a></li>`
      ).join('')}</ul>`,
    },
    {
      path: '/just-arrived',
      heading: 'New Robotics & Electronics Arrivals in Bangladesh',
      summary:
        'Explore recently restocked Raspberry Pi 5, SLAMTEC RPLIDAR A1M8, Jetson Orin Nano, BNO085 9-DOF IMU, and TS101 soldering irons in Dhaka.',
    },
    {
      path: '/bundles',
      heading: 'Robotics Kits & University Lab Bundles in Bangladesh',
      summary:
        'Explore 6-DOF CNC aluminum robotic arm kits, 4WD mecanum rovers, and embedded AI developer hardware stocked for Bangladesh engineering teams.',
    },
    {
      path: '/guides',
      heading: 'ESP32, Arduino, LiDAR & Robotics Engineering Guides',
      summary:
        'Original practical tutorials and wiring guides for ESP32-S3, Arduino, ROS2 LiDAR navigation, high-current motor drivers, and LiPo BMS safety.',
      linksHtml: `<ul>${BLOG_POSTS.map(
        (g) =>
          `<li><a href="/guides/${escapeHtml(g.id)}" style="color:#E2E8F0;">${escapeHtml(g.title)}</a></li>`
      ).join('')}</ul>`,
    },
    {
      path: '/track-order',
      heading: 'Track Your Robotera BD Order Across Bangladesh',
      summary:
        'Enter your Order ID to view live order confirmation and nationwide courier dispatch status from our Dhaka robotics hub.',
    },
  ];

  for (const sec of sectionPaths) {
    const seo = buildSectionSeo(sec.path);
    const body = `
        <h1 style="font-size:26px;font-weight:800;margin:0 0 12px;">${escapeHtml(sec.heading)}</h1>
        <p style="margin:0 0 16px;color:#CBD5E1;">${escapeHtml(sec.summary)}</p>
        ${sec.linksHtml || ''}
        ${buildNavFooterHtml()}`;
    writeRouteHtml(sec.path, renderHtmlPage(template, seo, body));
    generatedCount++;
  }

  // 2. Category pages
  for (const cat of CATEGORIES) {
    const catProducts = PRODUCTS.filter((p) => p.category === cat.id);
    const seo = buildCategorySeo(cat.id, cat.name, catProducts.length);
    const info = getCategorySeoInfo(cat.id, cat.name);
    const listHtml = catProducts
      .map(
        (p) =>
          `<li><a href="/product/${escapeHtml(p.id)}" style="color:#E2E8F0;">${escapeHtml(p.name)} (${escapeHtml(p.sku)}) — ৳${p.price.toLocaleString('en-IN')}</a></li>`
      )
      .join('');
    const body = `
        <p style="font-size:12px;color:#60A5FA;margin:0 0 8px;">Robotera BD · Category</p>
        <h1 style="font-size:26px;font-weight:800;margin:0 0 12px;">${escapeHtml(info.introHeading)}</h1>
        <p style="margin:0 0 16px;color:#CBD5E1;">${escapeHtml(info.introText)}</p>
        <ul style="margin:0 0 16px;padding-left:20px;">${listHtml}</ul>
        ${buildNavFooterHtml()}`;
    writeRouteHtml(`/category/${cat.id}`, renderHtmlPage(template, seo, body));
    generatedCount++;
  }

  // 3. Product pages
  for (const product of PRODUCTS) {
    const categoryName = categoryNameMap.get(product.category) || product.categoryLabel;
    const seo = buildProductSeo(product, categoryName);
    const specsHtml = product.specs
      .map((s) => `<li><strong>${escapeHtml(s.label)}:</strong> ${escapeHtml(s.value)}</li>`)
      .join('');
    const body = `
        <p style="font-size:12px;color:#60A5FA;margin:0 0 8px;">
          <a href="/" style="color:#93C5FD;">Home</a> / <a href="/category/${escapeHtml(product.category)}" style="color:#93C5FD;">${escapeHtml(categoryName)}</a> / ${escapeHtml(product.sku)}
        </p>
        <h1 style="font-size:26px;font-weight:800;margin:0 0 12px;">${escapeHtml(product.name)}</h1>
        <p style="font-size:20px;font-weight:700;color:#60A5FA;margin:0 0 10px;">Price in Bangladesh: ৳${product.price.toLocaleString('en-IN')} BDT (${product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'})</p>
        <p style="margin:0 0 16px;color:#CBD5E1;">${escapeHtml(product.shortDesc)}</p>
        <ul style="margin:0 0 16px;padding-left:20px;">${specsHtml}</ul>
        ${buildNavFooterHtml()}`;
    writeRouteHtml(`/product/${product.id}`, renderHtmlPage(template, seo, body));
    generatedCount++;
  }

  // 4. Engineering guide pages
  for (const post of BLOG_POSTS) {
    const seo = buildGuideSeo(post);
    const paragraphsHtml = post.content
      .map((p) => `<p style="margin:0 0 12px;color:#CBD5E1;">${escapeHtml(p)}</p>`)
      .join('');
    const body = `
        <p style="font-size:12px;color:#60A5FA;margin:0 0 8px;">
          <a href="/guides" style="color:#93C5FD;">Engineering Guides</a> · ${escapeHtml(post.category)} · ${escapeHtml(post.date)} · ${escapeHtml(post.author)}
        </p>
        <h1 style="font-size:26px;font-weight:800;margin:0 0 12px;">${escapeHtml(post.title)}</h1>
        <p style="margin:0 0 16px;color:#E2E8F0;font-weight:600;">${escapeHtml(post.excerpt)}</p>
        ${paragraphsHtml}
        ${buildNavFooterHtml()}`;
    writeRouteHtml(`/guides/${post.id}`, renderHtmlPage(template, seo, body));
    generatedCount++;
  }

  console.log(`Pre-rendered ${generatedCount} static SEO HTML routes in dist/.`);
}

run();
