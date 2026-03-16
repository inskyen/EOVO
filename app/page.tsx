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
  const [showBackToTop, setShowBackToTop] = useState(false); // 🚀 回顶电梯的显形开关

  // ==========================================
  // 3. 物理触摸引擎状态
  // ==========================================
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false); // 🔒 防止阿澈滑得太快，深空请求撞车
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
  // 🔮 终极混排法术：[ 最新降临 5 ] 与 [ 混沌盲盒 15 ] 的完美交织与去重
  const fetchAndShufflePool = async () => {
    setIsRefreshing(true);

    // ✨ 动作一：向深空索取最新降临的 5 块碎片
    const { data: latestData, error: latestError } = await supabase
      .from('scenes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // 🎯 极其致命的填补：把刚出炉的最新 5 张的 ID 收集起来，作为第一批黑名单！
    // 这样既消灭了 NULL 报错，又绝对保证了后续的盲盒不会和最新牌重复！
    const latestIds = (latestData || []).map((item: any) => item.scene_id);

    // ✨ 动作二：带着这 5 个人的黑名单，去抓取 15 个混沌盲盒
    const { data: randomData, error: randomError } = await supabase
      .rpc('get_random_scenes', { 
        limit_num: 15,
        exclude_ids: latestIds // 🎯 完美衔接！把最新的 5 个排除掉！
      });

    // ✨ 动作三：在前端的暗箱里揉碎混合
    let combinedPool = [];
    if (!latestError && latestData) combinedPool.push(...latestData);
    if (!randomError && randomData) combinedPool.push(...randomData);

    if (combinedPool.length > 0) {
      // 极其彻底的打散，不让访客发现前 5 张永远是新的
      const finalShuffled = shuffleArray(combinedPool); 
      
      const mapped = finalShuffled.map((row: any) => ({
        id: row.scene_id,
        name: row.name,
        world: row.world,
        description: row.description,
      }));
      
      setMasterPool(mapped); // 锁入终极底牌池
      setItems(mapped.slice(0, PAGE_SIZE)); // 发出第一轮的 5 张牌
      setCurrentPage(1);
      setHasMore(mapped.length > PAGE_SIZE);
    } else {
      console.error("深空盲盒捞取失败", { latestError, randomError });
    }
    
    setIsRefreshing(false);
    setPullY(0); // 轨道复位
  };

  // 🚀 触底深潜法术：带着黑名单去捞 8 个新盲盒
  const fetchMoreScenes = async () => {
    if (isLoadingMore || !hasMore) return; 
    setIsLoadingMore(true);

    // 🎯 极其致命的拦截：把屏幕上已经有的卡片 ID 全都收集起来！
    const seenIds = items.map(item => item.id);

    // 带着黑名单，去敲数据库的大门
    const { data, error } = await supabase.rpc('get_random_scenes', { 
      limit_num: 8, 
      exclude_ids: seenIds 
    });

    if (!error && data && data.length > 0) {
      const mapped = data.map((row: any) => ({
        id: row.scene_id,
        name: row.name,
        world: row.world,
        description: row.description,
      }));
      
      // 极其丝滑地无缝拼接到现有列表的尾部
      setItems(prev => [...prev, ...mapped]);
      
      // 如果深空大叔连 8 张都掏不出来了，说明真的被掏空了，宣告到达宇宙边界
      if (data.length < 8) {
        setHasMore(false);
      }
    } else {
      setHasMore(false); // 没捞到，也宣告到底
    }
    
    setIsLoadingMore(false);
  };

  // 🚀 首次降临：页面一加载就执行一次洗牌
  useEffect(() => {
    fetchAndShufflePool();
  }, []);

  // 🃏 物理触底引擎
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    
    // 👇 ✨ 新增：雷达探测深度，超过 800px 召唤悬浮电梯
    if (scrollTop > 800) {
      setShowBackToTop(true);
    } else {
      setShowBackToTop(false);
    }

    // 距离底部还剩 200px 时，提前发牌制造无缝感
    if (scrollHeight - scrollTop - clientHeight < 200) {
      if (hasMore && !isRefreshing && !isLoadingMore) {
        fetchMoreScenes(); 
      }
    }
  };
  // 🚀 一键穿云：极其丝滑地回到海面
  const scrollToTop = () => {
    if (discoverScrollRef.current) {
      discoverScrollRef.current.scrollTo({
        top: 0,
        behavior: 'smooth' // ✨ 极其关键：一定要平滑滚动，不能干瘪瘪地闪现
      });
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

    // 👇 ✨ 终极黑魔法：1px 欺骗战术 ✨ 👇
    // 只要是在发现页，且手指按下的瞬间发现它停在绝对顶部 (0)
    if (activeTab === 1 && discoverScrollRef.current) {
      if (discoverScrollRef.current.scrollTop <= 0) {
        // 悄悄把它往下推一点点 (1px 即可破局，肉眼完全看不见，却能完美骗过浏览器)
        discoverScrollRef.current.scrollTop = 1; 
      }
    }
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
      <div 
        className="absolute w-full flex justify-center items-center text-[#4a3570] text-[13px] font-medium z-0 will-change-transform" 
        style={{ 
          height: '55px', 
          top: '55px', 
          opacity: pullY / 55,
          transform: `translate3d(0, 0, 0) scale(${0.85 + (pullY / 55) * 0.15})`, // ✨ 极其优雅的呼吸缩放感
          transition: isDragging ? 'none' : 'all 0.3s ease-out'
        }}
      >
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
            // 👇 ✨ 核心防御：加上 overscroll-y-none，彻底掐断浏览器的原生下拉刷新！
            className="w-[100vw] h-full overflow-y-auto overscroll-y-none shrink-0 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {/* 👇 ✨ 核心丝滑改造：启用 GPU 加速，并在手指拖拽时绝对禁止 CSS 动画干扰 ✨ 👇 */}
            <div 
              className="max-w-md mx-auto px-4 pt-4 relative z-10 will-change-transform" 
              style={{ 
                transform: `translate3d(0, ${pullY}px, 0)`, // 🚀 终极魔法：强行唤醒手机 GPU 硬件加速
                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' // 🛑 极其霸道的结界：手指按在屏幕上时，绝对不允许任何阻尼动画！
              }}
            >
              
              {/* ✨ 极其优雅的降维打击：如果还没拿到牌，就展示呼吸骨架屏 ✨ */}
              {items.length === 0 ? (
                <div className="w-full flex flex-col space-y-4 animate-pulse">
                  {[1, 2, 3].map((skeletonId) => (
                    <div key={skeletonId} className="bg-white rounded-[20px] overflow-hidden shadow-sm">
                      {/* 骨架：顶部的深色引言区 (用极浅的紫色代替) */}
                      <div className="bg-[#f0edf5] h-32 w-full"></div>
                      {/* 骨架：底部的标题与作者区 */}
                      <div className="p-4 flex flex-col space-y-3">
                        <div className="h-5 bg-gray-100 rounded w-1/3"></div>
                        <div className="flex justify-between items-center pt-2">
                           <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gray-100 rounded-full"></div>
                              <div className="h-4 bg-gray-100 rounded w-16"></div>
                           </div>
                           <div className="w-5 h-5 bg-gray-100 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* ✨ 真实的星轨碎片降临 ✨ */
                items.map((scene, index) => (
                  <SceneCard 
                    key={`${scene.id}-${index}`} 
                    id={scene.id}         
                    name={scene.name} 
                    world={scene.world} 
                    description={scene.description} 
                  />
                ))
              )}

              {/* 极其优雅的底部边界提示 (因为本地发牌光速完成，所以不需要 loading 圈了) */}
              <div className="py-8 flex justify-center items-center text-gray-400 text-[13px]">
                {!hasMore ? (
                  <span className="text-gray-300 tracking-widest opacity-80">— 边界已至 —</span>
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
      {/* ✨ 悬浮星际电梯 (Back to Top) ✨ */}
      <div 
        className={`fixed right-6 bottom-24 z-50 transition-all duration-500 ease-in-out ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <button 
          onClick={scrollToTop}
          className="w-12 h-12 bg-white/90 backdrop-blur-md border border-gray-100 shadow-lg rounded-full flex items-center justify-center text-[#4a3570] hover:bg-[#4a3570] hover:text-white transition-colors group"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </main>
  );
}