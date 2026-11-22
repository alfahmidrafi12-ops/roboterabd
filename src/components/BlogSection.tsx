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
  'All Guides',
  'Robotics Engineering',
  'Power & Actuation',
  'Battery Systems',
] as const;

const FALLBACK_STUDIO_COVERS = [
  BRAND_STUDIO_MEDIA.edgeAiBoards,
  BRAND_STUDIO_MEDIA.lidarSensor,
  BRAND_STUDIO_MEDIA.roboticsArm,
];

export const BlogSection: React.FC<BlogSectionProps> = ({ blogImages }) => {
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('All Guides');

  const visiblePosts =
    selectedTopic === 'All Guides'
      ? BLOG_POSTS
      : BLOG_POSTS.filter((p) => p.category === selectedTopic);

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
    <section id="lab-guides" className="scroll-mt-20 bg-gradient-to-b from-[#F5F8FC] to-white min-[1500px]:bg-transparent min-[1500px]:pointer-events-none">
      <div className="relative z-20 pointer-events-auto w-full max-w-[1440px] mx-auto bg-gradient-to-b from-[#F5F8FC] to-white min-[1500px]:border-x min-[1500px]:border-slate-200/90 px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[#087BFF] mb-1.5">
                Technical Documentation &amp; Tutorials
              </p>
              <h2 className="font-hero text-2xl sm:text-3xl font-extrabold text-[#071A3D] tracking-tight">
                Engineering Knowledge Center
              </h2>
            </div>

            <div className="inline-flex flex-wrap items-center p-1 rounded-xl bg-white border border-slate-200/90 shadow-[0_2px_10px_rgba(7,26,61,0.04)]">
              {GUIDE_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                    selectedTopic === topic
                      ? 'bg-[#071A3D] text-white shadow-sm'
                      : 'text-[#475569] hover:text-[#071A3D] hover:bg-[#F3F7FC]'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className={`grid grid-cols-1 ${visiblePosts.length === 1 ? 'md:grid-cols-1 max-w-xl' : visiblePosts.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
          {visiblePosts.map((post) => {
            const origIndex = Math.max(0, BLOG_POSTS.findIndex((b) => b.id === post.id));
            const customImg = blogImages?.[post.id]?.trim();
            const fallbackCover = FALLBACK_STUDIO_COVERS[origIndex % FALLBACK_STUDIO_COVERS.length];
            const cardImageUrl = customImg || fallbackCover;

            return (
              <Reveal key={post.id} delayMs={origIndex * 65}>
                <article
                  onClick={() => setActivePost(post)}
                  className="group bg-white rounded-2xl border border-slate-200/85 overflow-hidden shadow-[0_8px_24px_-12px_rgba(7,26,61,0.08)] hover:border-[#087BFF]/65 hover:shadow-[0_20px_40px_-16px_rgba(8,123,255,0.16)] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
                >
                  <div className="bg-[#F3F7FC] aspect-[16/10] border-b border-slate-200/80 overflow-hidden">
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
                    <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
                      <span className="font-bold text-[#087BFF]">{post.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{post.date}</span>
                      <span aria-hidden="true">·</span>
                      <span>{post.readTime}</span>
                    </div>

                    <h3 className="font-hero text-lg font-bold text-[#071A3D] leading-snug group-hover:text-[#087BFF] transition-colors">
                      {post.title}
                    </h3>

                    <p className="mt-2.5 text-sm text-[#475569] leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>

                    <div className="mt-auto pt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#087BFF]">
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
            className="animate-fade-in fixed inset-0 bg-[#071A3D]/65 backdrop-blur-sm"
            onClick={() => setActivePost(null)}
            aria-hidden="true"
          />
          <div className="animate-pop-in relative z-10 w-full max-w-2xl max-h-[90dvh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-[#F5F8FC]">
              <div className="text-xs text-[#64748B] flex items-center gap-2">
                <span className="font-semibold text-[#087BFF]">{activePost.category}</span>
                <span aria-hidden="true">·</span>
                <span>{activePost.date}</span>
                <span aria-hidden="true">·</span>
                <span>{activePost.readTime}</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePost(null)}
                aria-label="Close guide modal"
                className="p-1.5 rounded-xl text-[#64748B] hover:text-[#071A3D] hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-5">
              <div className="bg-[#F3F7FC] rounded-2xl p-4 flex items-center justify-center overflow-hidden border border-slate-200/80">
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
              <h3 className="font-hero text-2xl font-extrabold text-[#071A3D] leading-tight">
                {activePost.title}
              </h3>
              <p className="text-xs font-medium text-[#64748B]">By {activePost.author}</p>
              <div className="space-y-4 text-sm sm:text-[15px] text-[#334155] leading-relaxed">
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
