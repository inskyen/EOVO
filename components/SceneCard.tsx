import React from 'react';
import Link from 'next/link';

interface SceneCardProps {
  id: string | number; // ✨ 专属空间坐标
  name: string;
  world: string;
  description: string;
}

export default function SceneCard({ id, name, world, description }: SceneCardProps) {
  return (
    /* ✨ 核心结界重构：
       1. href 变更为 `?scene=${id}` 召唤抽屉
       2. 加入 scroll={false} 阻止自动滚回顶部
    */
    <Link 
      href={`?scene=${id}`}
      scroll={false} 
      className="block group bg-white rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden mb-4 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(74,53,112,0.12)]"
    >
      
      {/* 上半部：深紫叙事块 */}
      <div className="bg-[#4a3570] px-5 py-6 relative">
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-400" />
        {/* ✨ 注入魔法：使用 font-elegant，并加上 leading-[1.8] 和 tracking-widest */}
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
            {/* 极简灰底头像 */}
            <div className="w-[22px] h-[22px] rounded-full bg-gray-200 transition-colors group-hover:bg-[#4a3570]/20"></div>
            {/* 世界归属 */}
            <span className="text-gray-500 text-[13px]">{world}</span>
          </div>
          
          {/* 收藏星标：事件拦截结界依然生效 */}
          <button 
            onClick={(e) => {
              e.preventDefault(); 
              // TODO: 存入 entp.cn 星图的魔法
              console.log(`已将坐标 ${id} 加入观测星图`); 
            }}
            className="text-gray-400 hover:text-[#4a3570] transition-colors focus:outline-none relative z-20"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>
      </div>
      
    </Link>
  );
}