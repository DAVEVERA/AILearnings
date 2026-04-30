import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  PieChart as ChartIcon, Image as ImageIcon, Video as VideoIcon, 
  ClipboardList as TutorialIcon, Info, Layout, Check, Award
} from 'lucide-react';
import { cn } from '../lib/utils';

interface VisualRendererProps {
  type: 'chart' | 'infographic' | 'image' | 'video' | 'tutorial';
  data?: any;
}

export default function VisualRenderer({ type, data }: VisualRendererProps) {
  // Mock data if none provided
  const chartData = data?.chartData || [
    { name: 'Baseline', val: 20 },
    { name: 'AI Integration', val: 65 },
    { name: 'Optimization', val: 85 },
    { name: 'Full Autonomy', val: 100 },
  ];

  switch (type) {
    case 'chart':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100">
          <div className="w-full h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} 
                    dy={10}
                  />
                  <YAxis hide />
                  <ReTooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="val" fill="#000" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      );

    case 'infographic':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <div className="grid grid-cols-2 gap-4 w-full max-w-[450px]">
            {['LOGIC', 'SCALE', 'LATENCY', 'PRECISION'].map((label, i) => (
              <div key={i} className="p-6 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center gap-4 group">
                <div className="w-12 h-12 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-300 group-hover:bg-black group-hover:text-white transition-all">
                   {i === 0 ? <Layout size={20} /> : i === 1 ? <Info size={20} /> : i === 2 ? <ChartIcon size={20} /> : <TutorialIcon size={20} />}
                </div>
                <div className="space-y-2 text-center">
                  <h4 className="text-[10px] font-bold text-black uppercase tracking-widest">{label}</h4>
                  <div className="h-1 w-16 bg-gray-200 rounded-full overflow-hidden mx-auto">
                    <div className={cn("h-full bg-black transition-all duration-1000", i === 0 ? "w-[80%]" : i === 1 ? "w-[45%]" : "w-[60%]")} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'image':
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gray-50 rounded-[2rem] border border-gray-100 group">
          <img 
            src={`https://picsum.photos/seed/${data?.seed || 'ai-vision'}/1200/800`} 
            alt="Content"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-1000"
            referrerPolicy="no-referrer"
          />
        </div>
      );

    case 'video':
      const videoSrc = data?.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-details-4432-large.mp4';
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black rounded-[2rem] group border border-gray-200">
          <video 
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
            <p className="text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <VideoIcon size={14} fill="currentColor" /> Live Demonstratie
            </p>
          </div>
        </div>
      );

    case 'tutorial':
      return (
        <div className="w-full h-full flex flex-col p-8 text-left max-w-xl mx-auto space-y-8">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-6 items-start p-6 bg-gray-50 border border-gray-100 rounded-xl hover:border-black transition-all group">
                 <div className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center shrink-0 font-bold text-sm text-gray-300 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all">
                   0{i}
                 </div>
                 <div className="space-y-2 pt-1 flex-1">
                   <div className="h-2 w-1/3 bg-gray-200 rounded-full"></div>
                   <div className="h-1.5 w-full bg-gray-100 rounded-full"></div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}
