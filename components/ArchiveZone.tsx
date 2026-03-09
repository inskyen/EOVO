"use client";

import { useState, useEffect } from "react";
import Link from "next/link"; // ✨ 传送门魔法已在顶部精准注入

// --- 类型定义 ---
type Coordinates = {
  time: string | null;
  space: string | null;
  civ: string | null;
  tone: string | null;
};

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

// --- 坐标轴静态数据 ---
const AXES = [
  {
    id: "time",
    label: "AXIS-T",
    name: "时间轴",
    ticks: ["神话时代", "洪荒", "上古", "先秦", "汉唐", "中世纪", "工业革命", "19世纪", "20世纪初", "二战", "冷战", "1980s", "1990s", "2000s", "2010s", "现代", "近未来", "2050s", "2100s", "星际时代", "热寂前", "时间线外", "永恒"],
  },
  {
    id: "space",
    label: "AXIS-S",
    name: "空间轴",
    ticks: ["地底", "深海", "村落", "城镇", "都市", "荒野", "战场", "异域", "异星", "轨道站", "星际", "虚空", "次元裂缝", "梦境", "神国", "冥界", "镜中世界", "维度外", "概念空间"],
  },
  {
    id: "civ",
    label: "AXIS-C",
    name: "文明轴",
    ticks: ["东亚", "东南亚", "南亚", "中东", "北非", "撒哈拉以南", "欧洲", "北美", "拉丁美洲", "太平洋岛", "北极", "架空东方", "架空西方", "架空中东", "跨文明", "机械文明", "有机文明", "外星文明", "无名文明", "后人类"],
  },
  {
    id: "tone",
    label: "AXIS-Q",
    name: "质感轴",
    ticks: ["日常温柔", "慵懒", "忧郁", "孤独", "浪漫", "哀愁", "宁静", "诡异", "恐惧", "压抑", "绝望", "史诗", "壮阔", "紧张", "暴力", "荒诞", "滑稽", "怀旧", "神圣", "虚无"],
  },
];

