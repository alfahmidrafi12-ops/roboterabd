import React, { useEffect, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { BLOG_POSTS } from '../data/catalog';
import { BlogPost } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';
import { Reveal } from './Reveal';

interface BlogSectionProps {
  blogImages?: Record<string, string>;
}

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
    <section id="lab-guides" className="scroll-mt-20 py-10 sm:py-14 lg:py-16 bg-[#F7F9FC] border-t border-slate-200/80">
      <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10">
        <Reveal>
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-mono font-semibold text-[#0057E7] mb-1">
                Engineering Documentation
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#070D19] tracking-tight">
                Our Recent Lab Guides
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActivePost(BLOG_POSTS[0])}
              className="text-sm font-semibold text-[#0057E7] hover:text-[#070D19] transition-colors whitespace-nowrap"
            >
              Read Featured Guide
            </button>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BLOG_POSTS.map((post, index) => (
            <Reveal key={post.id} delayMs={index * 70}>
              <article
                onClick={() => setActivePost(post)}
                className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden hover:border-blue-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-18px_rgba(7,13,25,0.2)] transition-all duration-200 cursor-pointer flex flex-col h-full"
              >
                <div className="bg-[#F5F7FA] aspect-[16/10] p-3 sm:p-4 flex items-center justify-center border-b border-slate-100 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.04]">
                    <HardwareArtwork
                      kind={post.artwork}
                      imageUrl={blogImages?.[post.id]}
                      alt={post.title}
                      fit="contain"
                      className="w-full h-full"
                    />
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-[#0057E7]">{post.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.date}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.readTime}</span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-[#070D19] leading-snug group-hover:text-[#0057E7] transition-colors">
                    {post.title}
                  </h3>

                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="mt-auto pt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#0057E7]">
                    <span>Read Technical Note</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Article Reader Modal */}
      {activePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="animate-fade-in fixed inset-0 bg-[#070D19]/65 backdrop-blur-sm"
            onClick={() => setActivePost(null)}
            aria-hidden="true"
          />
          <div className="animate-pop-in relative z-10 w-full max-w-2xl max-h-[90dvh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="font-semibold text-[#0057E7]">{activePost.category}</span>
                <span aria-hidden="true">·</span>
                <span>{activePost.date}</span>
                <span aria-hidden="true">·</span>
                <span>{activePost.readTime}</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePost(null)}
                aria-label="Close guide modal"
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-5">
              <div className="bg-[#F5F7FA] rounded-2xl p-4 flex items-center justify-center overflow-hidden border border-slate-200/70">
                <div className="w-full max-w-[340px] h-48 flex items-center justify-center">
                  <HardwareArtwork
                    kind={activePost.artwork}
                    imageUrl={blogImages?.[activePost.id]}
                    alt={activePost.title}
                    fit="contain"
                    className="w-full h-full"
                  />
                </div>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#070D19] leading-tight">
                {activePost.title}
              </h3>
              <p className="text-xs font-medium text-slate-500">By {activePost.author}</p>
              <div className="space-y-4 text-sm sm:text-[15px] text-slate-700 leading-relaxed">
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
