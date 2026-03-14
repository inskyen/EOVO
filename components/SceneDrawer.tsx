"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from '@/lib/supabase'

// --- 类型定义 ---
type Episode = { title: string; opening: string; };
type Scene = {
  id: string | number;
  name: string;
  world: string;
  description: string;
  characters: string[];
  tags: string[];
  coords: Record<string, string>;
  episodes: Episode[];
};

export default function SceneDrawer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const sceneId = searchParams.get("scene");

  const [scene, setScene] = useState<Scene | null>(null);
  const [loading, setLoading] = useState(false);

  // 👇 ✨ 拓印魔法的状态灯
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);

  useEffect(() => {
    if (sceneId) {
      setLoading(true);
      supabase
        .from('scenes')
        .select('*')
        .eq('scene_id', sceneId)
        .single()
        .then(({ data, error }) => {
          if (error || !data) { setScene(null); setLoading(false); return; }
          setScene({
            id: data.scene_id,
            name: data.name,
            world: data.world,
            description: data.description,
            characters: data.characters,
            tags: data.tags,
            coords: data.coords,
            episodes: data.episodes,
          });
          setLoading(false);
        });
    } else {
      setTimeout(() => setScene(null), 300);
    }
  }, [sceneId]);

  const closeDrawer = () => {
    router.back();
  };

  // 🔮 拓印法术 1：复制绝对坐标 (URL 链接)
  const handleCopyLink = () => {
    if (!scene) return;
    const url = `${window.location.origin}/scene/${scene.id}`; 
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000); 
    });
  };

  // 🔮 拓印法术 2：复制灵魂内容 (纯文本排版)
  const handleCopyContent = () => {
    if (!scene) return;
    
    let content = `「 ${scene.name} 」\n— ${scene.world} —\n\n${scene.description}\n`;
    
    if (scene.coords) {
      content += `\n[坐标]: ${Object.values(scene.coords).join(" · ")}`;
    }
    if (scene.episodes && scene.episodes.length > 0) {
      content += `\n\n[事件记录]:\n`;
      scene.episodes.forEach((ep, idx) => {
        content += `- Ep.${String(idx + 1).padStart(2, '0')} ${ep.title}\n  ${ep.opening}\n`;
      });
    }

    navigator.clipboard.writeText(content).then(() => {
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    });
  };

  return (
    <AnimatePresence>
      {sceneId && (
        <motion.div
          initial={{ x: "100%", opacity: 0.5 }} 
          animate={{ x: 0, opacity: 1 }}        
          exit={{ x: "100%", opacity: 0 }}      
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[120] bg-[#fcfcfd] overflow-y-auto text-[#1a1a24] font-serif pb-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <div className="fixed inset-0 pointer-events-none z-0 opacity-40" style={{ backgroundImage: "radial-gradient(#e2e2e8 1px, transparent 1px)", backgroundSize: "40px 40px", backgroundPosition: "-19px -19px" }} />

          <div className="relative z-10 max-w-3xl mx-auto px-6 pt-16 md:pt-24">
            
            <div className="mb-16">
              <button 
                onClick={closeDrawer} 
                className="inline-flex items-center text-[11px] text-[#8e8e9f] font-mono tracking-[0.2em] hover:text-[#4a3570] transition-colors group bg-transparent border-none cursor-pointer focus:outline-none"
              >
                <span className="mr-2 transform group-hover:-translate-x-1 transition-transform duration-300">←</span>
                CLOSE DIMENSION
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20 font-mono text-[11px] tracking-[0.3em] text-[#4a3570] animate-pulse">
                INITIALIZING...
              </div>
            ) : scene ? (
              <>
                {/* 核心信息区 */}
                <header className="mb-16">
                  <div className="font-mono text-[12px] tracking-[0.4em] text-[#8e8e9f] mb-4 uppercase">{scene.world}</div>
                  <h1 className="text-3xl md:text-4xl font-semibold text-[#1a1a24] leading-tight mb-8">{scene.name}</h1>
                  <div className="text-[14px] md:text-[15px] text-[#5a5a7a] leading-[2] tracking-wide text-justify">{scene.description}</div>
                </header>

                {/* 坐标与标签面板 */}
                {(scene.coords || scene.tags) && (
                  <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 py-8 border-y border-[#e2e2e8] mb-16">
                    {scene.coords && (
                      <div className="flex-1">
                        <div className="font-mono text-[10px] tracking-[0.3em] text-[#8e8e9f] mb-4 uppercase">Coordinates</div>
                        <div className="text-[12px] text-[#4a3570] font-semibold leading-relaxed">{Object.values(scene.coords).join(" · ")}</div>
                      </div>
                    )}
                    {scene.tags && (
                      <div className="flex-1">
                        <div className="font-mono text-[10px] tracking-[0.3em] text-[#8e8e9f] mb-4 uppercase">Tags</div>
                        <div className="flex flex-wrap gap-2">
                          {scene.tags.map(tag => <span key={tag} className="text-[10px] px-2 py-1 bg-white border border-[#e2e2e8] text-[#8e8e9f] font-mono tracking-wider">{tag}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 剧本推演区 (Episodes) */}
                {scene.episodes && scene.episodes.length > 0 && (
                  <section>
                    <h2 className="flex items-center text-[13px] font-mono tracking-[0.3em] text-[#8e8e9f] uppercase mb-10">
                      <span className="w-4 h-[1px] bg-[#4a3570] mr-4 opacity-50"></span>
                      Event Timeline
                    </h2>
                    <div className="space-y-8">
                      {scene.episodes.map((ep, idx) => (
                        <div key={idx} className="group relative pl-6 border-l-[2px] border-[#e2e2e8] hover:border-[#4a3570] transition-colors duration-500">
                          <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-[#4a3570] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <h3 className="text-[15px] font-semibold text-[#1a1a24] mb-3 group-hover:text-[#4a3570] transition-colors duration-300">
                            <span className="font-mono text-[#8e8e9f] text-[10px] mr-3 tracking-widest uppercase">Ep.{String(idx + 1).padStart(2, '0')}</span>
                            {ep.title}
                          </h3>
                          <p className="text-[13px] text-[#5a5a7a] leading-[1.8] text-justify">{ep.opening}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 👇 ✨ 极其优雅的底部封缄：拓印与分享 ✨ 👇 */}
                <div className="mt-20 pt-10 border-t border-[#e2e2e8] flex flex-wrap items-center gap-4">
                  <button 
                    onClick={handleCopyContent}
                    className="flex items-center justify-center px-5 py-3 bg-white border border-[#e2e2e8] text-[#5a5a7a] text-[12px] font-mono tracking-widest uppercase hover:border-[#4a3570] hover:text-[#4a3570] transition-all duration-300 focus:outline-none w-full sm:w-auto"
                  >
                    {copiedContent ? (
                      <span className="flex items-center text-[#4a3570]"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>COPIED</span>
                    ) : (
                      <span className="flex items-center"><svg className="w-4 h-4 mr-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>COPY TEXT</span>
                    )}
                  </button>

                  <button 
                    onClick={handleCopyLink}
                    className="flex items-center justify-center px-5 py-3 bg-[#fcfcfd] border border-[#e2e2e8] text-[#8e8e9f] text-[12px] font-mono tracking-widest uppercase hover:bg-[#4a3570]/5 hover:text-[#4a3570] hover:border-[#4a3570]/30 transition-all duration-300 focus:outline-none w-full sm:w-auto"
                  >
                    {copiedLink ? (
                      <span className="flex items-center text-[#4a3570]"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>LINK COPIED</span>
                    ) : (
                      <span className="flex items-center"><svg className="w-4 h-4 mr-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>COPY LINK</span>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-[#8e8e9f]">坐标佚失</div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}