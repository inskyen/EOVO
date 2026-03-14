"use client";

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import SceneCard from './SceneCard';
import { supabase } from '@/lib/supabase'

interface SceneData {
  id: string | number;
  name: string;
  world: string;
  description: string;
}

export default function DrawZone() {
  const [isRevealed, setIsRevealed] = useState(false);
  const [currentScene, setCurrentScene] = useState<SceneData | null>(null);
  const [scenesDb, setScenesDb] = useState<SceneData[]>([]);
  
  // ✨ 新增：记录当前这张卡片，是否已经被我们珍藏
  const [isSaved, setIsSaved] = useState(false);

  // 1. 物理引擎初始化
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 150], [1, 0]); 
  const bgWidth = useTransform(x, [0, 200], ["0%", "100%"]); 

  // 2. 命运随机抽取函数
  const drawNewCard = () => {
    if (scenesDb.length === 0) return; 
    const randomIndex = Math.floor(Math.random() * scenesDb.length);
    const scene = scenesDb[randomIndex];
    
    setCurrentScene(scene);
    setIsRevealed(false);
    x.set(0); 
  };

  // 3. 首次降临：异步读取星海法典
  useEffect(() => {
    supabase
      .from('scenes')
      .select('id, scene_id, name, world, description')
      .then(({ data, error }) => {
        if (error) { console.error("星海法典读取失败:", error); return; }
        const mapped = (data || []).map(row => ({
          id: row.scene_id,
          name: row.name,
          world: row.world,
          description: row.description,
        }));
        setScenesDb(mapped);
        if (mapped.length > 0) {
          const randomIndex = Math.floor(Math.random() * mapped.length);
          setCurrentScene(mapped[randomIndex]);
        }
      });
  }, []);

  // 👇 ✨ 4. 升级版记忆雷达：监听卡片内部传来的心跳
  useEffect(() => {
    if (!currentScene) return;

    const checkSavedStatus = () => {
      try {
        const savedScenes = JSON.parse(localStorage.getItem("eovo_saved_scenes") || "[]");
        setIsSaved(savedScenes.includes(currentScene.id));
      } catch (e) {
        console.warn("读取星海记忆失败");
      }
    };

    checkSavedStatus(); // 翻开新卡片时的检查

    // ✨ 核心共振魔法：如果小天直接点了卡片里的星星，外面的按钮也要跟着变！
    window.addEventListener('eovo_memory_sync', checkSavedStatus);

    return () => {
      window.removeEventListener('eovo_memory_sync', checkSavedStatus);
    };
  }, [currentScene]);

  // 👇 ✨ 5. 镌刻与抹除记忆的执行法术
  const toggleSave = () => {
    if (!currentScene) return;
    try {
      const savedScenes = JSON.parse(localStorage.getItem("eovo_saved_scenes") || "[]");
      let newSaved;
      if (isSaved) {
        // 如果已经收取了，再点一次就是退还（取消收藏）
        newSaved = savedScenes.filter((id: string | number) => id !== currentScene.id);
        setIsSaved(false);
      } else {
        // 收下它！
        newSaved = [...savedScenes, currentScene.id];
        setIsSaved(true);
      }
      localStorage.setItem("eovo_saved_scenes", JSON.stringify(newSaved));
      
      // 📡 极其高阶的魔法预留：发射全宇宙广播，通知 SceneCard 里的星星同步亮起！
      window.dispatchEvent(new Event('eovo_memory_sync'));
    } catch (e) {
      console.warn("星海记忆刻录失败");
    }
  };

  if (!currentScene) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[70vh]">
        <div className="font-mono text-[11px] tracking-[0.3em] text-[#4a3570] animate-pulse">
          DRAWING FROM THE VOID...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[70vh] px-4">
      {!isRevealed ? (
        /* --- 封印态：深紫信封 (保持原样) --- */
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-full max-w-sm aspect-[4/3] bg-[#4a3570] rounded-[20px] shadow-2xl flex flex-col items-center justify-center overflow-hidden"
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.15]" preserveAspectRatio="none">
             <line x1="0" y1="0" x2="50%" y2="50%" stroke="white" strokeWidth="1" />
             <line x1="100%" y1="0" x2="50%" y2="50%" stroke="white" strokeWidth="1" />
          </svg>
          <h2 className="text-white text-[20px] tracking-[0.5em] font-light mb-12 opacity-80 z-10">陌 生 来 信</h2>
          <div 
            className="relative w-[240px] h-[54px] bg-white/10 rounded-full border border-white/20 backdrop-blur-sm overflow-hidden z-20"
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
             <motion.div style={{ width: bgWidth }} className="absolute inset-0 bg-white/20" />
             <motion.p style={{ opacity }} className="absolute inset-0 flex items-center justify-center text-white/50 text-[13px] tracking-widest pl-8 pointer-events-none">滑动解封</motion.p>
             <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 180 }}
              dragElastic={0} 
              dragMomentum={false}
              style={{ x }}
              onDragEnd={() => {
                if (x.get() > 140) setIsRevealed(true);
                else animate(x, 0, { type: "spring", stiffness: 300, damping: 20 });
              }}
              className="absolute left-1 top-1 w-[46px] h-[46px] bg-white rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing z-30"
             >
               <div className="w-2 h-2 bg-[#4a3570] rounded-full" />
             </motion.div>
          </div>
        </motion.div>
      ) : (
        /* --- 觉醒态：真实卡片降临 --- */
        <motion.div 
          initial={{ y: 30, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          className="w-full flex flex-col items-center"
        >
          <div className="w-full max-w-md px-1 pt-4">
            <SceneCard 
              id={currentScene.id}
              name={currentScene.name}
              world={currentScene.world}
              description={currentScene.description}
            />
          </div>

          <div className="flex space-x-6 mt-10 pb-10">
            {/* 退还按钮 */}
            <button 
              onClick={drawNewCard}
              className="px-10 py-3.5 rounded-full border border-gray-200 bg-white text-gray-500 flex items-center space-x-2 active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:bg-gray-50/50 focus:outline-none"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              <span className="text-[15px] tracking-wide">打捞</span>
            </button>

            {/* 👇 ✨ 收下 / 已收取 动态切换按钮 ✨ 👇 */}
            <button 
              onClick={toggleSave}
              className={`px-10 py-3.5 rounded-full border flex items-center space-x-2 transition-all duration-300 focus:outline-none active:scale-95 ${
                isSaved
                  ? "border-[#4a3570]/20 bg-[#4a3570]/5 text-[#4a3570]/80 shadow-none" // 宁静的已收取态
                  : "border-[#4a3570] bg-[#f5f3f7] text-[#4a3570] shadow-[0_4px_12px_rgba(74,53,112,0.15)] hover:shadow-lg hover:border-[#4a3570]/80" // 充满张力的未收取态
              }`}
            >
              {isSaved ? (
                // 🌟 已收取：温柔的对号图标
                <svg className="w-[18px] h-[18px] scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                // 📥 收下：向下的入库图标
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              <span className={`text-[15px] tracking-wide ${isSaved ? "font-semibold" : "font-medium"}`}>
                {isSaved ? "已纳" : "收下"}
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}