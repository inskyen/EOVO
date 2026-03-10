"use client";

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import SceneCard from './SceneCard';
import { supabase } from '@/lib/supabase'

// --- 类型定义 ---
interface SceneData {
  id: string | number;
  name: string;
  world: string;
  description: string;
  // 即使不全写出来，只要有这四个核心要素，就足以让 SceneCard 完美降临
}

export default function DrawZone() {
  const [isRevealed, setIsRevealed] = useState(false);
  const [currentScene, setCurrentScene] = useState<SceneData | null>(null);
  const [scenesDb, setScenesDb] = useState<SceneData[]>([]);

  // 1. 物理引擎初始化：必须最先声明，确立空间坐标系的锚点
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 150], [1, 0]); 
  const bgWidth = useTransform(x, [0, 200], ["0%", "100%"]); 

  // 2. 命运随机抽取函数
  const drawNewCard = () => {
    if (scenesDb.length === 0) return; // 确保法典已加载
    const randomIndex = Math.floor(Math.random() * scenesDb.length);
    const scene = scenesDb[randomIndex];
    
    setCurrentScene(scene);
    setIsRevealed(false);
    x.set(0); // 坐标归零，重新封印
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

  // 兜底防止渲染空洞，显示极简的加载态
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
        /* --- 封印态：深紫信封 --- */
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-full max-w-sm aspect-[4/3] bg-[#4a3570] rounded-[20px] shadow-2xl flex flex-col items-center justify-center overflow-hidden"
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.15]" preserveAspectRatio="none">
             <line x1="0" y1="0" x2="50%" y2="50%" stroke="white" strokeWidth="1" />
             <line x1="100%" y1="0" x2="50%" y2="50%" stroke="white" strokeWidth="1" />
          </svg>
          
          <h2 className="text-white text-[20px] tracking-[0.5em] font-light mb-12 opacity-80 z-10">
            陌 生 来 信
          </h2>

          <div 
            className="relative w-[240px] h-[54px] bg-white/10 rounded-full border border-white/20 backdrop-blur-sm overflow-hidden z-20"
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
             <motion.div style={{ width: bgWidth }} className="absolute inset-0 bg-white/20" />
             <motion.p style={{ opacity }} className="absolute inset-0 flex items-center justify-center text-white/50 text-[13px] tracking-widest pl-8 pointer-events-none">
               滑动解封
             </motion.p>

             <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 180 }}
              dragElastic={0} 
              dragMomentum={false}
              style={{ x }}
              onDragEnd={() => {
                if (x.get() > 140) {
                  setIsRevealed(true);
                } else {
                  animate(x, 0, { type: "spring", stiffness: 300, damping: 20 });
                }
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
          {/* 这里完美调用了我们刚刚升级过的、带有传送门魔法的 SceneCard */}
          <div className="w-full max-w-md px-1 pt-4">
            <SceneCard 
              id={currentScene.id}
              name={currentScene.name}
              world={currentScene.world}
              description={currentScene.description}
            />
          </div>

          <div className="flex space-x-6 mt-10 pb-10">
            {/* 点击“退还”：触发新的命运抽取 */}
            <button 
              onClick={drawNewCard}
              className="px-10 py-3.5 rounded-full border border-gray-200 bg-white text-gray-500 flex items-center space-x-2 active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:bg-gray-50/50 focus:outline-none"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              <span className="text-[15px] tracking-wide">退还</span>
            </button>

            {/* 收下按钮 */}
            <button 
              onClick={() => {
                // TODO: 预留给弥奈的收藏小魔法
                console.log(`已将 ${currentScene.name} 珍藏入心`);
              }}
              className="px-10 py-3.5 rounded-full border border-[#4a3570] bg-[#f5f3f7] text-[#4a3570] flex items-center space-x-2 active:scale-95 transition-all shadow-[0_4px_12px_rgba(74,53,112,0.15)] hover:shadow-lg hover:border-[#4a3570]/80 focus:outline-none"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="text-[15px] font-medium tracking-wide">收下</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}