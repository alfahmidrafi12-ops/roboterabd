import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { CATEGORY_STUDIO_MEDIA, isWatermarkedUrl } from '../data/brandMedia';
import { playTapSound } from '../lib/sound';
import { CategoryId, CategoryItem, Product } from '../types/store';
import { Reveal } from './Reveal';

interface CategoryCarouselProps {
  categories: CategoryItem[];
  products?: Product[];
  activeCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
}

const MOBILE_INITIAL_COUNT = 4;
const DESKTOP_INITIAL_COUNT = 8;

const CATEGORY_SUBTITLES: Record<string, string> = {
  microcontrollers: 'ESP32, Arduino & Raspberry Pi boards',
  esp32: 'ESP32, Arduino & Raspberry Pi boards',
  sensors: 'Ultrasonic, 360° LiDAR & IMU sensors',
  lidar: 'Ultrasonic, 360° LiDAR & IMU sensors',
  motors: 'Stepper, servo, DC motors & drivers',
  servo: 'Stepper, servo, DC motors & drivers',
  'robotics-kits': 'Robotic arms, chassis & assembly kits',
  arm: 'Robotic arms, chassis & assembly kits',
  power: 'LiPo batteries, BMS & buck regulators',
  lipo: 'LiPo batteries, BMS & buck regulators',
  displays: 'TFT touchscreens & OLED displays',
  oled: 'TFT touchscreens & OLED displays',
  wireless: 'LoRa telemetry, USB & jumper cables',
  lora: 'LoRa telemetry, USB & jumper cables',
  tools: 'Soldering irons, multimeters & testers',
  soldering: 'Soldering irons, multimeters & testers',
};

function resolveCategoryPhoto(category: CategoryItem): string | null {
  const custom = category.imageUrl?.trim();
  if (custom && !isWatermarkedUrl(custom)) {
    return custom;
  }
  if (CATEGORY_STUDIO_MEDIA[category.id]) {
    return CATEGORY_STUDIO_MEDIA[category.id];
  }
  if (category.artwork && category.artwork !== 'none' && CATEGORY_STUDIO_MEDIA[category.artwork]) {
    return CATEGORY_STUDIO_MEDIA[category.artwork];
  }
  return null;
}

