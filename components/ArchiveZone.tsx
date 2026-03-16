"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase } from '@/lib/supabase'

// --- 类型定义 ---
type Coordinates = { time: string | null; space: string | null; civ: string | null; tone: string | null; };
type Episode = { title: string; opening: string; };
type Scene = {
  id: string | number;
  name: string;
  world: string;
  description: string;
  characters: string[];
  tags: string[];
  coords: Record<string, string>;
  moments: Episode[];
};

const AXES = [
  { id: "time", label: "AXIS-T", name: "时间轴", ticks: ["神话时代", "洪荒", "上古", "先秦", "汉唐", "中世纪", "工业革命", "19世纪", "20世纪初", "二战", "冷战", "1980s", "1990s", "2000s", "2010s", "现代", "近未来", "2050s", "2100s", "星际时代", "热寂前", "时间线外", "永恒"] },
  { id: "space", label: "AXIS-S", name: "空间轴", ticks: ["地底", "深海", "村落", "城镇", "都市", "荒野", "战场", "异域", "异星", "轨道站", "星际", "虚空", "次元裂缝", "梦境", "神国", "冥界", "镜中世界", "维度外", "概念空间"] },
  { id: "civ", label: "AXIS-C", name: "文明轴", ticks: ["东亚", "东南亚", "南亚", "中东", "北非", "撒哈拉以南", "欧洲", "北美", "拉丁美洲", "太平洋岛", "北极", "架空东方", "架空西方", "架空中东", "跨文明", "机械文明", "有机文明", "外星文明", "无名文明", "后人类"] },
  { id: "tone", label: "AXIS-Q", name: "质感轴", ticks: ["日常温柔", "慵懒", "忧郁", "孤独", "浪漫", "哀愁", "宁静", "诡异", "恐惧", "压抑", "绝望", "史诗", "壮阔", "紧张", "暴力", "荒诞", "滑稽", "怀旧", "神圣", "虚无"] },
];