export default function ArchiveZone() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selected, setSelected] = useState<Coordinates>({
    time: null,
    space: null,
    civ: null,
    tone: null,
  });

  useEffect(() => {
    fetch("/data/scenes.json")
      .then((res) => res.json())
      .then((data) => setScenes(data))
      .catch((err) => console.error("档案数据读取失败:", err));
  }, []);

  const handleTickClick = (axisId: keyof Coordinates, value: string) => {
    setSelected((prev) => ({
      ...prev,
      [axisId]: prev[axisId] === value ? null : value,
    }));
  };

  const clearAll = () => {
    setSelected({ time: null, space: null, civ: null, tone: null });
  };

  const filteredScenes = scenes.filter((scene) => {
    return (Object.keys(selected) as Array<keyof Coordinates>).every((key) => {
      const selectedValue = selected[key];
      if (!selectedValue) return true;
      return scene.coords[key] === selectedValue || (scene.tags || []).includes(selectedValue);
    });
  });

  const activeCoordsString = Object.values(selected).filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-[#1a1a24] font-serif overflow-x-hidden pb-20">
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(#e2e2e8 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          backgroundPosition: "-19px -19px"
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        
        <div className="mb-14 text-center">
          <h1 className="text-[13px] tracking-[0.4em] text-[#8e8e9f] font-mono mb-4 uppercase">
            Coordinate Index
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl font-light tracking-wide leading-relaxed">
            拨动坐标轴，定位<span className="text-[#4a3570]">宇宙中某个瞬间</span>
          </p>
        </div>

        <div className="flex flex-col mb-12 bg-white border border-[#e2e2e8] shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-sm overflow-hidden">
          {AXES.map((axis) => {
            const axisId = axis.id as keyof Coordinates;
            const hasSelection = !!selected[axisId];

            return (
              <div 
                key={axis.id}
                className={`border-b border-[#e2e2e8] last:border-none transition-colors duration-300 relative ${hasSelection ? "bg-[#4a3570]/5" : ""}`}
              >
                <div className="flex items-center gap-3 py-4 px-4 sm:px-6">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-[#8e8e9f] uppercase min-w-[50px] sm:min-w-[60px]">
                    {axis.label}
                  </span>
                  <span className="text-[12px] sm:text-[13px] font-semibold text-[#1a1a24]">
                    {axis.name}
                  </span>
                  <span className="ml-auto text-[10px] sm:text-[11px] text-[#4a3570] font-mono font-bold truncate max-w-[120px] text-right">
                    {selected[axisId] || "—"}
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
                  
                  <div className="px-6 pb-5 overflow-x-auto touch-pan-x overscroll-x-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="flex items-end gap-0 pb-2 min-w-max">
                      {axis.ticks.map((tick, i) => {
                        const isActive = selected[axisId] === tick;
                        const isMajor = i % 5 === 0;

                        return (
                          <div
                            key={tick}
                            onClick={() => handleTickClick(axisId, tick)}
                            className="flex flex-col items-center cursor-pointer px-[2px] relative group"
                          >
                            <div
                              className={`w-[1px] mb-[6px] transition-all duration-300 ${
                                isActive
                                  ? "h-[20px] w-[2px] bg-[#4a3570] shadow-[0_0_8px_rgba(74,53,112,0.4)]"
                                  : isMajor
                                  ? "h-[16px] bg-[#c0c0c8] group-hover:h-[20px] group-hover:w-[2px] group-hover:bg-[#4a3570]"
                                  : "h-[8px] bg-[#e2e2e8] group-hover:h-[20px] group-hover:w-[2px] group-hover:bg-[#4a3570]"
                              }`}
                            />
                            <span
                              className={`text-[11px] whitespace-nowrap px-[6px] transition-all duration-300 ${
                                isActive
                                  ? "text-[#4a3570] font-semibold block"
                                  : isMajor
                                  ? "text-[#8e8e9f] group-hover:text-[#4a3570] group-hover:font-semibold"
                                  : "text-[#8e8e9f] hidden group-hover:block group-hover:text-[#4a3570] group-hover:font-semibold"
                              }`}
                            >
                              {tick}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-baseline gap-4 mb-6 pb-3 border-b border-[#e2e2e8]">
          <span className="font-mono text-[11px] text-[#8e8e9f] tracking-[0.2em]">
            {filteredScenes.length} 档案
          </span>
          <span className="text-[12px] text-[#4a3570] font-semibold line-clamp-1">
            {activeCoordsString}
          </span>
          <button
            onClick={clearAll}
            className="ml-auto flex-shrink-0 text-[11px] text-[#8e8e9f] hover:text-[#1a1a24] font-mono tracking-[0.1em] transition-colors"
          >
            [清空坐标]
          </button>
        </div>

        {filteredScenes.length === 0 ? (
          <div className="text-center py-24 text-[#8e8e9f] text-[13px] tracking-[0.2em]">
            <div className="text-2xl mb-4 opacity-30">⚲</div>
            <div>当前坐标系下，尚未解密任何档案</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredScenes.map((scene) => (
              /* ✨ 完美的抽屉召唤阵在此处 ✨ */
              <Link
                href={`?scene=${scene.id}`} // 👈 修改 1：变更为追加参数，召唤抽屉
                scroll={false}              // 👈 修改 2：施加定海神针，阻止滚动重置
                key={scene.id}
                className="group relative bg-white border border-[#e2e2e8] p-6 sm:p-7 block cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-[#4a3570]/30 hover:shadow-[0_10px_30px_rgba(74,53,112,0.08)] hover:-translate-y-1 overflow-hidden"
              >
                {/* 下面的 UI 代码完全保持您的原样，享受极致的视觉呼吸感 */}
                <div className="absolute top-0 left-0 w-[3px] h-full bg-[#4a3570] scale-y-0 origin-bottom transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100" />
                
                <div className="font-mono text-[10px] tracking-[0.3em] text-[#8e8e9f] mb-3 uppercase">
                  {scene.world}
                </div>
                
                <div className="text-[16px] font-semibold text-[#1a1a24] mb-3 leading-relaxed">
                  {scene.name} 
                </div>
                
                <div className="text-[13px] text-[#8e8e9f] leading-[1.8] line-clamp-3">
                  {scene.description}
                </div>
                
                <div className="flex flex-wrap gap-2 mt-5">
                  {(scene.tags || []).map((tag) => {
                    const isTagActive = Object.values(selected).includes(tag);
                    return (
                      <span
                        key={tag}
                        className={`text-[10px] px-2.5 py-1 font-mono tracking-wider transition-colors border ${
                          isTagActive
                            ? "bg-[#4a3570]/10 border-[#4a3570] text-[#4a3570] font-semibold"
                            : "bg-[#fcfcfd] border-[#e2e2e8] text-[#8e8e9f]"
                        }`}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}