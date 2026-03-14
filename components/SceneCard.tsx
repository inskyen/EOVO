"use client"; // ✨ 极其重要：因为用到了 useState 和浏览器本地存储，必须加上这句真言！

import React from 'react';
import Link from 'next/link';
import { useState, useEffect } from "react";

interface SceneCardProps {
  id: string | number; // ✨ 专属空间坐标 (用来做记忆比对的绝对核心！)
  name: string;
  world: string;
  description: string;
  tags?: string[]; // (可选) 如果卡片上需要显示标签，就留着它
}

export default function SceneCard({ id, name, world, description }: SceneCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  // 👇 ✨ 1. 升级版记忆雷达：不仅在出生时检查，更会时刻监听外面的动静
  useEffect(() => {
    const checkSavedStatus = () => {
      try {
        const savedScenes = JSON.parse(localStorage.getItem("eovo_saved_scenes") || "[]");
        setIsSaved(savedScenes.includes(id));
      } catch (e) {
        console.warn("读取星海记忆失败");
      }
    };

    checkSavedStatus(); // 首次降临时的检查

    // ✨ 核心共振魔法：监听全宇宙的记忆同步广播！只要有人喊，立刻检查自己该不该亮！
    window.addEventListener('eovo_memory_sync', checkSavedStatus);

    // 清除魔法阵，防止内存泄漏
    return () => {
      window.removeEventListener('eovo_memory_sync', checkSavedStatus);
    };
  }, [id]);

  // 👇 ✨ 2. 升级版刻录法术：卡片里的星星被点亮时，也要反向通知外面的按钮！
  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); 

    try {
      const savedScenes = JSON.parse(localStorage.getItem("eovo_saved_scenes") || "[]");
      let newSaved;

      if (isSaved) {
        newSaved = savedScenes.filter((savedId: string | number) => savedId !== id);
      } else {
        newSaved = [...savedScenes, id];
      }

      localStorage.setItem("eovo_saved_scenes", JSON.stringify(newSaved));
      setIsSaved(!isSaved); // 自身瞬间变色

      // ✨ 极其优雅的双向同步：卡片也被操作了，向全宇宙发射广播！
      window.dispatchEvent(new Event('eovo_memory_sync'));
    } catch (e) {
      console.warn("星海记忆刻录失败");
    }
  };

  return (
    <Link 
      href={`?scene=${id}`}
      scroll={false} 
      className="block group bg-white rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden mb-4 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(74,53,112,0.12)]"
    >
      
      {/* 上半部：深紫叙事块 */}
      <div className="bg-[#4a3570] px-5 py-6 relative">
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-400" />
        <p className="text-white/95 text-[15px] leading-[1.8] text-justify tracking-widest font-elegant font-light break-all relative z-10">
          「 {description} 」
        </p>
      </div>

      {/* 下半部：现世信息块 */}
      <div className="px-5 py-4">
        {/* 场景主标题：悬浮时染上我们的专属紫 */}
        <h3 className="text-gray-900 font-medium text-[16px] mb-3 transition-colors duration-300 group-hover:text-[#4a3570]">
          {name}
        </h3>
        
        {/* 底部 Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-[22px] h-[22px] rounded-full bg-gray-200 transition-colors group-hover:bg-[#4a3570]/20"></div>
            <span className="text-gray-500 text-[13px]">{world}</span>
          </div>
          
          {/* ✨ 融合魔法 3：将带有跳动阻尼的发光星星挂载到此处 */}
          <button 
            onClick={toggleSave}
            className="p-2 -mr-2 text-gray-400 hover:text-[#4a3570] transition-colors focus:outline-none relative z-20"
            aria-label="Save to Archive"
          >
            {isSaved ? (
              // 🌟 实心星星 (闪耀专属紫)
              <svg className="w-[18px] h-[18px] text-[#4a3570] scale-110 drop-shadow-[0_2px_4px_rgba(74,53,112,0.3)] transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ) : (
              // 💫 空心星星 (安静等待)
              <svg className="w-[18px] h-[18px] transition-transform duration-300 hover:scale-110" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
    </Link>
  );
}