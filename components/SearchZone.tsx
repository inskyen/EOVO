"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase"; // 确保护航您真实的 supabase 客户端路径
import SceneCard from "./SceneCard";

interface SearchZoneProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_TAGS = ["近未来", "东亚", "诡异", "史诗", "维度外", "中世纪", "赛博朋克"];

export default function SearchZone({ isOpen, onClose }: SearchZoneProps) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // 核心法器：捕获输入框的物理焦点
  const inputRef = useRef<HTMLInputElement>(null);

  // 结界降临瞬间：清空残影，自动聚焦
  useEffect(() => {
    if (isOpen) {
      setKeyword("");
      setResults([]);
      setHasSearched(false);
      // 给予渲染 100ms 的呼吸时间，然后瞬间夺取光标
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 核心魔法：300ms 防抖 (Debounce) 与星海直连
  useEffect(() => {
    if (!keyword.trim()) {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      // 老三样精确索敌：name, world, description
      const { data, error } = await supabase
        .from("scenes")
        .select("*")
        .or(`name.ilike.%${keyword}%,world.ilike.%${keyword}%,description.ilike.%${keyword}%`)
        .limit(50); // 截断虚空

      if (error) {
        console.error("真理之眼观测失败:", error);
        setResults([]);
      } else if (data) {
        // 字段映射法则：将数据库的底层标识转换为组件的表层坐标
        const mappedResults = data.map((row) => ({
          ...row,
          id: row.scene_id,
        }));
        setResults(mappedResults);
      }
      setIsSearching(false);
      setHasSearched(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          // 采用自上而下的神明视角降临
          initial={{ y: "-100%", opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          // 绝对图层覆盖 (z-[110]) 与隐形滚动条魔法
          className="fixed inset-0 z-[110] bg-[#fcfcfd] overflow-y-auto text-[#1a1a24] font-serif [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {/* 极简网格背景 */}
          <div className="fixed inset-0 pointer-events-none z-0 opacity-40" style={{ backgroundImage: "radial-gradient(#e2e2e8 1px, transparent 1px)", backgroundSize: "40px 40px", backgroundPosition: "-19px -19px" }} />

          <div className="relative z-10 max-w-4xl mx-auto px-6 pt-16 md:pt-24 pb-32">
            
            {/* 顶部：空间控制台与巨大的真理输入域 */}
            <div className="mb-12">
              <button
                onClick={onClose}
                className="inline-flex items-center text-[11px] text-[#8e8e9f] font-mono tracking-[0.2em] hover:text-[#4a3570] transition-colors group bg-transparent border-none cursor-pointer focus:outline-none mb-10"
              >
                <span className="mr-2 transform group-hover:-translate-x-1 transition-transform duration-300">←</span>
                CLOSE RADAR
              </button>

              <input
                ref={inputRef}
                type="text"
                id="eovo-global-search"  /* ✨ 补上这个名牌 */
                name="search"            /* ✨ 补上这个名牌 */
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="输入坐标特征或世界观..."
                className="w-full bg-transparent border-b border-[#e2e2e8] focus:border-[#4a3570] text-3xl md:text-5xl font-light text-[#1a1a24] placeholder-[#e2e2e8] pb-6 focus:outline-none transition-colors duration-500 caret-[#4a3570]"
              />
            </div>

            {/* 中庭：观测结果倒影 */}
            <div className="min-h-[50vh]">
              {!keyword.trim() ? (
                /* 状态一：虚空静默，热门引路 */
                <div className="animate-in fade-in duration-700">
                  <div className="font-mono text-[10px] tracking-[0.3em] text-[#8e8e9f] mb-6 uppercase">
                    Frequent Coordinates
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {POPULAR_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setKeyword(tag)}
                        className="text-[11px] px-4 py-2 bg-[#fcfcfd] border border-[#e2e2e8] text-[#8e8e9f] font-mono tracking-widest hover:border-[#4a3570] hover:text-[#4a3570] hover:bg-[#4a3570]/5 transition-all duration-400 cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : isSearching ? (
                /* 状态二：超光速检索中 */
                <div className="flex justify-center py-24 font-mono text-[11px] tracking-[0.3em] text-[#4a3570] animate-pulse">
                  SCANNING DIMENSIONS...
                </div>
              ) : hasSearched && results.length === 0 ? (
                /* 状态三：最终判决（佚失） */
                <div className="flex justify-center py-32 font-mono text-[12px] tracking-[0.4em] text-[#8e8e9f]">
                  虚空中没有匹配的坐标
                </div>
              ) : (
                /* 状态四：坐标具象化 */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-bottom-4 fade-in duration-700">
                  {results.map((scene, index) => (
                    // ✨ 核心修复：删掉这里的 onClick={onClose}，让搜索抽屉乖乖待在原地
                    <div key={`${scene.id}-${index}`}> 
                      <SceneCard
                        id={scene.id}
                        name={scene.name}
                        world={scene.world}
                        description={scene.description}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}