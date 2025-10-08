"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface FloatingLineProps {
  path: string;
  color: string;
  reverse?: boolean;
}

interface NodeProps {
  x: number;
  y: number;
  color: string;
  title: string;
  value: string;
}

interface FlowValueProps {
  x: string;
  y: string;
  value: string;
  rotate?: number;
}

const FloatingLine = ({ path, color, reverse = false }: FloatingLineProps) => (
  <motion.path
    d={path}
    stroke={color}
    strokeWidth="3"
    fill="none"
    strokeDasharray="10,15"
    initial={{ strokeDashoffset: 0 }}
    animate={{ strokeDashoffset: reverse ? 100 : -100 }}
    transition={{
      repeat: Number.POSITIVE_INFINITY,
      duration: 3,
      ease: "linear",
    }}
  />
);

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
      {value} {/* Displaying the numeric value */}
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

const FlowValue = ({ x, y, value, rotate = 0 }: FlowValueProps) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    className="text-[11px] font-medium fill-gray-600"
    transform={`rotate(${rotate} ${x} ${y})`}
  >
    {value} {/* Displaying the numeric value */}
  </text>
);

export default function EnergyFlow() {
  const [flowData, setFlowData] = useState({
    ph1toPH2: 0,
    ph2toPH3: 0,
    ph3toPH4: 0,
    SOLAR_IN_PERCENTAGE: 0,
    R_LNG_ENGINES_IN_PERCENTAGE: 0,
    N_GAS_ENGINES_IN_PERCENTAGE: 0,
    HFO_ENGINES_IN_PERCENTAGE: 0,
    DIESEL_ENGINES_IN_PERCENTAGE: 0,
    totalGen: 0,
    ph1Total: 0,
    ph2Total: 0,
    ph3Total: 0,
    ph4Total: 0,
    MAN_KW: 0,
    MAK1_KW: 0,
    MAK2_KW: 0,
    turbinekw: 0,
    engine6kw: 0,
    engine7kw: 0,
  });

  useEffect(() => {
    const fetchFlowData = async () => {
      try {
        const response = await fetch("/api/v1/overview");
        const data = await response.json();
        setFlowData({
          ph1toPH2: data.data.overview[0].KW_BRIDGE_TRANSFORMER_PH2,
          ph2toPH3: data.data.overview[0].KW_AM17_SPINNING_PH2,
          ph3toPH4: data.data.overview[0].TOWARDS_PH2_kw,
          SOLAR_IN_PERCENTAGE: data.data.overview[0].SOLAR_IN_PERCENTAGE,
          R_LNG_ENGINES_IN_PERCENTAGE: data.data.overview[0].R_LNG_ENGINES_IN_PERCENTAGE,
          N_GAS_ENGINES_IN_PERCENTAGE: data.data.overview[0].N_GAS_ENGINES_IN_PERCENTAGE,
          HFO_ENGINES_IN_PERCENTAGE: data.data.overview[0].HFO_ENGINES_IN_PERCENTAGE,
          DIESEL_ENGINES_IN_PERCENTAGE: data.data.overview[0].DIESEL_ENGINES_IN_PERCENTAGE,
          totalGen: data.data.dashboard[0].totalpowergen,
          ph1Total: data.data.dashboard[0].powerhouse1gen,
          ph2Total: data.data.dashboard[0].powerhouse2gen,
          ph3Total: data.data.dashboard[0].powerhouse3gen,
          ph4Total: data.data.dashboard[0].AM17_PH2,
          MAN_KW: data.data.powerhouse3[0].MAN_KW,
          MAK1_KW: data.data.powerhouse3[0].MAK1_KW,
          MAK2_KW: data.data.powerhouse3[0].MAK2_KW,
          turbinekw: data.data.powerhouse2[0].turbinekw,
          engine6kw: data.data.powerhouse1[0].engine6kw,
          engine7kw: data.data.powerhouse1[0].engine7kw,
        });
      } catch (error) {
        console.error("Error fetching flow data:", error);
      }
    };

    // Fetch data every 1 second (1000ms)
    const intervalId = setInterval(fetchFlowData, 500);

    // Cleanup the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures this runs once when the component mounts

  const paths = {
    ph1toPH2: "M100,70 L300,70",
    ph2toPH3: "M300,100 L300,300",
    ph3toPH4: "M300,270 L100,270",
  };

  return (
    <svg
      className="w-full max-w-[500px] h-auto"
      viewBox="0 0 400 350"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Static Paths */}
      <path d={paths.ph1toPH2} stroke="#e5e7eb" strokeWidth="2" fill="none" />
      <path d={paths.ph2toPH3} stroke="#e5e7eb" strokeWidth="2" fill="none" />
      <path d={paths.ph3toPH4} stroke="#e5e7eb" strokeWidth="2" fill="none" />

      {/* Floating Lines */}
      {flowData.ph1toPH2 > 0 ? (
        <FloatingLine path={paths.ph1toPH2} color="#ec4899" reverse={true} />
      ) : (
        <FloatingLine path={paths.ph1toPH2} color="#fbbf24" reverse={false} />
      )}
      {flowData.ph2toPH3 > 0 ? (
        <FloatingLine path={paths.ph2toPH3} color="#ec4899" reverse={false} />
      ) : (
        <FloatingLine path={paths.ph2toPH3} color="#fb1f24" reverse={true} />
      )}
      {flowData.ph3toPH4 > 0 ? (
        <FloatingLine path={paths.ph3toPH4} color="#fb1f24" reverse={false} />
      ) : (
        <FloatingLine path={paths.ph3toPH4} color="#60a5fa" reverse={true} />
      )}

      {/* Flow Values */}
      <FlowValue
        x="200"
        y="60"
        value={`${Math.abs(flowData.ph1toPH2)} KW ${
          flowData.ph1toPH2 > 0 ? "←" : "→"
        }`}
      />
      <FlowValue
        x="320"
        y="170"
        value={`${Math.abs(flowData.ph2toPH3)} KW ${
          flowData.ph2toPH3 > 0 ? "←" : "→"
        }`}
        rotate={-90}
      />
      <FlowValue
        x="200"
        y="290"
        value={`${Math.abs(flowData.ph3toPH4)} KW ${
          flowData.ph3toPH4 > 0 ? "←" : "→"
        }`}
      />

      {/* Total KW in the middle */}
      <text
        x="200"
        y="150"
        textAnchor="middle"
        className="text-[18px] font-bold fill-gray-700"
      >
        Total
      </text>
      <text
        x="200"
        y="180"
        textAnchor="middle"
        className="text-[24px] font-bold fill-[#1b2d92]"
      >
        {flowData.totalGen} KW
      </text>

      {/* Nodes */}
      <a href="/powerhouse1">
        <Node
          x={100}
          y={70}
          color="#fbbf24"
          title="PH1"
          value={`${(flowData.ph1Total / 1000).toFixed(2)} MW`}
        />
      </a>
      <a href="/powerhouse2">
        <Node
          x={300}
          y={70}
          color="#ec4899"
          title="PH2"
          value={`${(flowData.ph2Total / 1000).toFixed(2)} MW`}
        />
      </a>
      <a href="/powerhouse3">
        <Node
          x={300}
          y={270}
          color="#fb1f24"
          title="PH3"
          value={`${(flowData.ph3Total / 1000).toFixed(2)} MW`}
        />
      </a>
      <a href="/am17_powerhouse2">
        <Node
          x={100}
          y={270}
          color="#60a5fa"
          title="PH4"
          value={`${(flowData.ph4Total / 1000).toFixed(2)} MW`}
        />
      </a>
      <text
        x="305"
        y="325"
        textAnchor="middle"
        className="text-[12px] font-bold fill-gray-700"
      >
        {flowData.MAN_KW > 10 || flowData.MAK1_KW > 10 || flowData.MAK2_KW > 10
          ? `HFO → ${(
              flowData.MAN_KW +
              flowData.MAK1_KW +
              flowData.MAK2_KW
            ).toFixed(0)} kW`
          : " "}
      </text>
      <text
        x="305"
        y="25"
        textAnchor="middle"
        className="text-[12px] font-bold fill-gray-700"
      >
        {flowData.turbinekw > 10
          ? `TURBINE → ${flowData.turbinekw.toFixed(0)} kW`
          : " "}
      </text>
      <text
        x="100"
        y="25"
        textAnchor="middle"
        className="text-[12px] font-bold fill-gray-700"
      >
        {flowData.engine6kw > 10 || flowData.engine7kw > 10
          ? `DIESEL → ${(flowData.engine6kw + flowData.engine7kw).toFixed(
              0
            )} kW`
          : " "}
      </text>
    </svg>
  );
}
