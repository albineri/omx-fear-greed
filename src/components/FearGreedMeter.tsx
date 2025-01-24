'use client';

import { useEffect, useState } from "react";
import { IndexData, SentimentLevel } from "@/src/types";

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
 const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
 return {
   x: cx + (radius * Math.cos(angleInRadians)),
   y: cy + (radius * Math.sin(angleInRadians)),
 };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
 const start = polarToCartesian(x, y, radius, endAngle);
 const end = polarToCartesian(x, y, radius, startAngle);
 const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
 return [
   "M", start.x, start.y,
   "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
 ].join(" ");
}

export function FearGreedMeter() {
 const [data, setData] = useState<IndexData | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 const width = 300;
 const height = 200;
 const cx = width / 2;
 const cy = height - 20;
 const radius = 120;

 const getSentimentColor = (value: number): string => {
   if (value <= 20) return "#c52828";
   if (value <= 40) return "#e06c6c";
   if (value <= 60) return "#f7c325";
   if (value <= 80) return "#72cc54";
   return "#2aad27";
 };

 const getSentimentLabel = (value: number): SentimentLevel => {
   if (value <= 20) return "Extrem Rädsla";
   if (value <= 40) return "Rädsla";
   if (value <= 60) return "Neutral";
   if (value <= 80) return "Girighet";
   return "Extrem Girighet";
 };

 useEffect(() => {
   const fetchData = async () => {
     try {
       setLoading(true);
       const response = await fetch('/api/index');
       if (!response.ok) throw new Error('Failed to fetch data');
       const json = await response.json();
       setData(json);
     } catch {
       setError('Could not load market data');
     } finally {
       setLoading(false);
     }
   };

   fetchData();
   const interval = setInterval(fetchData, 5 * 60 * 1000);
   return () => clearInterval(interval);
 }, []);

 if (loading) return <div>Loading...</div>;
 if (error) return <div>{error}</div>;
 if (!data) return null;

 const index = Math.max(0, Math.min(100, data.currentIndex));
 const sentimentColor = getSentimentColor(index);
 const sentimentLabel = getSentimentLabel(index);
 const angle = 180 + (index * 180 / 100);

 const historicalData = [
   { label: 'Previous close', value: 28, sentiment: 'Fear' },
   { label: '1 week ago', value: 26, sentiment: 'Fear' },
   { label: '1 month ago', value: 50, sentiment: 'Neutral' },
   { label: '1 year ago', value: 57, sentiment: 'Greed' }
 ];

 return (
   <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
     <div style={{ 
       display: 'flex',
       gap: '40px',
       marginBottom: '40px'
     }}>
       <div style={{ flex: '1' }}>
         <div style={{ textAlign: 'center', marginBottom: '20px' }}>
           <div style={{ 
             fontSize: '64px', 
             fontWeight: 'bold',
             color: sentimentColor,
             lineHeight: '1'
           }}>
             {Math.round(index)}
           </div>
           <div style={{ 
             fontSize: '28px',
             color: sentimentColor,
             marginTop: '5px'
           }}>
             {sentimentLabel}
           </div>
         </div>

         <svg width={width} height={height} style={{ display: 'block', margin: '0 auto' }}>
           <defs>
             <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
               <stop offset="0%" style={{ stopColor: '#c52828' }} />
               <stop offset="25%" style={{ stopColor: '#e06c6c' }} />
               <stop offset="50%" style={{ stopColor: '#f7c325' }} />
               <stop offset="75%" style={{ stopColor: '#72cc54' }} />
               <stop offset="100%" style={{ stopColor: '#2aad27' }} />
             </linearGradient>
           </defs>
           
           <path
             d={describeArc(cx, cy, radius, 0, 180)}
             fill="none"
             stroke="url(#gauge-gradient)"
             strokeWidth="25"
             strokeLinecap="round"
           />

           {[0, 25, 50, 75, 100].map((tick) => {
             const tickAngle = (tick * 180 / 100);
             const tickStart = polarToCartesian(cx, cy, radius - 15, tickAngle);
             const tickEnd = polarToCartesian(cx, cy, radius + 15, tickAngle);
             return (
               <g key={tick}>
                 <line
                   x1={tickStart.x}
                   y1={tickStart.y}
                   x2={tickEnd.x}
                   y2={tickEnd.y}
                   stroke="#666"
                   strokeWidth="2"
                 />
                 <text
                   x={tickEnd.x}
                   y={tickEnd.y + 20}
                   textAnchor="middle"
                   fill="#666"
                   fontSize="12"
                 >
                   {tick}
                 </text>
               </g>
             );
           })}

           <text x={50} y={height - 30} fill="#666" fontSize="10" textAnchor="start">
             Extrem Rädsla
           </text>
           <text x={width - 50} y={height - 30} fill="#666" fontSize="10" textAnchor="end">
             Extrem Girighet
           </text>

           <line
             x1={cx}
             y1={cy}
             x2={cx + radius * Math.cos((angle) * Math.PI / 180)}
             y2={cy + radius * Math.sin((angle) * Math.PI / 180)}
             stroke="black"
             strokeWidth="4"
             strokeLinecap="round"
           />
           
           <circle cx={cx} cy={cy} r="5" fill="black" />
         </svg>

         <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
           Senast Uppdaterad: {new Date(data.timestamp).toLocaleString('sv-SE')}
         </div>
       </div>

       <div style={{ 
         flex: '1',
         borderLeft: '1px solid #eee',
         paddingLeft: '40px',
         display: 'flex',
         flexDirection: 'column',
         gap: '20px'
       }}>
         {historicalData.map((item, index) => (
           <div key={index} style={{
             display: 'flex',
             justifyContent: 'space-between',
             alignItems: 'center',
             padding: '10px 0'
           }}>
             <div>
               <div style={{ color: '#666', fontSize: '14px' }}>{item.label}</div>
               <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{item.sentiment}</div>
             </div>
             <div style={{
               width: '40px',
               height: '40px',
               borderRadius: '50%',
               border: `2px solid ${getSentimentColor(item.value)}`,
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               fontWeight: 'bold'
             }}>
               {item.value}
             </div>
           </div>
         ))}
       </div>
     </div>

     <div style={{ 
       backgroundColor: 'white',
       padding: '30px',
       borderRadius: '12px',
       boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
     }}>
       <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
         Hur beräknas indexet?
       </h2>

       <div style={{ display: 'grid', gap: '24px' }}>
         <div>
           <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#2a2a2a' }}>
             Primära Marknadsindikatorer (50%)
           </h3>
           <div style={{ display: 'grid', gap: '16px' }}>
             <div>
               <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                 Marknadsmomentum (25%)
               </div>
               <div style={{ color: '#666' }}>
                 Jämför OMX-index mot dess 125-dagars glidande medelvärde för att identifiera långsiktiga trender.
               </div>
             </div>
             <div>
               <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                 Marknadsvolatilitet (25%)
               </div>
               <div style={{ color: '#666' }}>
                 Mäter den aktuella volatiliteten jämfört med genomsnittet.
               </div>
             </div>
           </div>
         </div>

         <div>
           <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#2a2a2a' }}>
             Tekniska Indikatorer (30%)
           </h3>
           <div style={{ display: 'grid', gap: '16px' }}>
             <div>
               <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                 Marknadens Bredd (10%)
               </div>
               <div style={{ color: '#666' }}>
                 Granskar prisutveckling över flera tidsperioder.
               </div>
             </div>
             <div>
               <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                 Prisstyrka (10%)
               </div>
               <div style={{ color: '#666' }}>
                 Använder relativ styrkeindex (RSI).
               </div>
             </div>
             <div>
               <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                 Handelsvolym (10%)
               </div>
               <div style={{ color: '#666' }}>
                 Jämför dagens handelsvolym med 20-dagars genomsnittet.
               </div>
             </div>
           </div>
         </div>

         <div>
           <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#2a2a2a' }}>
             Marknadssentiment (20%)
           </h3>
           <div style={{ display: 'grid', gap: '16px' }}>
             <div>
               <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                 Säkra Tillgångar (10%)
               </div>
               <div style={{ color: '#666' }}>
                 Analyserar flöden mellan aktier och säkrare placeringar.
               </div>
             </div>
             <div>
               <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                 Högriskinvesteringar (10%)
               </div>
               <div style={{ color: '#666' }}>
                 Bedömer riskaptiten genom att studera högavkastande företagsobligationer.
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>
   </div>
 );
}