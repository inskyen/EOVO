"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import SceneCard from '../components/SceneCard';
import DrawZone from '../components/DrawZone'; // 👈 1. 召唤抽卡大厅组件
import ArchiveZone from '../components/ArchiveZone';
import { Suspense } from 'react';
import SceneDrawer from '../components/SceneDrawer';
import SearchZone from "../components/SearchZone";
import { supabase } from '@/lib/supabase'

const PAGE_SIZE = 5;

export default function Home() {
  // ==========================================
  // 1. 三界坐标系 (核心魔法：控制当前显示的平行位面)
  // 0: 抽卡 | 1: 发现 (默认) | 2: 分区
  // ==========================================
  const [activeTab, setActiveTab] = useState(1); 
  // 搜索
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 2. 发现页 (瀑布流) 状态
  const [items, setItems] = useState<{id: string; name: string; world: string; description: string}[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // 3. 物理触摸引擎状态
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0); 
  const [dragX, setDragX] = useState(0); // 记录手指横向拉扯的像素位移
  const [isDragging, setIsDragging] = useState(false); // 标记当前是否正在被手指按住
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchEndPos = useRef({ x: 0, y: 0 });
  const loaderRef = useRef<HTMLDivElement>(null);
  // 👇 新增：用于探测发现页自己滚动到了哪里的探测仪 👇
  const discoverScrollRef = useRef<HTMLDivElement>(null);
  

  // 初始化发现页数据
  useEffect(() => {
    supabase.from('scenes').select('*').range(0, PAGE_SIZE - 1)
      .then(({ data }) => {
        setItems((data || []).map(row => ({
          id: row.scene_id,
          name: row.name,
          world: row.world,
          description: row.description,
        })));
      });
  }, []);
  
  // 👇 加在这里
  useEffect(() => {
    supabase.from('scenes').select('*').limit(5).then(({ data, error }) => {
    })
  }, [])

  // 懒加载引擎 (仅在发现页有效)
  const loadMore = useCallback(() => {
    if (activeTab !== 1 || isLoading || isRefreshing || !hasMore) return;
    setIsLoading(true);
    const currentLength = items.length;
    supabase.from('scenes').select('*').range(currentLength, currentLength + PAGE_SIZE - 1)
      .then(({ data }) => {
        const next = (data || []).map(row => ({
          id: row.scene_id, name: row.name, world: row.world, description: row.description,
        }));
        if (next.length > 0) setItems(prev => [...prev, ...next]);
        if (next.length < PAGE_SIZE) setHasMore(false);
        setIsLoading(false);
      });
  }, [activeTab, items.length, isLoading, isRefreshing, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

// ==========================================
  // 4. 终极物理触摸引擎 (跟手阻尼 + 位面穿梭 + 下拉刷新)
  // ==========================================
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    touchEndPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setIsDragging(true); // 👇 核心魔法：手指按下，剥夺 CSS 动画权柄！
  };

const handleTouchMove = (e: React.TouchEvent) => {
    touchEndPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    const diffY = touchEndPos.current.y - touchStartPos.current.y;
    const diffX = touchEndPos.current.x - touchStartPos.current.x;

    // 获取发现页局部的滚动高度
    const scrollTop = discoverScrollRef.current?.scrollTop || 0;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      let allowedDragX = diffX;
      if (activeTab === 0 && diffX > 0) allowedDragX = diffX / 3;
      if (activeTab === 2 && diffX < 0) allowedDragX = diffX / 3;
      setDragX(allowedDragX);
    } 
    // 👇 核心修复：将 window.scrollY 换成了局部的 scrollTop 👇
    else if (activeTab === 1 && diffY > 0 && scrollTop <= 0) {
      setPullY(Math.min(diffY / 2.5, 80)); 
    }
  };
  const handleTouchEnd = () => {
    setIsDragging(false); // 👇 核心魔法：手指松开，交还 CSS 动画权柄！

    // 判定 1：横向跃迁 (拉扯超过 60px 就判定为您想翻页)
    if (Math.abs(dragX) > 60) {
      if (dragX > 0 && activeTab > 0) {
        setActiveTab(prev => prev - 1); // 向右拉，去左边的位面
      } else if (dragX < 0 && activeTab < 2) {
        setActiveTab(prev => prev + 1); // 向左拉，去右边的位面
      }
    }
    setDragX(0); // 无论是否翻页，拉拽变量瞬间清零，让底盘自己滑动归位

    // 判定 2：纵向下拉刷新
    if (activeTab === 1 && pullY > 55) {
      setIsRefreshing(true);
      setPullY(55); 
      setTimeout(() => {
      supabase.from('scenes').select('*').limit(PAGE_SIZE)
        .then(({ data }) => {
          setItems((data || []).map(row => ({
            id: row.scene_id, name: row.name, world: row.world, description: row.description,
          })));
          setHasMore(true);
          setIsRefreshing(false);
          setPullY(0);
        });
        setHasMore(true);
        setIsRefreshing(false);
        setPullY(0); 
      }, 1000); 
    } else {
      setPullY(0);
    }
  };
return (
    /* 👇 核心魔法 1：main 被死死钉住，高度等于手机屏幕 (100dvh)，彻底掐断全局滚动 👇 */
    <main className="h-[100dvh] w-screen bg-[#f5f6f8] font-sans overflow-hidden flex flex-col">
      
      {/* 顶部苍穹导航 (作为 Flex 的头部，极其自然地永远悬浮在顶端) */}
      <header className="flex-none bg-white/95 backdrop-blur-md border-b border-gray-100 px-5 py-3.5 flex items-center z-50">
        <div className="flex-1 flex justify-start">
          <div className="text-[19px] tracking-[0.2em] text-[#4a3570] font-light">EOVO</div>
        </div>
        <div className="flex-none flex space-x-7 text-[15px]">
          {['抽卡', '发现', '坐标'].map((tabName, index) => (
            <div key={index} className="relative cursor-pointer flex flex-col items-center" onClick={() => setActiveTab(index)}>
              <span className={activeTab === index ? "text-gray-900 font-bold" : "text-gray-500"}>{tabName}</span>
              {activeTab === index && <div className="absolute -bottom-[6px] w-[14px] h-[3px] bg-[#4a3570] rounded-full transition-all"></div>}
            </div>
          ))}
        </div>
        <div className="flex-1 flex justify-end text-gray-400">
          <svg 
            onClick={() => setIsSearchOpen(true)} // ✨ 注入开启魔法
            className="w-5 h-5 cursor-pointer hover:text-[#4a3570] transition-colors" 
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </header>
      
      {/* 下拉刷新指示器 (固定在胶卷轨道上方，避免被滚动带走) */}
      <div className="absolute w-full flex justify-center items-center text-[#4a3570] text-[13px] font-medium z-0" style={{ height: '55px', top: '55px', opacity: pullY / 55 }}>
        {isRefreshing ? '星轨重构中...' : (pullY > 55 ? '松开降临新世界' : '下拉探索星海')}
      </div>

      {/* ==========================================
          滑动胶卷轨道：占据屏幕剩余的所有高度 (flex-1)
          并且将 Touch 事件只挂载在轨道上，避免干扰导航栏
          ========================================== */}
      <div 
        className="flex-1 min-h-0 w-full relative z-10 flex" 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 👇 顺手把这里的 h-full 删掉（因为父级变成 flex 后，它会自动完美撑满高度） 👇 */}
        <div 
          className={`flex w-[300vw] ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
          style={{ transform: `translateX(calc(-${activeTab * 100}vw + ${dragX}px))` }}
        >
          
          {/* 👇 核心魔法 2：三个位面各自拥有 h-full 和 overflow-y-auto，滚动彻底独立 👇 */}

          {/* 位面 0：抽卡大厅 */}
          <div className="w-[100vw] h-full overflow-y-auto shrink-0 flex flex-col items-center justify-center text-gray-400 pb-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* 👈 2. 直接将组件安放在这里！原本的占位文字被替换了 */}
            <DrawZone />
          </div>

          {/* 位面 1：发现页 (挂载探测仪 discoverScrollRef) */}
          <div 
            ref={discoverScrollRef}
            className="w-[100vw] h-full overflow-y-auto shrink-0 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="max-w-md mx-auto px-4 pt-4 relative z-10" style={{ transform: `translateY(${pullY}px)`, transition: pullY === 0 || isRefreshing ? 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'none' }}>
              {items.map((scene, index) => (
                <SceneCard 
                  key={`${scene.id}-${index}`} 
                  id={scene.id}         /* ✨ 补上这句！将真实维度的坐标系递给卡片 ✨ */
                  name={scene.name} 
                  world={scene.world} 
                  description={scene.description} 
                />
              ))}
              <div ref={loaderRef} className="py-6 flex justify-center items-center text-gray-400 text-[13px]">
                {isLoading ? <span className="flex items-center space-x-2"><svg className="animate-spin h-4 w-4 text-[#4a3570]" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>正在连接深空节点...</span></span> : !hasMore ? <span className="text-gray-300">— 宇宙边界已至 —</span> : null}
              </div>
            </div>
          </div>

          {/* 位面 2：奇物档案馆 */}
          <div className="w-[100vw] h-full overflow-y-auto shrink-0 bg-[#0a0a0f] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* 👈 核心注入：在这里降临坐标操作台 */}
            <ArchiveZone /> 
          </div>

        </div>
      </div>

      {/* 👈 核心结界：将抽屉挂载在主世界的最上层 */}
      <Suspense fallback={null}>
        <SceneDrawer />
      </Suspense>
      <SearchZone isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  );
}