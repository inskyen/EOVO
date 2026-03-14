"use client";

import React, { useState, useEffect, useRef } from 'react';
import SceneCard from '../components/SceneCard';
import DrawZone from '../components/DrawZone'; 
import ArchiveZone from '../components/ArchiveZone';
import { Suspense } from 'react';
import SceneDrawer from '../components/SceneDrawer';
import SearchZone from "../components/SearchZone";
import { supabase } from '@/lib/supabase'

// ✨ 小天专属指令：每次发牌 5 张
const PAGE_SIZE = 5;

// 🔮 混沌洗牌法术：极其公平的随机打乱
const shuffleArray = (array: any[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export default function Home() {
  // ==========================================
  // 1. 三界坐标系 
  // 0: 抽卡 | 1: 发现 (默认) | 2: 分区
  // ==========================================
  const [activeTab, setActiveTab] = useState(1); 
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // ==========================================
  // 2. 发现页 (混沌瀑布流引擎) 核心状态
  // ==========================================
  const [masterPool, setMasterPool] = useState<any[]>([]); // 储存洗好的底牌 (大池子)
  const [items, setItems] = useState<any[]>([]); // 当前页面上真正展示的卡片
  const [currentPage, setCurrentPage] = useState(1); // 记录发牌发到第几轮了
  const [hasMore, setHasMore] = useState(true); // 是否还有底牌

  // ==========================================
  // 3. 物理触摸引擎状态
  // ==========================================
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0); 
  const [dragX, setDragX] = useState(0); 
  const [isDragging, setIsDragging] = useState(false); 
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchEndPos = useRef({ x: 0, y: 0 });
  const discoverScrollRef = useRef<HTMLDivElement>(null);
  const isMouseDown = useRef(false);
  const dragDirection = useRef<'horizontal' | 'vertical' | null>(null);

  const getPos = (e: any) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  // 🔮 核心动作：捞取盲盒并洗牌法术
  const fetchAndShufflePool = async () => {
    setIsRefreshing(true);
    // 从数据库捞取大池子 (比如100条)，为洗牌做准备
    const { data, error } = await supabase.from('scenes').select('*').limit(20);
    
    if (!error && data && data.length > 0) {
      const shuffled = shuffleArray(data); // 疯狂洗牌
      const mapped = shuffled.map(row => ({
        id: row.scene_id,
        name: row.name,
        world: row.world,
        description: row.description,
      }));
      
      setMasterPool(mapped); // 锁入底牌池
      setItems(mapped.slice(0, PAGE_SIZE)); // 发出第一轮的 5 张牌
      setCurrentPage(1);
      setHasMore(mapped.length > PAGE_SIZE);
    }
    
    setIsRefreshing(false);
    setPullY(0); // 轨道复位
  };

  // 🚀 首次降临：页面一加载就执行一次洗牌
  useEffect(() => {
    fetchAndShufflePool();
  }, []);

  // 🃏 触底发牌：从本地洗好的池子里，拿出接下来的 5 张 (懒加载)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    
    // 距离底部还剩 200px 时，提前发牌制造无缝感
    if (scrollHeight - scrollTop - clientHeight < 200) {
      if (hasMore && !isRefreshing) {
        const nextPageIndex = currentPage + 1;
        const startIndex = currentPage * PAGE_SIZE;
        const endIndex = nextPageIndex * PAGE_SIZE;
        
        // 切出新的一叠 5 张牌
        const nextBatch = masterPool.slice(startIndex, endIndex);
        
        if (nextBatch.length > 0) {
          setItems(prev => [...prev, ...nextBatch]); 
          setCurrentPage(nextPageIndex);
        }
        
        // 底牌发完了
        if (endIndex >= masterPool.length) {
          setHasMore(false);
        }
      }
    }
  };

  // ==========================================
  // 4. 双轨物理引擎 (手势拦截与分配)
  // ==========================================
  const handleDragStart = (e: any) => {
    if (e.type.includes('mouse')) isMouseDown.current = true;
    const pos = getPos(e);
    touchStartPos.current = pos;
    touchEndPos.current = pos;
    dragDirection.current = null; 
    setIsDragging(true); 
  };

  const handleDragMove = (e: any) => {
    if (e.type.includes('mouse') && !isMouseDown.current) return;

    const pos = getPos(e);
    touchEndPos.current = pos;
    const diffY = touchEndPos.current.y - touchStartPos.current.y;
    const diffX = touchEndPos.current.x - touchStartPos.current.x;

    if (!dragDirection.current) {
      if (Math.abs(diffX) < 5 && Math.abs(diffY) < 5) return; 
      dragDirection.current = Math.abs(diffX) > Math.abs(diffY) ? 'horizontal' : 'vertical';
    }

    const scrollTop = discoverScrollRef.current?.scrollTop || 0;

    if (dragDirection.current === 'horizontal') {
      let allowedDragX = diffX;
      if (activeTab === 0 && diffX > 0) allowedDragX = diffX / 3;
      if (activeTab === 2 && diffX < 0) allowedDragX = diffX / 3;
      setDragX(allowedDragX);
    } 
    else if (dragDirection.current === 'vertical') {
      if (activeTab === 1 && diffY > 0 && scrollTop <= 0) {
        setPullY(Math.min(diffY / 2.5, 80)); 
      }
    }
  };

  const handleDragEnd = (e: any) => {
    if (e.type.includes('mouse')) isMouseDown.current = false;
    setIsDragging(false); 

    // 判断位面切换
    if (Math.abs(dragX) > 60) {
      if (dragX > 0 && activeTab > 0) {
        setActiveTab(prev => prev - 1); 
      } else if (dragX < 0 && activeTab < 2) {
        setActiveTab(prev => prev + 1); 
      }
    }
    setDragX(0); 

    // 判断下拉刷新 (释放洗牌法术)
    if (activeTab === 1 && pullY > 55) {
      setPullY(55); // 让指示器悬停一下，增加真实感
      setTimeout(() => {
        fetchAndShufflePool(); // 召唤洗牌法术！
      }, 600); 
    } else {
      setPullY(0);
    }
  };

  return (
    <main className="h-[100dvh] w-screen bg-[#f5f6f8] font-sans overflow-hidden flex flex-col">
      
      {/* 顶部苍穹导航 */}
      <header className="flex-none bg-white/95 backdrop-blur-md border-b border-gray-100 px-5 py-3.5 flex items-center z-50">
        <div className="flex-1 flex justify-start">
          <div className="text-[19px] tracking-[0.2em] text-[#4a3570] font-light">EOVO</div>
        </div>
        <div className="flex-none flex space-x-7 text-[15px]">
          {['漂流瓶', '发现', '坐标'].map((tabName, index) => (
            <div key={index} className="relative cursor-pointer flex flex-col items-center" onClick={() => setActiveTab(index)}>
              <span className={activeTab === index ? "text-gray-900 font-bold" : "text-gray-500"}>{tabName}</span>
              {activeTab === index && <div className="absolute -bottom-[6px] w-[14px] h-[3px] bg-[#4a3570] rounded-full transition-all"></div>}
            </div>
          ))}
        </div>
        <div className="flex-1 flex justify-end text-gray-400">
          <svg 
            onClick={() => setIsSearchOpen(true)} 
            className="w-5 h-5 cursor-pointer hover:text-[#4a3570] transition-colors" 
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </header>
      
      {/* 下拉刷新指示器 */}
      <div className="absolute w-full flex justify-center items-center text-[#4a3570] text-[13px] font-medium z-0" style={{ height: '55px', top: '55px', opacity: pullY / 55 }}>
        {isRefreshing ? '星轨重构中...' : (pullY > 55 ? '松开降临新世界' : '下拉探索星海')}
      </div>

      {/* 滑动胶卷轨道 */}
      <div 
        className="flex-1 min-h-0 w-full relative z-10 flex" 
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd} 
      >
        <div 
          className={`flex w-[300vw] ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
          style={{ transform: `translateX(calc(-${activeTab * 100}vw + ${dragX}px))` }}
        >
          
          {/* 位面 0：漂流瓶 */}
          <div className="w-[100vw] h-full overflow-y-auto shrink-0 flex flex-col items-center justify-center text-gray-400 pb-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DrawZone />
          </div>

          {/* 位面 1：发现页 (混沌瀑布流) */}
          <div 
            ref={discoverScrollRef}
            onScroll={handleScroll} // ✨ 引擎皮带在这里完美连接！
            className="w-[100vw] h-full overflow-y-auto shrink-0 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="max-w-md mx-auto px-4 pt-4 relative z-10" style={{ transform: `translateY(${pullY}px)`, transition: pullY === 0 || isRefreshing ? 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'none' }}>
              
              {items.map((scene, index) => (
                <SceneCard 
                  key={`${scene.id}-${index}`} 
                  id={scene.id}         
                  name={scene.name} 
                  world={scene.world} 
                  description={scene.description} 
                />
              ))}

              {/* 极其优雅的底部边界提示 (因为本地发牌光速完成，所以不需要 loading 圈了) */}
              <div className="py-8 flex justify-center items-center text-gray-400 text-[13px]">
                {!hasMore ? (
                  <span className="text-gray-300 tracking-widest opacity-80">— 宇宙边界已至 —</span>
                ) : (
                  <span className="text-transparent">往下翻寻觅奇迹</span> 
                )}
              </div>

            </div>
          </div>

          {/* 位面 2：坐标档案馆 */}
          <div className="w-[100vw] h-full overflow-y-auto shrink-0 bg-[#0a0a0f] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <ArchiveZone /> 
          </div>

        </div>
      </div>

      {/* 上层悬浮结界 */}
      <Suspense fallback={null}>
        <SceneDrawer />
      </Suspense>
      <SearchZone isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  );
}