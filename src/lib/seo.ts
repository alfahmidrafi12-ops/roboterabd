import { BRAND_STUDIO_MEDIA } from '../data/brandMedia';
import { BlogPost, Product } from '../types/store';

export const CANONICAL_ORIGIN = 'https://roboterabd.vercel.app';
export const DEFAULT_OG_IMAGE = `${CANONICAL_ORIGIN}/assets/aistudio/image_88bf5559.png`;

export interface CategorySeoInfo {
  title: string;
  description: string;
  introHeading: string;
  introText: string;
}

export interface DocumentSeoPayload {
  title: string;
  description: string;
  canonicalPath: string;
  ogType?: 'website' | 'product' | 'article';
  imageUrl?: string;
  imageAlt?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | null;
}

export const HOME_SEO: Omit<DocumentSeoPayload, 'jsonLd'> = {
  title: 'Robotera BD – Robotics, ESP32 & Electronics Store in Bangladesh',
  description:
    'Shop ESP32, Arduino, robotics kits, LiDAR sensors, electronic components and engineering tools at Robotera BD. Nationwide delivery across Bangladesh.',
  canonicalPath: '/',
  ogType: 'website',
  imageUrl: DEFAULT_OG_IMAGE,
  imageAlt:
    'Robotera BD robotics components, ESP32-S3, LiDAR sensors, and embedded electronics in Bangladesh',
};

export const CATEGORY_SEO: Record<string, CategorySeoInfo> = {
  microcontrollers: {
    title: 'ESP32, Arduino & Raspberry Pi Price in Bangladesh | Robotera BD',
    description:
      'Buy original ESP32-S3 DevKit, Arduino Mega 2560, STM32F407, Raspberry Pi 5, and NVIDIA Jetson Orin Nano in Bangladesh with Dhaka and nationwide courier.',
    introHeading: 'Microcontrollers, Development Boards & Edge SBCs',
    introText:
      'Compare ESP32-S3 Wi-Fi/BLE boards, Arduino Mega 2560 R3 controllers, STM32 ARM Cortex-M4 boards, Raspberry Pi 5, and Jetson Orin Nano developer kits stocked in Dhaka for IoT automation, university robotics, and embedded R&D across Bangladesh.',
  },
  sensors: {
    title: 'LiDAR, Ultrasonic & 9-DOF IMU Sensors in Bangladesh | Robotera BD',
    description:
      'Shop SLAMTEC RPLIDAR A1M8 360° laser scanners, HC-SR04P ultrasonic sensors, and BNO085 9-DOF IMU modules in Bangladesh at Robotera BD.',
    introHeading: 'Robotics Perception, LiDAR & Inertial Sensors',
    introText:
      'Build reliable obstacle avoidance, ROS2 SLAM mapping, and orientation stabilization with bench-tested 360° 2D laser scanners, wide-voltage ultrasonic rangefinders, and hardware-fusion 9-DOF IMUs delivered across Bangladesh.',
  },
  motors: {
    title: 'Servo, Stepper, Brushless Motors & Drivers in BD | Robotera BD',
    description:
      'Order TowerPro MG996R metal-gear servos, NEMA 17 stepper motors, BTS7960 43A H-bridge drivers, and FOC brushless actuators in Bangladesh.',
    introHeading: 'Precision Actuators, Servos & High-Current Drivers',
    introText:
      'Power robotic grippers, CNC gantries, combat bots, and autonomous rovers with TowerPro metal-gear servos, NEMA 17 bipolar steppers, AS5600-ready brushless motors, and isolated BTS7960 high-current motor drivers.',
  },
  'robotics-kits': {
    title: 'Robotics Kits, 6-DOF Arm & Mecanum Rover Chassis BD | Robotera BD',
    description:
      'Shop 6-DOF CNC aluminum robotic arm kits and 4WD omnidirectional mecanum rover chassis platforms in Bangladesh with nationwide delivery.',
    introHeading: 'Complete Robotics Kits, Manipulators & Rover Platforms',
    introText:
      'Designed for BUET, KUET, RUET, CUET, and university mechatronics teams—explore CNC-machined 6-DOF robotic arm assemblies and encoder-equipped 4WD mecanum rover platforms ready for Arduino, ESP32, and ROS2 integration.',
  },
  power: {
    title: 'LiPo Batteries, Balanced BMS & DC-DC Buck Modules BD | Robotera BD',
    description:
      'Buy 3S 11.1V 2200mAh LiPo XT60 batteries, 4S 40A balanced Li-Ion BMS boards, and XL4015 5A DC-DC buck converters in Bangladesh.',
    introHeading: 'High-Discharge LiPo Packs, BMS & Regulated Power Electronics',
    introText:
      'Keep field robots and embedded controllers protected with genuine XT60 high-discharge LiPo packs, cell-balanced 4S 40A BMS protection boards, and CC/CV step-down buck converters for clean 5V/12V power distribution.',
  },
  displays: {
    title: 'OLED Displays & Embedded HMI Modules Price in BD | Robotera BD',
    description:
      'Shop 0.96-inch SSD1306 128x64 I2C OLED displays and embedded HMI screens in Bangladesh for Arduino, ESP32, and Raspberry Pi projects.',
    introHeading: 'Compact OLED Displays & Embedded Status Interfaces',
    introText:
      'Monitor live sensor telemetry, battery voltage, and robot diagnostics using low-pin-count I2C SSD1306 OLED screens compatible with 3.3V ESP32/STM32 and 5V Arduino logic.',
  },
  wireless: {
    title: 'LoRa 433MHz & Wireless Telemetry Modules in Bangladesh | Robotera BD',
    description:
      'Buy SX1278 Ra-02 LoRa 433MHz long-range transceivers and wireless IoT communication modules in Bangladesh at Robotera BD.',
    introHeading: 'Long-Range LoRa & Embedded Wireless Telemetry',
    introText:
      'Establish reliable long-range rover telemetry, agricultural monitoring, and university satellite/CanSat ground links with 433MHz spread-spectrum LoRa modules and antenna kits.',
  },
  tools: {
    title: 'TS101 Soldering Iron & 24MHz USB Logic Analyzer BD | Robotera BD',
    description:
      'Shop Miniware TS101 90W USB-C smart soldering irons and 8-channel 24MHz USB logic analyzers for embedded hardware debugging in Bangladesh.',
    introHeading: 'Precision Soldering & Protocol Debugging Instruments',
    introText:
      'Equip your electronics workbench with PID-controlled USB-C PD soldering irons and 8-channel 24MHz digital logic analyzers for decoding SPI, I2C, UART, CAN, and PWM signals.',
  },
};

