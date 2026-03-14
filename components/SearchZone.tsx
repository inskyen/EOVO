"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase"; 
import SceneCard from "./SceneCard";

interface SearchZoneProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_TAGS = ["近未来", "东亚", "诡异", "史诗", "维度外", "中世纪", "赛博朋克"];

// 👇 ✨ 真·懒加载核心引擎轴
const PAGE_SIZE = 5;

export default function SearchZone({ isOpen, onClose }: SearchZoneProps) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // ✨ 分离两种加载状态：一个是打字时的全局重构，一个是触底时的局部探查
  const [isSearching, setIsSearching] = useState(false); 
  const [isLoadingMore, setIsLoadingMore] = useState(false); 
  
  // ✨ 物理翻页状态
  const [page, setPage] = useState(0); 
  const [hasMore, setHasMore] = useState(true); 
  
  const inputRef = useRef<HTMLInputElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // 结界降临/关闭瞬间：清空残影，自动聚焦
  useEffect(() => {
    if (isOpen) {
      setKeyword("");
      setResults([]);
      setHasSearched(false);
      setPage(0);
      setHasMore(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 🚀 真·搜索打捞法术：极其纯粹的 SQL 映射
  const fetchSearchResults = useCallback(async (currentPage: number, searchWord: string, isReset = false) => {
    if (!searchWord.trim()) return;

    if (isReset) {
      setIsSearching(true); // 如果是新词，显示中心的大雷达
    } else {
      setIsLoadingMore(true); // 如果是翻页，显示底部的小雷达
    }

    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("scenes")
      .select("*")
      .or(`name.ilike.%${searchWord}%,world.ilike.%${searchWord}%,description.ilike.%${searchWord}%`)
      .range(from, to); // ✨ 极其精准的切片索要

    if (!error && data) {
      const mappedResults = data.map((row) => ({
        ...row,
        id: row.scene_id,
      }));

      // 如果是换了关键词，推翻重来；如果是滚动翻页，追加在后
      setResults((prev) => isReset ? mappedResults : [...prev, ...mappedResults]);
      setHasMore(data.length === PAGE_SIZE);
    } else {
      console.error("真理之眼观测失败:", error);
      if (isReset) setResults([]);
      setHasMore(false);
    }

    setIsSearching(false);
    setIsLoadingMore(false);
    setHasSearched(true);
  }, []);

  // ✨ 魔法阵一：300ms 防抖星海直连 (只要修改了关键词，立刻重置一切并去搜第一页)
  useEffect(() => {
    if (!keyword.trim()) {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      setPage(0);
      return;
    }

    const timer = setTimeout(() => {
      setPage(0); // 页码归零
      fetchSearchResults(0, keyword, true); // 强制开启新篇章
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, fetchSearchResults]);

  // ✨ 魔法阵二：触底雷达 (滑到底部时，页码加一，索要下一批)
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isSearching) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchSearchResults(nextPage, keyword, false);
      }
    }, { threshold: 0.1 });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isSearching, page, keyword, fetchSearchResults]);

  // 👇 ✨ 终极护盾：把容易善变的 onClose 锁进盒子里，绝不让它干扰雷达！
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // ✨ 终极物理防御：极其纯粹的幻影锚点，绝对不干扰 Next.js 的路由树
  useEffect(() => {
    if (isOpen) {
      // 1. 展开时，悄悄在脚下垫一块砖（写入一个隐形状态），绝不改变网址
      window.history.pushState({ eovoSearchModal: true }, '');

      const handlePopState = (e: PopStateEvent) => {
        // 2. 极其聪明的敌我识别：如果退回来发现脚下这块砖没了，说明小天要彻底退出搜索了！
        if (!e.state || !e.state.eovoSearchModal) {
          onCloseRef.current(); // 用盒子里的钥匙关门
        }
      };

      // 监听时间回溯 (安卓手势返回必然触发)
      window.addEventListener('popstate', handlePopState);

      // 3. 清理结界
      return () => {
        window.removeEventListener('popstate', handlePopState);
        // 如果是小天主动点 CLOSE RADAR 关门的，我们负责把刚才垫的砖抽走，绝不留痕！
        if (window.history.state?.eovoSearchModal) {
          window.history.back();
        }
      };
    }
  }, [isOpen]); // ✨ 极其关键：依赖项里只有 isOpen，雷达极其稳定，绝不重复触发！

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "-100%", opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
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
                id="eovo-global-search"  
                name="search"            
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
                /* 状态二：超光速检索中 (只在打字换新词的第一页出现) */
                <div className="flex justify-center py-24 font-mono text-[11px] tracking-[0.3em] text-[#4a3570] animate-pulse">
                  SCANNING DIMENSIONS...
                </div>
              ) : hasSearched && results.length === 0 ? (
                /* 状态三：最终判决（佚失） */
                <div className="flex justify-center py-32 font-mono text-[12px] tracking-[0.4em] text-[#8e8e9f]">
                  虚空中没有匹配的坐标
                </div>
              ) : (
                /* 状态四：坐标具象化 (渲染真实的数据库切片) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-bottom-4 fade-in duration-700">
                  {results.map((scene, index) => (
                    <div key={`${scene.id}-${index}`}> 
                      <SceneCard
                        id={scene.id}
                        name={scene.name}
                        world={scene.world}
                        description={scene.description}
                      />
                    </div>
                  ))}

                  {/* 👇 ✨ 真·加载探测器与底部分界线 ✨ 👇 */}
                  <div ref={loaderRef} className="col-span-1 md:col-span-2 py-8 flex justify-center items-center">
                    {isLoadingMore ? (
                      <span className="text-[#4a3570] text-[11px] tracking-[0.3em] uppercase animate-pulse">正在深入探查...</span>
                    ) : !hasMore && results.length > 0 ? (
                      <span className="text-gray-300 text-[11px] tracking-[0.3em] uppercase">— 检索抵达边界 —</span>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}