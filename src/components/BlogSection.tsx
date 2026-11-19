import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, X } from 'lucide-react';
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
    <section id="lab-guides" className="scroll-mt-20 py-12 sm:py-16 bg-[#F1F5F9]">
      <div className="w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10">
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#0D9488] mb-1 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" aria-hidden="true" />
                <span>Technical Documentation &amp; Tutorials</span>
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#071A3B] tracking-tight">
                Engineering Knowledge Center
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {GUIDE_TOPICS.map((topic, idx) => {
                const chipTones = [
                  'text-[#0866F5] border-blue-200/80 bg-white',
                  'text-[#0D9488] border-teal-200/80 bg-white',
                  'text-[#071A3B] border-slate-200/90 bg-white',
                  'text-[#EA580C] border-orange-200/80 bg-white',
                  'text-[#0D9488] border-teal-200/80 bg-white',
                ];
                return (
                  <span
                    key={topic}
                    className={`text-[11px] font-mono font-medium border px-2.5 py-1 rounded-lg ${chipTones[idx % chipTones.length]}`}
                  >
                    {topic}
                  </span>
                );
              })}
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BLOG_POSTS.map((post, index) => (
            <Reveal key={post.id} delayMs={index * 70}>
              <article
                onClick={() => setActivePost(post)}
                className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden hover:border-[#0866F5]/60 hover:bg-[#0866F5]/[0.015] transition-colors duration-200 cursor-pointer flex flex-col h-full"
              >
                <div className="bg-[#F8FAFC] aspect-[16/10] p-4 flex items-center justify-center border-b border-slate-100 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <HardwareArtwork
                      kind={post.artwork}
                      imageUrl={blogImages?.[post.id]}
                      alt={post.title}
                      fit="contain"
                      className="w-full h-full"
                    />
                  </div>
                </div>

                <div className="p-5 sm:p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
                    <span className="font-semibold text-[#0891B2]">{post.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.date}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.readTime}</span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-[#071A3B] leading-snug group-hover:text-[#0866F5] transition-colors">
                    {post.title}
                  </h3>

                  <p className="mt-2.5 text-sm text-[#64748B] leading-relaxed line-clamp-3">
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
          ))}
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
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-[#F5F8FC]">
              <div className="text-xs text-[#64748B] flex items-center gap-2">
                <span className="font-semibold text-[#0866F5]">{activePost.category}</span>
                <span aria-hidden="true">·</span>
                <span>{activePost.date}</span>
                <span aria-hidden="true">·</span>
                <span>{activePost.readTime}</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePost(null)}
                aria-label="Close guide modal"
                className="p-1.5 rounded-xl text-[#64748B] hover:text-[#101828] hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-5">
              <div className="bg-[#F5F8FC] rounded-2xl p-4 flex items-center justify-center overflow-hidden border border-slate-200/70">
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