function resolveCategorySubtitle(category: CategoryItem): string {
  return (
    CATEGORY_SUBTITLES[category.id] ||
    CATEGORY_SUBTITLES[category.artwork] ||
    'Bench-tested robotics & electronics hardware'
  );
}

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  categories,
  products,
  activeCategory,
  onSelectCategory,
}) => {
  const visibleCategories = useMemo(
    () => categories.filter((c) => c.active !== false),
    [categories]
  );
  const [showAll, setShowAll] = useState(false);
  const [brokenIds, setBrokenIds] = useState<Record<string, boolean>>({});

  const liveCounts = useMemo(() => {
    if (!products || products.length === 0) return null;
    const map: Record<string, number> = {};
    for (const p of products) {
      map[p.category] = (map[p.category] || 0) + 1;
    }
    return map;
  }, [products]);

  const mobileRemaining = Math.max(0, visibleCategories.length - MOBILE_INITIAL_COUNT);
  const desktopRemaining = Math.max(0, visibleCategories.length - DESKTOP_INITIAL_COUNT);

  useEffect(() => {
    if (
      activeCategory !== 'all' &&
      visibleCategories.slice(MOBILE_INITIAL_COUNT).some((c) => c.id === activeCategory)
    ) {
      setShowAll(true);
    }
  }, [activeCategory, visibleCategories]);

  return (
    <section
      id="categories"
      className="scroll-mt-[108px] bg-[#F3F7FC] min-[1500px]:bg-transparent min-[1500px]:pointer-events-none"
    >
      <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto bg-gradient-to-b from-[#F5F8FC] via-[#F3F7FC] to-[#F5F8FC] min-[1500px]:border-x min-[1500px]:border-slate-200/90 px-4 sm:px-6 lg:px-10 py-9 sm:py-12">
        <Reveal>
          {/* Editorial Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 mb-1.5">
                <span className="h-[2px] w-5 bg-[#087BFF]" aria-hidden="true" />
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#087BFF]">
                  EXPLORE OUR HARDWARE
                </p>
              </div>
              <h2 className="font-hero text-2xl sm:text-[32px] font-extrabold text-[#071A3D] tracking-[-0.025em] leading-[1.14]">
                Shop by Category
              </h2>
              <p className="mt-1.5 text-sm text-[#475569] leading-relaxed">
                Everything you need to build, prototype and bring your engineering ideas to life.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className="group self-start sm:self-auto inline-flex items-center gap-2 text-xs sm:text-[13px] font-bold tracking-[0.05em] uppercase text-[#071A3D] hover:text-[#087BFF] transition-colors py-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] rounded-lg"
            >
              <span>View All Categories</span>
              <ArrowRight className="w-4 h-4 text-[#087BFF] transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Balanced 4-Column Architectural Category Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {visibleCategories.map((category, idx) => {
              const isSelected = activeCategory === category.id;
              const isFeaturedDept = idx < 2;
              const resolvedPhoto = resolveCategoryPhoto(category);
              const imgSrc = brokenIds[category.id] ? null : resolvedPhoto;
              const subtitle = resolveCategorySubtitle(category);

              const productCountText =
                liveCounts !== null
                  ? `${liveCounts[category.id] ?? 0} ${
                      (liveCounts[category.id] ?? 0) === 1 ? 'Product' : 'Products'
                    }`
                  : category.countLabel;

              let visibilityClass = 'flex';
              if (!showAll) {
                if (idx >= DESKTOP_INITIAL_COUNT) {
                  visibilityClass = 'hidden';
                } else if (idx >= MOBILE_INITIAL_COUNT) {
                  visibilityClass = 'hidden md:flex';
                }
              }

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onSelectCategory(isSelected ? 'all' : category.id);
                  }}
                  style={{ animationDelay: `${Math.min(idx * 35, 220)}ms` }}
                  className={`animate-cart-enter group h-full flex-col text-left overflow-hidden rounded-2xl border active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F3F7FC] ${visibilityClass} ${
                    isSelected
                      ? 'bg-[#071A3D] border-[#087BFF] text-white shadow-[0_14px_30px_-12px_rgba(8,123,255,0.32)] -translate-y-0.5'
                      : isFeaturedDept
                      ? 'bg-white border-slate-200/95 hover:border-[#087BFF] text-[#071A3D] shadow-[0_6px_20px_-10px_rgba(8,123,255,0.14)] hover:shadow-[0_16px_32px_-12px_rgba(8,123,255,0.20)] hover:-translate-y-1'
                      : 'bg-white border-slate-200/90 hover:border-[#087BFF] text-[#071A3D] shadow-[0_4px_16px_-8px_rgba(7,26,61,0.08)] hover:shadow-[0_16px_32px_-12px_rgba(8,123,255,0.18)] hover:-translate-y-1'
                  }`}
                >
                  {/* Uniform Studio Image Frame */}
                  <div className="card-shine relative w-full aspect-[4/3] bg-[#F7FAFE] overflow-hidden border-b border-slate-100/90 shrink-0 flex items-center justify-center">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={category.name}
                        referrerPolicy="no-referrer"
                        loading={idx < 4 ? 'eager' : 'lazy'}
                        onError={() => {
                          if (!brokenIds[category.id]) {
                            setBrokenIds((prev) => ({ ...prev, [category.id]: true }));
                          }
                        }}
                        className="w-full h-full object-contain object-center block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400 px-3 text-center">
                        <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/90 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-slate-400" strokeWidth={1.6} />
                        </div>
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          {category.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Balanced Card Body */}
                  <div className="flex-1 p-3.5 sm:p-4.5 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`font-hero text-[13.5px] sm:text-[15.5px] font-bold leading-snug tracking-[-0.01em] line-clamp-2 transition-colors ${
                            isSelected ? 'text-white' : 'text-[#071A3D] group-hover:text-[#087BFF]'
                          }`}
                        >
                          {category.name}
                        </h3>
                      </div>
                      <p
                        className={`mt-1 text-[11.5px] sm:text-[12.5px] leading-relaxed line-clamp-2 ${
                          isSelected ? 'text-slate-300' : 'text-[#475569]'
                        }`}
                      >
                        {subtitle}
                      </p>
                    </div>

                    <div
                      className={`mt-3 pt-2.5 border-t flex items-center justify-between gap-2 ${
                        isSelected ? 'border-white/15' : 'border-slate-100'
                      }`}
                    >
                      <span
                        className={`font-mono text-[11px] font-semibold tabular-nums transition-colors ${
                          isSelected
                            ? 'text-[#00CFFF]'
                            : isFeaturedDept
                            ? 'text-[#087BFF]'
                            : 'text-[#475569] group-hover:text-[#087BFF]'
                        }`}
                      >
                        {productCountText}
                      </span>

                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ${
                          isSelected
                            ? 'bg-white/15 text-[#00CFFF]'
                            : 'bg-[#F3F7FC] text-[#071A3D] group-hover:bg-[#087BFF] group-hover:text-white'
                        }`}
                        aria-hidden="true"
                      >
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mobile & Overflow Expandable Control */}
          {(mobileRemaining > 0 || desktopRemaining > 0) && (
            <div
              className={`mt-6 justify-center ${
                desktopRemaining > 0 ? 'flex' : 'flex md:hidden'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setShowAll((prev) => !prev);
                }}
                aria-expanded={showAll}
                className="group inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-white hover:bg-[#071A3D] border border-slate-200 hover:border-[#071A3D] text-xs font-bold tracking-[0.04em] uppercase text-[#071A3D] hover:text-white active:scale-[0.97] shadow-[0_6px_18px_-8px_rgba(7,26,61,0.10)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087BFF]"
              >
                {showAll ? (
                  <span>Show Less Categories</span>
                ) : (
                  <>
                    <span className="md:hidden">View All Categories (+{mobileRemaining})</span>
                    {desktopRemaining > 0 && (
                      <span className="hidden md:inline">
                        View All Categories (+{desktopRemaining})
                      </span>
                    )}
                  </>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-[#087BFF] group-hover:text-[#00CFFF] transition-transform duration-200 ${
                    showAll ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
};