export function inferProductBrand(product: Product): string | undefined {
  const name = product.name;
  if (/SLAMTEC/i.test(name)) return 'SLAMTEC';
  if (/TowerPro/i.test(name)) return 'TowerPro';
  if (/Raspberry Pi/i.test(name)) return 'Raspberry Pi';
  if (/NVIDIA/i.test(name)) return 'NVIDIA';
  if (/Miniware/i.test(name)) return 'Miniware';
  if (/ZOP Power/i.test(name)) return 'ZOP Power';
  if (/Arduino/i.test(name)) return 'Arduino Compatible';
  if (/ESP32-S3-DevKitC-1/i.test(name)) return 'Espressif ESP32-S3';
  if (/STM32/i.test(name)) return 'STMicroelectronics';
  if (/Ra-02|SX1278/i.test(name)) return 'Ai-Thinker';
  return undefined;
}

export function resolveAbsoluteImageUrl(imageUrl?: string): string {
  const trimmed = imageUrl?.trim() || '';
  if (!trimmed) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${CANONICAL_ORIGIN}${trimmed}`;
  return `${CANONICAL_ORIGIN}/${trimmed}`;
}

export function getCategorySeoInfo(categoryId: string, categoryName?: string): CategorySeoInfo {
  if (CATEGORY_SEO[categoryId]) {
    return CATEGORY_SEO[categoryId];
  }
  const safeName = categoryName?.trim() || categoryId;
  return {
    title: `${safeName} in Bangladesh | Robotera BD`,
    description: `Explore bench-tested ${safeName} robotics components and embedded electronics at Robotera BD with fast Dhaka and nationwide delivery across Bangladesh.`,
    introHeading: safeName,
    introText: `Browse verified ${safeName} components stocked in Dhaka for makers, engineering students, and robotics builders across Bangladesh.`,
  };
}

export function buildProductSeo(product: Product, categoryDisplayName?: string): DocumentSeoPayload {
  const categoryLabel = categoryDisplayName || product.categoryLabel || 'Hardware';
  const formattedPrice = `৳${product.price.toLocaleString('en-IN')}`;
  const availabilityLabel = product.stock > 0 ? 'In Stock in Dhaka' : 'Currently Out of Stock';
  const description = `${product.name} (${formattedPrice} BDT, ${availabilityLabel}). ${product.shortDesc}`.slice(
    0,
    160
  );
  const canonicalPath = `/product/${encodeURIComponent(product.id)}`;
  const productUrl = `${CANONICAL_ORIGIN}${canonicalPath}`;
  const categoryUrl = `${CANONICAL_ORIGIN}/category/${encodeURIComponent(product.category)}`;
  const imageUrl = resolveAbsoluteImageUrl(product.imageUrl);
  const inferredBrand = inferProductBrand(product);

  const productSchema: Record<string, unknown> = {
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: product.name,
    sku: product.sku,
    description: product.shortDesc,
    category: categoryLabel,
    image: [imageUrl],
    url: productUrl,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'BDT',
      price: product.price,
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        '@id': `${CANONICAL_ORIGIN}/#organization`,
        name: 'Robotera BD',
      },
    },
  };

  if (inferredBrand) {
    productSchema.brand = {
      '@type': 'Brand',
      name: inferredBrand,
    };
  }

  if (product.rating > 0 && product.reviews > 0) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(product.rating.toFixed(1)),
      reviewCount: product.reviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const breadcrumbSchema: Record<string, unknown> = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${CANONICAL_ORIGIN}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: categoryLabel,
        item: categoryUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return {
    title: `${product.name} Price in Bangladesh (${formattedPrice}) | Robotera BD`,
    description,
    canonicalPath,
    ogType: 'product',
    imageUrl,
    imageAlt: `${product.name} – ${categoryLabel} in Bangladesh | Robotera BD`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [productSchema, breadcrumbSchema],
    },
  };
}

