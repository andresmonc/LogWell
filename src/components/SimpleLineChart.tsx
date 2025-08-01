import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface DataPoint {
  date: string;
  value: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  weeklyAverage?: DataPoint[];
  height?: number;
  showGrid?: boolean;
  color?: string;
  averageColor?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export default function SimpleLineChart({
  data,
  weeklyAverage = [],
  height = 200,
  showGrid = true,
  color,
  averageColor,
}: SimpleLineChartProps) {
  const theme = useTheme();
  
  const chartColor = color || theme.colors.primary;
  const avgColor = averageColor || theme.colors.tertiary;
  
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text variant="bodyMedium" style={styles.noDataText}>
          No data available
        </Text>
      </View>
    );
  }

  const chartWidth = screenWidth - 120; // Account for padding and y-axis labels
  const chartHeight = height - 40; // Account for labels
  
  // Find min/max values for scaling
  const allValues = [...data.map(d => d.value), ...weeklyAverage.map(d => d.value)];
  let maxValue = allValues.length > 0 ? Math.max(...allValues) : 0;
  let minValue = allValues.length > 0 ? Math.min(...allValues, 0) : 0;
  
  // Handle edge cases for better y-axis scaling
  if (maxValue === minValue) {
    if (maxValue === 0) {
      // All values are 0, show a reasonable scale for calories
      maxValue = 2500;
      minValue = 0;
    } else {
      // All values are the same non-zero value, add some padding
      const padding = Math.abs(maxValue) * 0.2;
      maxValue = maxValue + padding;
      minValue = Math.max(0, minValue - padding);
    }
  } else {
    // Add some padding to the top for better visualization
    const padding = (maxValue - minValue) * 0.1;
    maxValue = maxValue + padding;
  }
  
  const valueRange = maxValue - minValue;

  // Y-axis labels - create evenly spaced labels from minValue to maxValue
  const yLabels = [];
  const numberOfLabels = 4;
  for (let i = 0; i <= numberOfLabels; i++) {
    const value = minValue + (i / numberOfLabels) * valueRange;
    const y = chartHeight - (i / numberOfLabels) * chartHeight; // Invert y for proper positioning
    yLabels.push(
      <Text
        key={`label-${i}`}
        variant="bodySmall"
        style={[
          styles.yLabel,
          { 
            top: y - 8,
            color: theme.colors.onSurfaceVariant,
          }
        ]}
      >
        {Math.round(value)}
      </Text>
    );
  }

  // Create bar chart instead of line chart for simplicity
  const bars = data.map((point, index) => {
    const barWidth = Math.max(8, Math.min(40, (chartWidth / data.length) - 4));
    // Handle single data point case
    const x = data.length === 1 
      ? chartWidth / 2 
      : (index + 0.5) * (chartWidth / data.length); // Center bars in their allocated space
    const barHeight = ((point.value - minValue) / valueRange) * chartHeight;
    const y = chartHeight - barHeight;

    return (
      <View
        key={index}
        style={[
          styles.bar,
          {
            left: x - barWidth / 2,
            bottom: 0,
            width: barWidth,
            height: barHeight,
            backgroundColor: chartColor,
          }
        ]}
      />
    );
  });

  // Average line - create connected line segments
  const averageLineElements = [];
  if (weeklyAverage.length > 0) {
    // Map each weekly average point to its corresponding position in the daily data
    const linePoints = weeklyAverage.map(avgPoint => {
      // Find the index of this date in the daily data
      const dataIndex = data.findIndex(d => d.date === avgPoint.date);
      if (dataIndex === -1) return null;
      
      // Use the same x positioning as the bars
      const x = data.length === 1 
        ? chartWidth / 2 
        : (dataIndex + 0.5) * (chartWidth / data.length);
      const y = chartHeight - ((avgPoint.value - minValue) / valueRange) * chartHeight;
      
      return { x, y, date: avgPoint.date, value: avgPoint.value };
    }).filter(point => point !== null);
    
    // Create line segments between consecutive points
    for (let i = 0; i < linePoints.length - 1; i++) {
      const point1 = linePoints[i];
      const point2 = linePoints[i + 1];
      
      // Check if points are consecutive days (allowing for some gaps)
      const date1 = new Date(point1.date);
      const date2 = new Date(point2.date);
      const dayDiff = Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24);
      
      // Only draw line segment if points are within 7 days of each other
      if (dayDiff <= 7) {
        const x1 = point1.x;
        const y1 = point1.y;
        const x2 = point2.x;
        const y2 = point2.y;
        
        // Calculate line properties
        const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const lineAngle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
        
        averageLineElements.push(
          <View
            key={`line-${i}`}
            style={[
              {
                position: 'absolute',
                left: x1,
                top: y1, // Use top instead of bottom
                width: lineLength,
                height: 3,
                backgroundColor: avgColor,
                transformOrigin: '0 50%',
                transform: [{ rotate: `${lineAngle}deg` }],
              }
            ]}
          />
        );
      }
    }
    
    // Add points at each data point
    linePoints.forEach((point, index) => {
      averageLineElements.push(
        <View
          key={`point-${index}`}
          style={[
            styles.averagePoint,
            {
              left: point.x - 3,
              top: point.y - 3, // Use top instead of bottom
              backgroundColor: avgColor,
            }
          ]}
        />
      );
    });
  } else if (weeklyAverage.length === 1) {
    // Single point - find its position in the daily data
    const point = weeklyAverage[0];
    const dataIndex = data.findIndex(d => d.date === point.date);
    
    if (dataIndex !== -1) {
      const x = data.length === 1 
        ? chartWidth / 2 
        : (dataIndex + 0.5) * (chartWidth / data.length);
      const y = chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
      
      averageLineElements.push(
        <View
          key="single-point"
          style={[
            styles.averagePoint,
            {
              left: x - 3,
              top: y - 3, // Use top instead of bottom
              backgroundColor: avgColor,
            }
          ]}
        />
      );
    }
  }

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.chartContainer}>
        <View style={styles.yAxisLabels}>
          {yLabels}
        </View>
        <View style={[styles.chartArea, { width: chartWidth, height: chartHeight }]}>
          {/* Grid lines */}
          {showGrid && (
            <>
              {Array.from({ length: 5 }, (_, i) => (
                <View
                  key={`grid-${i}`}
                  style={[
                    styles.gridLine,
                    {
                      top: chartHeight - (i / 4) * chartHeight, // Invert to match y-axis labels
                      backgroundColor: theme.colors.outline,
                    }
                  ]}
                />
              ))}
            </>
          )}
          
          {/* Data bars */}
          {bars}
          
          {/* Average line */}
          {averageLineElements}
        </View>
      </View>
      
      {/* X-axis separator line */}
      <View style={[styles.xAxisSeparator, { backgroundColor: theme.colors.outline }]} />
      
      <View style={styles.xAxisLabels}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {data.length > 0 && new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {data.length > 0 && new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  yAxisLabels: {
    width: 50,
    position: 'relative',
  },
  yLabel: {
    position: 'absolute',
    textAlign: 'right',
    width: 45,
  },
  chartArea: {
    position: 'relative',
    marginLeft: 10,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.5,
    opacity: 0.2,
  },
  bar: {
    position: 'absolute',
    borderRadius: 2,
    opacity: 0.8,
  },
  averagePoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  averageLine: {
    position: 'absolute',
    height: 3,
    opacity: 1.0,
    borderRadius: 1.5,
  },
  xAxisSeparator: {
    height: 0.5,
    marginLeft: 60, // Match y-axis labels width + margin
    marginTop: 50,
    opacity: 0.0,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 90,
    marginLeft: 60, // Match y-axis labels width + margin
    marginRight: 10,
  },
  noDataText: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 80,
  },
});