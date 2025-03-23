import React from "react";
import { LineChart } from '@mui/x-charts/LineChart';

const Graph = ({ data }) => {
  // Convert JSON data to chart format
  const prepareChartData = (data) => {
    if (!data) return { xData: [], yData: [] };

    // If data is an array, use indices as x-axis
    if (Array.isArray(data)) {
      return {
        xData: data.map((_, index) => index),
        yData: data.map(item => typeof item === 'number' ? item : 0)
      };
    }

    // If data is an object, use keys as x-axis
    const entries = Object.entries(data);
    return {
      xData: entries.map((_, index) => index),
      yData: entries.map(([_, value]) => typeof value === 'number' ? value : 0)
    };
  };

  const { xData, yData } = prepareChartData(data);

  return (
    <div>
      <LineChart
        xAxis={[{ data: xData }]}
        series={[
          {
            data: yData,
            label: 'Data Points'
          },
        ]}
        width={800}
        height={400}
      />
    </div>
  );
};

export default Graph;