export function buildCategorySeo(
  categoryId: string,
  categoryName?: string,
  productCount?: number
): DocumentSeoPayload {
  const info = getCategorySeoInfo(categoryId, categoryName);
  const displayName = categoryName?.trim() || info.introHeading;
  const canonicalPath = `/category/${encodeURIComponent(categoryId)}`;
  const categoryUrl = `${CANONICAL_ORIGIN}${canonicalPath}`;

  return {
    title: info.title,
    description: info.description,
    canonicalPath,
    ogType: 'website',
    imageUrl: DEFAULT_OG_IMAGE,
    imageAlt: `${displayName} robotics and electronics catalog at Robotera BD`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': `${categoryUrl}#collection`,
          url: categoryUrl,
          name: info.title,
          description: info.description,
          numberOfItems: typeof productCount === 'number' ? productCount : undefined,
          isPartOf: {
            '@id': `${CANONICAL_ORIGIN}/#website`,
          },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${CANONICAL_ORIGIN}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: displayName,
              item: categoryUrl,
            },
          ],
        },
      ],
    },
  };
}

export function buildGuideSeo(post: BlogPost, customImageUrl?: string): DocumentSeoPayload {
  const canonicalPath = `/guides/${encodeURIComponent(post.id)}`;
  const articleUrl = `${CANONICAL_ORIGIN}${canonicalPath}`;
  const parsedDate = Date.parse(post.date);
  const isoDate = Number.isNaN(parsedDate)
    ? undefined
    : new Date(parsedDate).toISOString().split('T')[0];
  const imageUrl = resolveAbsoluteImageUrl(customImageUrl || BRAND_STUDIO_MEDIA.darkRoboticsStage);

  return {
    title: `${post.title} | Robotera BD Guides`,
    description: post.excerpt.slice(0, 160),
    canonicalPath,
    ogType: 'article',
    imageUrl,
    imageAlt: post.title,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          '@id': `${articleUrl}#article`,
          headline: post.title,
          description: post.excerpt,
          articleSection: post.category,
          datePublished: isoDate,
          dateModified: isoDate,
          image: [imageUrl],
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': articleUrl,
          },
          author: {
            '@type': 'Person',
            name: post.author,
          },
          publisher: {
            '@type': 'Organization',
            '@id': `${CANONICAL_ORIGIN}/#organization`,
            name: 'Robotera BD',
            logo: {
              '@type': 'ImageObject',
              url: `${CANONICAL_ORIGIN}/pwa-512x512.png`,
            },
          },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${CANONICAL_ORIGIN}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Engineering Guides',
              item: `${CANONICAL_ORIGIN}/guides`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: post.title,
              item: articleUrl,
            },
          ],
        },
      ],
    },
  };
}

