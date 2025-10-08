"use client";

import { useState, useEffect } from "react";

interface SteamFlowData {
  steamph1: number;
  steamph2: number;
  steamph3: number;
  steamph4: number;
  cb: number;
  steamgen: number;
}

interface NodeProps {
  x: number;
  y: number;
  color: string;
  title: string;
  value: string;
}

const Node = ({ x, y, color, title, value }: NodeProps) => (
  <g transform={`translate(${x},${y})`}>
    <circle r="40" fill="white" stroke={color} strokeWidth="2" />
    {/* Value positioned at the center of the circle */}
    <text
      x="0"
      y="0"
      textAnchor="middle"
      alignmentBaseline="middle"
      className="text-[12px] font-medium"
    >
      {value}
    </text>
    <text
      x="0"
      y="30"
      textAnchor="middle"
      className="text-[10px] text-gray-500"
    >
      {title}
    </text>
  </g>
);

export default function EnergyFlow() {
  const [flowData, setFlowData] = useState<SteamFlowData | null>(null);

  useEffect(() => {
    const fetchFlowData = async () => {
      try {
        const response = await fetch("/api/v1/overview");
        const data = await response.json();
        // Assuming that we want to access the first item in the "dashboard" array
        const dashboardData = data.data.dashboard[0]; 

        // Set the state with the relevant data from the dashboard
        setFlowData({
          steamph1: dashboardData.steamph1,
          steamph2: dashboardData.steamph2,
          steamph3: dashboardData.steamph3,
          steamph4: dashboardData.steamph4,
          cb: dashboardData.cb,
          steamgen: dashboardData.steamgen
        });
      } catch (error) {
        console.error("Error fetching flow data:", error);
      }
    };

    // Fetch data every 0.5 second (500ms)
    const intervalId = setInterval(fetchFlowData, 500);

    // Cleanup the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const paths = {
    ph1toPH4: "M100,100 L100,180",
    ph2toPH3: "M300,100 L300,180",
    ph3toCB: "M200,300 L320,180",
    ph4toCB: "M100,200 L200,300",
  };

  return (
    <svg
      className="w-full max-w-[500px] h-auto"
      viewBox="0 0 400 360"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Static Paths */}
      {Object.values(paths).map((path, index) => (
        <path key={index} d={path} stroke="#000000" strokeWidth="2" fill="none" />
      ))}

      {/* Nodes */}
      <Node
        x={100}
        y={70}
        color="#3b82f6"
        title="PH1"
        value={`${(flowData?.steamph1 ?? 0).toFixed(2)} T/H`}
      />
      <Node
        x={300}
        y={70}
        color="#3b82f6"
        title="PH2"
        value={`${(flowData?.steamph2 ?? 0).toFixed(2)} T/H`}
      />
      <Node
        x={300}
        y={180}
        color="#3b82f6"
        title="PH4"
        value={`${(flowData?.steamph4 ?? 0).toFixed(2)} T/H`}
      />
      <Node
        x={100}
        y={180}
        color="#3b82f6"
        title="PH3"
        value={`${(flowData?.steamph3 ?? 0).toFixed(2)} T/H`}
      />
      <Node
        x={200}
        y={290}
        color="#3b82f6"
        title="OS"
        value={`${(flowData?.cb ?? 0).toFixed(2)} T/H`}
      />
    </svg>
  );
}
