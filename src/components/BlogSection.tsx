import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, X } from 'lucide-react';
import { BRAND_STUDIO_MEDIA } from '../data/brandMedia';
import { BLOG_POSTS } from '../data/catalog';
import { BlogPost } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';
import { Reveal } from './Reveal';

interface BlogSectionProps {
  blogImages?: Record<string, string>;
}

const GUIDE_TOPICS = [
  'Arduino Tutorials',
  'ESP32 Guides',
  'Raspberry Pi',
  'Robotics Projects',
  'Sensor Calibration',
];

const FALLBACK_STUDIO_COVERS = [
  BRAND_STUDIO_MEDIA.edgeAiBoards,
  BRAND_STUDIO_MEDIA.lidarSensor,
  BRAND_STUDIO_MEDIA.roboticsArm,
];

export const BlogSection: React.FC<BlogSectionProps> = ({ blogImages }) => {
  const [activePost, setActivePost] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (!activePost) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePost(null);
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [activePost]);

  return (
    <section id="lab-guides" className="scroll-mt-20 bg-[#E6ECF4] min-[1500px]:bg-transparent min-[1500px]:pointer-events-none">
      <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto bg-[#E6ECF4] min-[1500px]:border-x min-[1500px]:border-slate-300/90 px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-[#0F766E] mb-1">
                Technical Documentation &amp; Tutorials
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#071A3B] tracking-tight">
                Engineering Knowledge Center
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono font-medium text-[#334155]">
              {GUIDE_TOPICS.map((topic, idx) => (
                <React.Fragment key={topic}>
                  {idx > 0 && (
                    <span aria-hidden="true" className="text-slate-400">
                      ·
                    </span>
                  )}
                  <span className="hover:text-[#0866F5] transition-colors">{topic}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BLOG_POSTS.map((post, index) => {
            const customImg = blogImages?.[post.id]?.trim();
            const fallbackCover = FALLBACK_STUDIO_COVERS[index % FALLBACK_STUDIO_COVERS.length];
            const cardImageUrl = customImg || fallbackCover;

            return (
              <Reveal key={post.id} delayMs={index * 65}>
                <article
                  onClick={() => setActivePost(post)}
                  className="group bg-white rounded-2xl border border-slate-300/85 overflow-hidden hover:border-[#0866F5] transition-colors duration-200 cursor-pointer flex flex-col h-full"
                >
                  <div className="bg-[#EDF2F8] aspect-[16/10] border-b border-slate-200 overflow-hidden">
                    {customImg ? (
                      <div className="w-full h-full p-3 flex items-center justify-center">
                        <HardwareArtwork
                          kind={post.artwork}
                          imageUrl={customImg}
                          alt={post.title}
                          fit="contain"
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <img
                        src={cardImageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    )}
                  </div>

                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-xs text-[#475569] mb-2">
                      <span className="font-bold text-[#0F766E]">{post.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{post.date}</span>
                      <span aria-hidden="true">·</span>
                      <span>{post.readTime}</span>
                    </div>

                    <h3 className="font-display text-lg font-bold text-[#071A3B] leading-snug group-hover:text-[#0866F5] transition-colors">
                      {post.title}
                    </h3>

                    <p className="mt-2.5 text-sm text-[#334155] leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>

                    <div className="mt-auto pt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#0866F5]">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read Technical Guide</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Article Reader Modal */}
      {activePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="animate-fade-in fixed inset-0 bg-[#071A3B]/65 backdrop-blur-sm"
            onClick={() => setActivePost(null)}
            aria-hidden="true"
          />
          <div className="animate-pop-in relative z-10 w-full max-w-2xl max-h-[90dvh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-[#F8FAFC]">
              <div className="text-xs text-[#64748B] flex items-center gap-2">
                <span className="font-semibold text-[#0D9488]">{activePost.category}</span>
                <span aria-hidden="true">·</span>
                <span>{activePost.date}</span>
                <span aria-hidden="true">·</span>
                <span>{activePost.readTime}</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePost(null)}
                aria-label="Close guide modal"
                className="p-1.5 rounded-xl text-[#64748B] hover:text-[#101828] hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-5">
              <div className="bg-[#F8FAFC] rounded-2xl p-4 flex items-center justify-center overflow-hidden border border-slate-200/80">
                <div className="w-full max-w-[360px] h-48 flex items-center justify-center">
                  <HardwareArtwork
                    kind={activePost.artwork}
                    imageUrl={blogImages?.[activePost.id]}
                    alt={activePost.title}
                    fit="contain"
                    className="w-full h-full"
                  />
                </div>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#071A3B] leading-tight">
                {activePost.title}
              </h3>
              <p className="text-xs font-medium text-[#64748B]">By {activePost.author}</p>
              <div className="space-y-4 text-sm sm:text-[15px] text-[#101828] leading-relaxed">
                {activePost.content.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