export function buildSectionSeo(pathname: string, searchQuery?: string): DocumentSeoPayload {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const trimmedQuery = searchQuery?.trim() || '';

  if (cleanPath === '/shop') {
    if (trimmedQuery) {
      return {
        title: `Search "${trimmedQuery}" – Electronics & Robotics Catalog | Robotera BD`,
        description: `Browse ${trimmedQuery} robotics components, microcontrollers, sensors, and embedded hardware in Bangladesh at Robotera BD.`,
        canonicalPath: '/shop',
        ogType: 'website',
        noIndex: true,
        jsonLd: null,
      };
    }
    return {
      title: 'Shop Robotics, ESP32, Arduino & Electronics Catalog BD | Robotera BD',
      description:
        'Browse all bench-tested microcontrollers, LiDAR sensors, servo & stepper motors, LiPo batteries, and soldering tools at Robotera BD.',
      canonicalPath: '/shop',
      ogType: 'website',
      jsonLd: null,
    };
  }

  if (cleanPath === '/just-arrived') {
    return {
      title: 'New Robotics & Electronics Arrivals in Bangladesh | Robotera BD',
      description:
        'Discover newly stocked Raspberry Pi 5, RPLIDAR A1M8, Jetson Orin Nano, BNO085 IMU, and TS101 lab tools at Robotera BD.',
      canonicalPath: '/just-arrived',
      ogType: 'website',
      jsonLd: null,
    };
  }

  if (cleanPath === '/bundles') {
    return {
      title: 'Robotics Kits & University Lab Bundles in Bangladesh | Robotera BD',
      description:
        'Explore 6-DOF CNC robotic arm kits, 4WD mecanum rovers, and embedded AI lab ecosystems for engineering teams in Bangladesh.',
      canonicalPath: '/bundles',
      ogType: 'website',
      jsonLd: null,
    };
  }

  if (cleanPath === '/guides') {
    return {
      title: 'ESP32, Arduino, LiDAR & Robotics Engineering Guides | Robotera BD',
      description:
        'Read technical tutorials on ESP32-S3, ROS2 RPLIDAR navigation, motor driver selection, LiPo BMS wiring, and lab debugging in Bangladesh.',
      canonicalPath: '/guides',
      ogType: 'website',
      jsonLd: null,
    };
  }

  if (cleanPath === '/track-order') {
    return {
      title: 'Track Your Order – Nationwide Courier Status | Robotera BD',
      description:
        'Track your Robotera BD robotics and electronics shipment live using your Order ID across Dhaka and nationwide Bangladesh.',
      canonicalPath: '/track-order',
      ogType: 'website',
      jsonLd: null,
    };
  }

  return {
    ...HOME_SEO,
    jsonLd: null,
  };
}

function upsertMetaTag(attr: 'name' | 'property', key: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function applyDocumentSeo(payload: DocumentSeoPayload) {
  if (typeof document === 'undefined') return;

  const cleanPath = payload.canonicalPath.startsWith('/')
    ? payload.canonicalPath
    : `/${payload.canonicalPath}`;
  const canonicalUrl = cleanPath === '/' ? `${CANONICAL_ORIGIN}/` : `${CANONICAL_ORIGIN}${cleanPath}`;
  const ogImage = payload.imageUrl || DEFAULT_OG_IMAGE;

  document.title = payload.title;

  const canonicalEl = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonicalEl) {
    canonicalEl.href = canonicalUrl;
  }

  upsertMetaTag('name', 'description', payload.description);
  upsertMetaTag('name', 'robots', payload.noIndex ? 'noindex, nofollow' : 'index, follow');
  upsertMetaTag('property', 'og:title', payload.title);
  upsertMetaTag('property', 'og:description', payload.description);
  upsertMetaTag('property', 'og:url', canonicalUrl);
  upsertMetaTag('property', 'og:type', payload.ogType || 'website');
  upsertMetaTag('property', 'og:image', ogImage);
  if (payload.imageAlt) {
    upsertMetaTag('property', 'og:image:alt', payload.imageAlt);
  }
  upsertMetaTag('name', 'twitter:title', payload.title);
  upsertMetaTag('name', 'twitter:description', payload.description);
  upsertMetaTag('name', 'twitter:image', ogImage);

  const scriptId = 'robotera-dynamic-jsonld';
  let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (payload.jsonLd && !payload.noIndex) {
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(payload.jsonLd);
  } else if (scriptEl) {
    scriptEl.remove();
  }
}