// ==========================================
// ✨ 高维磁吸刻度尺 (无需修改，保持完美)
// ==========================================
function AxisRow({ axis, selectedValue, onChange }: { axis: { id: string; label: string; name: string; ticks: string[] }; selectedValue: string | null; onChange: (val: string | null) => void; }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const items = [null, ...axis.ticks]; 
  const exactIndex = selectedValue ? axis.ticks.indexOf(selectedValue) + 1 : 0;
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const displayIndex = dragIndex !== null ? dragIndex : exactIndex;
  const displayValue = items[displayIndex];

  const calculateIndex = (clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width)); 
    return Math.round((x / rect.width) * (items.length - 1)); 
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation(); 
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId); 
    setDragIndex(calculateIndex(e.clientX));
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation(); 
    if (!isDragging.current) return;
    setDragIndex(calculateIndex(e.clientX));
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation(); 
    if (!isDragging.current) return;
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragIndex(null);
    onChange(items[calculateIndex(e.clientX)]); 
  };

  return (
    <div className={`border-b border-[#e2e2e8] last:border-none transition-colors duration-300 relative ${selectedValue ? "bg-[#4a3570]/5" : ""}`}>
      <div className="flex items-center gap-3 py-4 px-4 sm:px-6">
        <span className="font-mono text-[10px] tracking-[0.3em] text-[#8e8e9f] uppercase min-w-[50px] sm:min-w-[60px]">{axis.label}</span>
        <span className="text-[12px] sm:text-[13px] font-semibold text-[#1a1a24]">{axis.name}</span>
        <span className={`ml-auto text-[10px] sm:text-[11px] font-mono font-bold truncate max-w-[120px] text-right transition-colors ${displayIndex === 0 ? 'text-[#8e8e9f]' : 'text-[#4a3570]'}`}>
          {displayIndex === 0 ? "[ 维度漫游 ]" : displayValue}
        </span>
      </div>
      <div className="px-6 pb-6 select-none touch-pan-y">
        <div 
          className="relative h-8 w-full cursor-grab active:cursor-grabbing flex items-center"
          ref={trackRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}
          onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onMouseMove={(e) => e.stopPropagation()}
        >
          <div className="absolute left-0 right-0 h-[1px] bg-[#e2e2e8] top-1/2 -translate-y-1/2 z-0" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-3 border-l-2 border-y-2 border-[#8e8e9f]/60 z-0 rounded-l-[1px]" />
          {axis.ticks.map((tick, i) => {
             const percent = ((i + 1) / (items.length - 1)) * 100;
             return <div key={tick} className={`absolute top-1/2 -translate-y-1/2 w-[1px] bg-[#c0c0c8] z-0 ${i % 5 === 0 ? 'h-2.5' : 'h-1'}`} style={{ left: `${percent}%` }} />;
          })}
          <div className="absolute top-1/2 z-10 flex flex-col items-center transition-all duration-[100ms] ease-out pointer-events-none" style={{ left: `${(displayIndex / (items.length - 1)) * 100}%`, transform: 'translate(-50%, -50%)' }}>
            <div className={`w-[3px] h-3.5 sm:w-[3px] sm:h-4 rounded-full transition-all duration-150 ${displayIndex === 0 ? 'bg-[#8e8e9f] shadow-[0_0_5px_rgba(142,142,159,0.3)] scale-90' : 'bg-[#4a3570] shadow-[0_0_8px_rgba(74,53,112,0.6)] scale-125'}`} />
            <div className={`w-0 h-0 mt-[4px] border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] transition-colors duration-150 ${displayIndex === 0 ? 'border-b-[#8e8e9f]' : 'border-b-[#4a3570]'}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
// ==========================================

export default function ArchiveZone() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selected, setSelected] = useState<Coordinates>({ time: null, space: null, civ: null, tone: null });

  // 👇 ✨ 终极精简的 真·懒加载引擎轴
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(0); 
  const [hasMore, setHasMore] = useState(true); 
  const [isLoading, setIsLoading] = useState(false); 
  const loaderRef = useRef<HTMLDivElement>(null);

  // 🚀 真·数据打捞法术：极其纯粹的 SQL 映射
  const fetchScenes = useCallback(async (currentPage: number, currentFilters: Coordinates, isReset = false) => {
    setIsLoading(true);

    let query = supabase
      .from('scenes')
      .select('*')
      .order('created_at', { ascending: false }); // 🎯 最新排前面！
      
    if (currentFilters.time) query = query.eq('coords->>time', currentFilters.time);
    if (currentFilters.space) query = query.eq('coords->>space', currentFilters.space);
    if (currentFilters.civ) query = query.eq('coords->>civ', currentFilters.civ);
    if (currentFilters.tone) query = query.eq('coords->>tone', currentFilters.tone);

    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1; 
    const { data, error } = await query.range(from, to);

    if (!error && data) {
      const mapped = data.map((row) => ({
        id: row.scene_id, name: row.name, world: row.world, description: row.description,
        characters: row.characters, tags: row.tags, coords: row.coords, moments: row.moments,
      }));

      // ✨ 极其致命的防御结界：彻底剔除重复的幻影 ✨
      setScenes((prev) => {
        if (isReset) return mapped; // 如果是切换坐标，直接推翻重来
        
        // 1. 把目前屏幕上已经存在的所有星星的 ID，写进黑名单小本本里
        const existingIds = new Set(prev.map(scene => scene.id));
        
        // 2. 极其严苛的安检：只允许那些 ID 不在黑名单里的新星星通过！
        const newUniqueScenes = mapped.filter(scene => !existingIds.has(scene.id));
        
        // 3. 极其丝滑地拼接
        return [...prev, ...newUniqueScenes];
      });
      setHasMore(data.length === PAGE_SIZE); 
    } else {
      console.error("深空数据索要失败:", error);
    }
    
    setIsLoading(false);
  }, []); // ✨ 极其纯粹的 useCallback

  // ✨ 魔法阵一：坐标变更监听器 
  useEffect(() => {
    setPage(0); 
    fetchScenes(0, selected, true); 
  }, [selected, fetchScenes]);

  // ✨ 魔法阵二：触底雷达 
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      // ✨ 极其严谨的判定：如果看到了底部，并且还有数据，并且没有正在加载，再去要下一页
      if (entries[0].isIntersecting && hasMore && !isLoading && scenes.length > 0) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchScenes(nextPage, selected, false);
      }
    }, { threshold: 0.1 });

    if (loaderRef.current) observer.observe(loaderRef.current);
    
    return () => observer.disconnect();
    // ✨ 极其干净的依赖项
  }, [hasMore, isLoading, page, selected, fetchScenes, scenes.length]);

  // --- 操作面板 ---
  const handleAxisChange = (axisId: keyof Coordinates, value: string | null) => {
    // 极其简单，只负责改坐标状态，useEffect 会自动接管后续所有数据拉取
    setSelected((prev) => ({ ...prev, [axisId]: prev[axisId] === value ? null : value }));
  };

  const clearAll = () => {
    setSelected({ time: null, space: null, civ: null, tone: null });
  };

  const activeCoordsString = Object.values(selected).filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-[#1a1a24] font-serif overflow-x-hidden pb-20">
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{ backgroundImage: "radial-gradient(#e2e2e8 1px, transparent 1px)", backgroundSize: "40px 40px", backgroundPosition: "-19px -19px" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        
        <div className="mb-14 text-center">
          <h1 className="text-[13px] tracking-[0.4em] text-[#8e8e9f] font-mono mb-4 uppercase">Coordinate Index</h1>
          <p className="text-xl sm:text-2xl md:text-3xl font-light tracking-wide leading-relaxed">
            拨动坐标轴，定位<span className="text-[#4a3570]">宇宙中某个瞬间</span>
          </p>
        </div>

        <div className="flex flex-col mb-12 bg-white border border-[#e2e2e8] shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-sm overflow-hidden">
          {AXES.map((axis) => (
            <AxisRow key={axis.id} axis={axis} selectedValue={selected[axis.id as keyof Coordinates]} onChange={(val) => handleAxisChange(axis.id as keyof Coordinates, val)} />
          ))}
        </div>

        <div className="flex items-baseline gap-4 mb-6 pb-3 border-b border-[#e2e2e8]">
          {/* 因为是真懒加载，所以这里显示的数字代表“当前已打捞”的数量 */}
          <span className="font-mono text-[11px] text-[#8e8e9f] tracking-[0.2em]">{scenes.length} 档案</span>
          <span className="text-[12px] text-[#4a3570] font-semibold line-clamp-1">{activeCoordsString}</span>
          <button onClick={clearAll} className="ml-auto flex-shrink-0 text-[11px] text-[#8e8e9f] hover:text-[#1a1a24] font-mono tracking-[0.1em] transition-colors">
            [清空坐标]
          </button>
        </div>

        {/* 👇 ✨ 这里不再有任何假切片，直接渲染真实的 scenes！ */}
        {scenes.length === 0 && !isLoading ? (
          <div className="text-center py-24 text-[#8e8e9f] text-[13px] tracking-[0.2em]">
            <div className="text-2xl mb-4 opacity-30">⚲</div>
            <div>当前坐标系下，尚未解密任何档案</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {scenes.map((scene) => (
              <Link href={`?scene=${scene.id}`} scroll={false} key={scene.id} className="group relative bg-white border border-[#e2e2e8] p-6 sm:p-7 block cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-[#4a3570]/30 hover:shadow-[0_10px_30px_rgba(74,53,112,0.08)] hover:-translate-y-1 overflow-hidden">
                <div className="absolute top-0 left-0 w-[3px] h-full bg-[#4a3570] scale-y-0 origin-bottom transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100" />
                <div className="font-mono text-[10px] tracking-[0.3em] text-[#8e8e9f] mb-3 uppercase">{scene.world}</div>
                <div className="text-[16px] font-semibold text-[#1a1a24] mb-3 leading-relaxed">{scene.name}</div>
                <div className="text-[13px] text-[#8e8e9f] leading-[1.8] line-clamp-3">{scene.description}</div>
                <div className="flex flex-wrap gap-2 mt-5">
                  {(scene.tags || []).map((tag) => {
                    const isTagActive = Object.values(selected).includes(tag);
                    return (
                      <span key={tag} className={`text-[10px] px-2.5 py-1 font-mono tracking-wider transition-colors border ${isTagActive ? "bg-[#4a3570]/10 border-[#4a3570] text-[#4a3570] font-semibold" : "bg-[#fcfcfd] border-[#e2e2e8] text-[#8e8e9f]"}`}>
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </Link>
            ))}

            {/* 👇 真·加载探测器与底部分界线 */}
            <div ref={loaderRef} className="col-span-1 md:col-span-2 py-8 flex justify-center items-center">
              {isLoading ? (
                <span className="text-[#4a3570] text-[11px] tracking-[0.3em] uppercase animate-pulse">正在连入深空节点...</span>
              ) : !hasMore && scenes.length > 0 ? (
                <span className="text-gray-300 text-[11px] tracking-[0.3em] uppercase">— 宇宙边界已至 —</span>
              ) : null}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}