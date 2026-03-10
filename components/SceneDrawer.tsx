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
  
  // 核心魔法：探测 URL 中是否携带着档案的坐标 (例如 ?scene=scene_cyberpunk_alley)
  const sceneId = searchParams.get("scene");

  const [scene, setScene] = useState<Scene | null>(null);
  const [loading, setLoading] = useState(false);

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

  // 关闭抽屉的魔法：直接回退历史记录，URL 参数会消失，抽屉自然滑出
  const closeDrawer = () => {
    router.back();
  };

  return (
    // AnimatePresence 允许元素在被卸载时播放退场动画
    <AnimatePresence>
      {sceneId && (
        <motion.div
          initial={{ x: "100%", opacity: 0.5 }} 
          animate={{ x: 0, opacity: 1 }}        
          exit={{ x: "100%", opacity: 0 }}      
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          /* ✨ 核心修复：将 z-[100] 提升至 z-[120]，形成终极叠层覆盖 ✨ */
          className="fixed inset-0 z-[120] bg-[#fcfcfd] overflow-y-auto text-[#1a1a24] font-serif pb-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {/* 极简网格背景 */}
          <div className="fixed inset-0 pointer-events-none z-0 opacity-40" style={{ backgroundImage: "radial-gradient(#e2e2e8 1px, transparent 1px)", backgroundSize: "40px 40px", backgroundPosition: "-19px -19px" }} />

          <div className="relative z-10 max-w-3xl mx-auto px-6 pt-16 md:pt-24">
            
            {/* 顶部导航：回溯键 */}
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