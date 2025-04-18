import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  SubTitle,
  TimeScale,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import annotationPlugin from "chartjs-plugin-annotation";
import "chartjs-adapter-date-fns";
import { secondsToHumanReadable } from "./timeUtils";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  SubTitle,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  zoomPlugin,
  annotationPlugin
);

export const createGradient = (ctx, area, colorStart, colorEnd) => {
  const gradient = ctx.createLinearGradient(0, area.bottom, 0, area.top);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  return gradient;
};

export const hexToRgba = (hexColor, opacity = 1) => {
  if (!hexColor) return "rgba(0, 0, 0, 1)";

  // For decimal color values
  if (typeof hexColor === "number") {
    const r = (hexColor >> 16) & 255;
    const g = (hexColor >> 8) & 255;
    const b = hexColor & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // For hex color strings
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const createChartOptions = ({
  pointRadiusArray,
  formatDate,
  annotations,
}) => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    tooltip: {
      mode: "index",
      intersect: false,
      callbacks: {
        title: function (context) {
          const index = context[0].dataIndex;
          if (pointRadiusArray[index] > 0) {
            return `Time ${secondsToHumanReadable(index)} - Note Available`;
          }
          return `Time ${secondsToHumanReadable(index)}`;
        },
        afterLabel: function (context) {
          const index = context.dataIndex;
          const dataset = context.dataset.data;

          if (index > 0) {
            const change = dataset[index] - dataset[index - 1];
            const percentChange = ((change / dataset[index - 1]) * 100).toFixed(1);
            return `Change: ${change.toFixed(2)} (${percentChange}%)`;
          }
          return "";
        },
      },
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      titleColor: "white",
      bodyColor: "white",
      borderColor: "rgba(75, 192, 192, 0.8)",
      borderWidth: 1,
      padding: 10,
      bodyFont: {
        size: 13,
      },
      titleFont: {
        size: 14,
        weight: "bold",
      },
      boxPadding: 5,
      usePointStyle: true,
    },
    legend: {
      position: "top",
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: 13,
        },
      },
    },
    zoom: {
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true,
        },
        mode: "xy",
        scaleMode: "xy",
        overScaleMode: "y",
      },
      pan: {
        enabled: true,
        mode: "xy",
        scaleMode: "xy",
      },
      limits: {
        x: { min: "original", max: "original" },
        y: { min: "original", max: "original", minRange: 1 },
      },
    },
    title: {
      display: true,
      text: "Pressure Monitoring",
      font: {
        size: 18,
        weight: "bold",
      },
      padding: {
        top: 10,
        bottom: 10,
      },
    },
    subtitle: {
      display: true,
      text: `Test Date: ${formatDate}`,
      padding: {
        bottom: 20,
      },
    },
    annotation: {
      annotations,
    },
    crosshair: {
      line: {
        color: "rgba(0, 0, 0, 0.3)",
        width: 1,
        dashPattern: [5, 5],
      },
      sync: {
        enabled: true,
        group: 1,
      },
      zoom: {
        enabled: true,
      },
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: "Time",
        font: {
          size: 14,
          weight: "bold",
        },
        padding: { top: 10, bottom: 0 },
      },
      grid: {
        display: true,
        color: "rgba(0, 0, 0, 0.05)",
        drawBorder: true,
        borderDash: [5, 5],
      },
      ticks: {
        callback: function (value) {
          if (value % 2 === 0 || value === 1) {
            return secondsToHumanReadable(value);
          }
          return "";
        },
        maxRotation: 0,
        padding: 5,
      },
    },
    y: {
      title: {
        display: true,
        text: "Pressure",
        font: {
          size: 14,
          weight: "bold",
        },
        padding: { top: 0, bottom: 10 },
      },
      beginAtZero: true,
      grid: {
        color: "rgba(0, 0, 0, 0.05)",
        drawBorder: true,
        borderDash: [5, 5],
      },
      ticks: {
        padding: 5,
      },
    },
  },
  elements: {
    point: {
      radius: 0,
      hitRadius: 10,
    },
    line: {
      cubicInterpolationMode: "monotone",
    },
  },
  animation: {
    duration: 1000,
    easing: "easeOutQuart",
  },
  transitions: {
    zoom: {
      animation: {
        duration: 500,
      },
    },
  },
});

export const calculateStats = (dataPoints) => {
  if (!dataPoints || dataPoints.length === 0) return {};

  const sum = dataPoints.reduce((a, b) => a + b, 0);
  const avg = sum / dataPoints.length;
  const sortedPoints = [...dataPoints].sort((a, b) => a - b);
  const median = sortedPoints[Math.floor(dataPoints.length / 2)];
  const min = Math.min(...dataPoints);
  const max = Math.max(...dataPoints);

  // Calculate standard deviation
  const squareDiffs = dataPoints.map((value) => {
    const diff = value - avg;
    return diff * diff;
  });
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  // Calculate rates of change (trend)
  const rateOfChange = [];
  for (let i = 1; i < dataPoints.length; i++) {
    rateOfChange.push(dataPoints[i] - dataPoints[i - 1]);
  }

  const avgRateOfChange = rateOfChange.reduce((a, b) => a + b, 0) / rateOfChange.length;

  // Identify anomalies (values outside 2 standard deviations)
  const anomalies = dataPoints
    .map((point, index) => {
      return Math.abs(point - avg) > 2 * stdDev ? index : -1;
    })
    .filter((index) => index !== -1);

  return {
    mean: avg.toFixed(2),
    median: median.toFixed(2),
    min: min.toFixed(2),
    max: max.toFixed(2),
    stdDev: stdDev.toFixed(2),
    avgRateOfChange: avgRateOfChange.toFixed(2),
    anomalies,
  };
};