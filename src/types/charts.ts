/**
 * Chart and data visualization types
 */

export interface DataPoint {
  date: string;
  value: number;
}

export interface ChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
}

export interface LineChartProps extends ChartProps {
  weeklyAverage?: DataPoint[];
  showGrid?: boolean;
  averageColor?: string;
}