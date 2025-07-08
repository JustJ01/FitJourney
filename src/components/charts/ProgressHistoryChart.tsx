
"use client";

import type { ProgressEntry } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProgressHistoryChartProps {
  data: ProgressEntry[];
  metric: 'weight' | 'reps' | 'duration';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-background border rounded-md shadow-lg text-sm">
        <p className="font-bold">{`Date: ${format(new Date(label), 'MMM d, yyyy')}`}</p>
        {data.weight && <p>{`Weight: ${data.weight} kg`}</p>}
        {data.reps && <p>{`Reps: ${data.reps}`}</p>}
        {data.duration && <p>{`Duration: ${data.duration} min`}</p>}
        {data.notes && <p className="italic text-muted-foreground">{`Notes: ${data.notes}`}</p>}
      </div>
    );
  }
  return null;
};

export const ProgressHistoryChart: React.FC<ProgressHistoryChartProps> = ({ data, metric }) => {
  if (data.length < 2) {
    return (
        <div className="flex items-center justify-center h-64 text-muted-foreground text-center">
            <p>Log at least two sessions to see a progress chart.</p>
        </div>
    );
  }

  const chartData = data.map(entry => ({
    ...entry,
    date: new Date(entry.date).getTime(), 
    value: entry[metric] || 0
  }));

  return (
    <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart
            data={chartData}
            margin={{
            top: 5,
            right: 30,
            left: 0,
            bottom: 5,
            }}
        >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
                dataKey="date"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(unixTime) => format(new Date(unixTime), 'MMM d')}
                scale="time"
                tick={{ fontSize: 12 }}
            />
            <YAxis 
                yAxisId="left" 
                label={{ value: metric.charAt(0).toUpperCase() + metric.slice(1), angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle' }}}
                tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{fontSize: "14px"}}/>
            <Line
                yAxisId="left"
                type="monotone"
                dataKey="value"
                name={metric.charAt(0).toUpperCase() + metric.slice(1)}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                activeDot={{ r: 8 }}
                dot={{ r: 4 }}
            />
        </LineChart>
        </ResponsiveContainer>
    </div>
  );
};
