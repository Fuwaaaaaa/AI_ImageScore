import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Criterion } from '../types';

interface CriteriaChartProps {
  data: Criterion[];
}

const CriteriaChart: React.FC<CriteriaChartProps> = ({ data }) => {
  // Normalize data naming for Recharts if needed, but strict mapping is safer
  const chartData = data.map(item => ({
    subject: item.name,
    A: item.score,
    fullMark: 100,
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#d4d4d8', fontSize: 12 }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Score"
            dataKey="A"
            stroke="#8b5cf6"
            strokeWidth={3}
            fill="#8b5cf6"
            fillOpacity={0.3}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', color: '#f4f4f5' }}
            itemStyle={{ color: '#a78bfa' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CriteriaChart;