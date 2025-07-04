import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const HandshakeChart = ({ data }) => {
  const aggregatedData = data.reduce((acc, curr) => {
    const existing = acc.find(item => item.time === curr.time);
    if (existing) {
      existing.count += curr.count;
    } else {
      acc.push({ ...curr });
    }
    return acc;
  }, []).slice(-30);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={aggregatedData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorHandshakes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00ff00" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#00ff00" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 255, 0.1)" />
        <XAxis dataKey="time" stroke="rgba(0, 255, 255, 0.5)" tick={{ fill: '#00ffff', fontSize: 12 }} />
        <YAxis stroke="rgba(0, 255, 255, 0.5)" tick={{ fill: '#00ffff', fontSize: 12 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderColor: 'rgba(0, 255, 255, 0.5)',
            color: '#00ffff',
            fontFamily: 'Orbitron, monospace',
          }}
          labelStyle={{ color: '#ffffff' }}
        />
        <Area type="monotone" dataKey="count" stroke="#00ff00" fillOpacity={1} fill="url(#colorHandshakes)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default HandshakeChart;