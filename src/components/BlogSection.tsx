import React, { useEffect, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { BLOG_POSTS } from '../data/catalog';
import { BlogPost } from '../types/store';
import { HardwareArtwork } from './HardwareArtwork';

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
    <section id="lab-guides" className="scroll-mt-20 py-10 sm:py-12 lg:py-16 bg-[#F9FBFD] border-t border-slate-200/70">
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#06142E] tracking-tight">
            Our Recent Lab Guides
          </h2>
          <button
            type="button"
            onClick={() => setActivePost(BLOG_POSTS[0])}
            className="text-sm font-semibold text-[#0057E7] hover:text-[#0044BB] transition-colors whitespace-nowrap"
          >
            Read Featured Guide
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.id}
              onClick={() => setActivePost(post)}
              className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col"
            >
              <div className="bg-[#F4F7FB] aspect-[16/10] p-4 flex items-center justify-center border-b border-slate-100 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center transition-transform duration-200 group-hover:-translate-y-0.5">
                  <HardwareArtwork
                    kind={post.artwork}
                    imageUrl={blogImages?.[post.id]}
                    alt={post.title}
                    fit={blogImages?.[post.id] ? 'cover' : 'contain'}
                    className="w-full h-full max-w-[220px] max-h-[150px]"
                  />
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span>{post.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{post.date}</span>
                  <span aria-hidden="true">·</span>
                  <span>{post.readTime}</span>
                </div>

                <h3 className="font-display text-lg font-bold text-[#06142E] leading-snug group-hover:text-[#0057E7] transition-colors">
                  {post.title}
                </h3>

                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>

                <div className="mt-auto pt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#0057E7]">
                  <span>Read Technical Note</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Article Reader Modal */}
      {activePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#06142E]/60 backdrop-blur-sm"
            onClick={() => setActivePost(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-2xl max-h-[90dvh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
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
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-5">
              <div className="bg-[#F4F7FB] rounded-xl p-4 flex items-center justify-center overflow-hidden">
                <div className="w-full max-w-[300px] h-44 flex items-center justify-center">
                  <HardwareArtwork
                    kind={activePost.artwork}
                    imageUrl={blogImages?.[activePost.id]}
                    alt={activePost.title}
                    fit={blogImages?.[activePost.id] ? 'cover' : 'contain'}
                    className="w-full h-full"
                  />
                </div>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#06142E] leading-tight">
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
