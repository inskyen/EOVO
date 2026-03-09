"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

// --- 类型定义 ---
type Episode = {
  title: string;
  opening: string;
};

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

export default function SceneDetail({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15 规范：params 现在是一个 Promise，需要用 React.use() 解包
  const resolvedParams = use(params);
  // ✨ 召唤时光机
  const router = useRouter();
  
  const [scene, setScene] = useState<Scene | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 降临现实：从咱们的档案库中检索对应的碎片
    fetch("/data/scenes.json")
      .then((res) => res.json())
      .then((data: Scene[]) => {
        const foundScene = data.find((s) => String(s.id) === resolvedParams.id);
        setScene(foundScene || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("记忆读取失败:", err);
        setLoading(false);
      });
  }, [resolvedParams.id]);

  // 加载态
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center">
        <div className="font-mono text-[11px] tracking-[0.3em] text-[#4a3570] animate-pulse">
          INITIALIZING DIMENSION...
        </div>
      </div>
    );
  }

  // 空态：未能找到对应档案
  if (!scene) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] flex flex-col items-center justify-center text-[#8e8e9f]">
        <div className="text-3xl mb-4 opacity-30">⚲</div>
        <div className="font-mono text-[12px] tracking-[0.2em] mb-6">坐标佚失 · 档案不存在</div>
          <button 
            onClick={() => router.back()} // ✨ 核心魔法：原路返回
            className="inline-flex items-center text-[11px] text-[#8e8e9f] font-mono tracking-[0.2em] hover:text-[#4a3570] transition-colors group bg-transparent border-none cursor-pointer focus:outline-none"
          >
            <span className="mr-2 transform group-hover:-translate-x-1 transition-transform duration-300">←</span>
            返回中枢
          </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-[#1a1a24] font-serif pb-32">
      {/* 极简网格背景 */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(#e2e2e8 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          backgroundPosition: "-19px -19px"
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-16 md:pt-24">
        
        {/* 顶部导航：时光回溯键 */}
        <div className="mb-16">
          <button 
            onClick={() => router.back()} // ✨ 核心魔法：原路返回
            className="inline-flex items-center text-[11px] text-[#8e8e9f] font-mono tracking-[0.2em] hover:text-[#4a3570] transition-colors group bg-transparent border-none cursor-pointer focus:outline-none"
          >
            <span className="mr-2 transform group-hover:-translate-x-1 transition-transform duration-300">←</span>
            RETURN TO ORIGIN
          </button>
        </div>

        {/* 核心信息区 */}
        <header className="mb-16">
          <div className="font-mono text-[12px] tracking-[0.4em] text-[#8e8e9f] mb-4 uppercase">
            {scene.world}
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-[#1a1a24] leading-tight mb-8">
            {scene.name}
          </h1>
          
          <div className="text-[14px] md:text-[15px] text-[#5a5a7a] leading-[2] tracking-wide text-justify">
            {scene.description}
          </div>
        </header>

        {/* 坐标与标签面板 */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 py-8 border-y border-[#e2e2e8] mb-16">
          <div className="flex-1">
            <div className="font-mono text-[10px] tracking-[0.3em] text-[#8e8e9f] mb-4 uppercase">Coordinates</div>
            <div className="text-[12px] text-[#4a3570] font-semibold leading-relaxed">
              {Object.values(scene.coords).join(" · ")}
            </div>
          </div>
          <div className="flex-1">
            <div className="font-mono text-[10px] tracking-[0.3em] text-[#8e8e9f] mb-4 uppercase">Tags</div>
            <div className="flex flex-wrap gap-2">
              {scene.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-1 bg-white border border-[#e2e2e8] text-[#8e8e9f] font-mono tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 登场角色区 */}
        {scene.characters && scene.characters.length > 0 && (
          <section className="mb-20">
            <h2 className="flex items-center text-[13px] font-mono tracking-[0.3em] text-[#8e8e9f] uppercase mb-8">
              <span className="w-4 h-[1px] bg-[#4a3570] mr-4 opacity-50"></span>
              Entities in Scene
            </h2>
            <div className="flex flex-wrap gap-3 md:gap-4">
              {scene.characters.map((char, idx) => (
                <div 
                  key={idx}
                  className="px-4 py-2 bg-white border border-[#e2e2e8] text-[13px] text-[#1a1a24] hover:border-[#4a3570]/40 hover:text-[#4a3570] hover:shadow-[0_4px_12px_rgba(74,53,112,0.05)] transition-all duration-300 cursor-default"
                >
                  {char}
                </div>
              ))}
            </div>
          </section>
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
                <div 
                  key={idx}
                  className="group relative pl-6 border-l-[2px] border-[#e2e2e8] hover:border-[#4a3570] transition-colors duration-500"
                >
                  {/* 悬浮时的左侧小光标 */}
                  <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-[#4a3570] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <h3 className="text-[15px] font-semibold text-[#1a1a24] mb-3 group-hover:text-[#4a3570] transition-colors duration-300">
                    <span className="font-mono text-[#8e8e9f] text-[10px] mr-3 tracking-widest uppercase">Ep.{String(idx + 1).padStart(2, '0')}</span>
                    {ep.title}
                  </h3>
                  <p className="text-[13px] text-[#5a5a7a] leading-[1.8] text-justify">
                    {ep.opening}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}