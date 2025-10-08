// pages/index.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@tremor/react";
import { Chart } from "chart.js/auto";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface EngineData {
  id: number;
  engine1kw: number;
  engine1kwh: number;
  engine2kw: number;
  engine2kwh: number;
  engine3kw: number;
  engine3kwh: number;
  engine4kw: number;
  engine4kwh: number;
  engine5kw: number;
  engine5kwh: number;
  engine6kw: number;
  engine6kwh: number;
  engine7kw: number;
  engine7kwh: number;
  engine8kw: number;
  engine8kwh: number;
  takeoff1kw: number;
  takeoff1kwh: number;
  takeoff2kw: number;
  takeoff2kwh: number;
  takeoff3kw: number;
  takeoff3kwh: number;
  lv_auxiliarykw: number;
  engine1: null | any;
  engine2: null | any;
  engine3: null | any;
  engine4: null | any;
  engine5: null | any;
  engine6: null | any;
  engine7: null | any;
  engine8: null | any;
}

async function getData() {
  try {
    const res = await fetch("/api/v1/powerhouse1", {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    const result = await res.json();
    return result;
  } catch (error) {
    console.log("error: " + error);
  }
}

const Page = () => {
  const [data, setData] = useState<EngineData[]>([]);
  const [percentageUsedDataE1, setPercentageUsedDataE1] = useState("");
  const [percentageUsedDataE2, setPercentageUsedDataE2] = useState("");
  const [percentageUsedDataE3, setPercentageUsedDataE3] = useState("");
  const [percentageUsedDataE4, setPercentageUsedDataE4] = useState("");
  const [percentageUsedDataE5, setPercentageUsedDataE5] = useState("");
  const [percentageUsedDataE6, setPercentageUsedDataE6] = useState("");
  const [percentageUsedDataE7, setPercentageUsedDataE7] = useState("");
  const [percentageUsedDataT1, setPercentageUsedDataT1] = useState("");
  const [percentageUsedDataT2, setPercentageUsedDataT2] = useState("");
  const [percentageUsedDataT3, setPercentageUsedDataT3] = useState("");
  const [percentageUsedDataLA, setPercentageUsedDataLA] = useState("");

  const refreshList = async () => {
    const result = await getData();
    setData(result.data);
  };

  useEffect(() => {
    refreshList();

    const intervalId = setInterval(() => {
      refreshList(); // Fetch data every 3 seconds
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const initializeChart = (
    canvasId: string,
    values: number[],
    totalCapacity: number
  ) => {
    const ctx = document.getElementById(canvasId) as HTMLCanvasElement;
    let chartStatus = Chart.getChart(ctx);

    if (chartStatus !== undefined) {
      chartStatus.destroy();
    }

    const totalValue = values.reduce((acc, curr) => acc + curr, 0);
    const remainingCapacity = totalCapacity - totalValue;
    const percentageUsed = ((totalValue / totalCapacity) * 100).toFixed(1);

    const chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        datasets: [
          {
            label: "Data from API",
            data: [totalValue, remainingCapacity],
            backgroundColor: ["#1b2d92", "#E5E8E8"],
          },
        ],
      },
      options: {
        responsive: true,
        cutout: "80%",
        plugins: {
          legend: {
            position: "bottom",
          },
          tooltip: {
            enabled: false,
          },
        },
        animation: false,
      },
    });

    chart.update();
    return percentageUsed;
  };

  useEffect(() => {
    if (data.length > 0) {
      const values = data.map((item) => item.engine1kw);
      const percentageUsed = initializeChart("engine1", values, 1500);
      setPercentageUsedDataE1(percentageUsed);
    }
  }, [data]);

  useEffect(() => {
    if (data.length > 0) {
      const values = data.map((item) => item.engine2kw);
      const percentageUsed = initializeChart("engine2", values, 1500);
      setPercentageUsedDataE2(percentageUsed);
    }
  }, [data]);

  useEffect(() => {
    if (data.length > 0) {
      const values = data.map((item) => item.engine3kw);
      const percentageUsed = initializeChart("engine3", values, 1500);
      setPercentageUsedDataE3(percentageUsed);
    }
  }, [data]);

  useEffect(() => {
    if (data.length > 0) {
      const values = data.map((item) => item.engine4kw);
      const percentageUsed = initializeChart("engine4", values, 1200);
      setPercentageUsedDataE4(percentageUsed);
    }
  }, [data]);

  useEffect(() => {
    if (data.length > 0) {
      const values = data.map((item) => item.engine5kw);
      const percentageUsed = initializeChart("engine5", values, 1200);
      setPercentageUsedDataE5(percentageUsed);
    }
  }, [data]);

  useEffect(() => {
    if (data.length > 0) {
      const values = data.map((item) => item.engine6kw);
      const percentageUsed = initializeChart("engine6", values, 1200);
      setPercentageUsedDataE6(percentageUsed);
    }
  }, [data]);

  useEffect(() => {
    if (data.length > 0) {
      const values = data.map((item) => item.engine7kw);
      const percentageUsed = initializeChart("engine7", values, 1000);
      setPercentageUsedDataE7(percentageUsed);
    }
  }, [data]);

  // Take Off

  useEffect(() => {
    if (data.length > 0) {
      const values = data.map((item) => item.takeoff1kw);
      const percentageUsed = initializeChart("takeoff1", values, 1850);
      setPercentageUsedDataT1(percentageUsed);
    }
  }, [data]);

  useEffect(() => {
    if (data.length > 0) {
      const values = data.map((item) => item.takeoff2kw);
      const percentageUsed = initializeChart("takeoff2", values, 1200);
      setPercentageUsedDataT2(percentageUsed);
    }
  }, [data]);

  useEffect(() => {
    if (data.length > 0) {
      const values = data.map((item) => item.takeoff3kw);
      const percentageUsed = initializeChart("takeoff3", values, 1150);
      setPercentageUsedDataT3(percentageUsed);
    }
  }, [data]);

  useEffect(() => {
    if (data.length > 0) {
      const values = data.map((item) => item.lv_auxiliarykw);
      const percentageUsed = initializeChart("lv_aux", values, 300);
      setPercentageUsedDataLA(percentageUsed);
    }
  }, [data]);

  return (
    <div>
      <h1 className="pt-5 text-center text-xl font-bold">
        Power house 1 Generation
      </h1>
      <div className="p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">Engine 1</CardTitle>
              <span className="-ml-24 text-xs font-bold bg-green-300 border-2 border-transparent rounded-md px-[0.5rem] py-[0.100rem] shadow-md">
                N-GAS
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  float: "left",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "40px",
                    position: "absolute",
                    top: "55%",
                    left: "0",
                    marginTop: "-20px",
                    lineHeight: "19px",
                    textAlign: "center",
                  }}
                >
                  {percentageUsedDataE1}%
                </div>
                <canvas id="engine1" width="100" height="100" />
              </div>
              <div className="">
                {data.map((item) => {
                  return (
                    <div key={item.id} className="pt-3 text-base font-bold">
                      <p>Load {item.engine1kw} kW</p>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  1500 total capacity in KW
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">Engine 2</CardTitle>
              <span className="-ml-24 text-xs font-bold bg-green-300 border-2 border-transparent rounded-md px-[0.5rem] py-[0.100rem] shadow-md">
                N-GAS
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  float: "left",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "40px",
                    position: "absolute",
                    top: "55%",
                    left: "0",
                    marginTop: "-20px",
                    lineHeight: "19px",
                    textAlign: "center",
                  }}
                >
                  {percentageUsedDataE2}%
                </div>
                <canvas id="engine2" width="100" height="100" />
              </div>
              <div className="">
                {data.map((item) => {
                  return (
                    <div key={item.id} className="pt-3 text-base font-bold">
                      <p>Load {item.engine2kw} kW</p>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  1500 total capacity in KW
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">Engine 3</CardTitle>
              <span className="-ml-24 text-xs font-bold bg-green-300 border-2 border-transparent rounded-md px-[0.5rem] py-[0.100rem] shadow-md">
                N-GAS
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  float: "left",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "40px",
                    position: "absolute",
                    top: "55%",
                    left: "0",
                    marginTop: "-20px",
                    lineHeight: "19px",
                    textAlign: "center",
                  }}
                >
                  {percentageUsedDataE3}%
                </div>
                <canvas id="engine3" width="100" height="100" />
              </div>
              <div className="">
                {data.map((item) => {
                  return (
                    <div key={item.id} className="pt-3 text-base font-bold">
                      <p>Load {item.engine3kw} kW</p>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  1500 total capacity in KW
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">Engine 4</CardTitle>
              <span className="-ml-24 text-xs font-bold bg-green-300 border-2 border-transparent rounded-md px-[0.5rem] py-[0.100rem] shadow-md">
                N-GAS
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  float: "left",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "40px",
                    position: "absolute",
                    top: "55%",
                    left: "0",
                    marginTop: "-20px",
                    lineHeight: "19px",
                    textAlign: "center",
                  }}
                >
                  {percentageUsedDataE4}%
                </div>
                <canvas id="engine4" width="100" height="100" />
              </div>
              <div className="">
                {data.map((item) => {
                  return (
                    <div key={item.id} className="pt-3 text-base font-bold">
                      <p>Load {item.engine4kw} kW</p>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  1200 total capacity in KW
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">Engine 5</CardTitle>
              <span className="-ml-24 text-xs font-bold bg-green-300 border-2 border-transparent rounded-md px-[0.5rem] py-[0.100rem] shadow-md">
                N-GAS
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  float: "left",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "40px",
                    position: "absolute",
                    top: "55%",
                    left: "0",
                    marginTop: "-20px",
                    lineHeight: "19px",
                    textAlign: "center",
                  }}
                >
                  {percentageUsedDataE5}%
                </div>
                <canvas id="engine5" width="100" height="100" />
              </div>
              <div className="">
                {data.map((item) => {
                  return (
                    <div key={item.id} className="pt-3 text-base font-bold">
                      <p>Load {item.engine5kw} kW</p>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  1200 total capacity in KW
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">Engine 6</CardTitle>
              <span className="-ml-24 text-xs font-bold bg-red-500 border-2 border-transparent rounded-md px-[0.5rem] py-[0.100rem] shadow-md">
                DIESEL
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  float: "left",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "40px",
                    position: "absolute",
                    top: "55%",
                    left: "0",
                    marginTop: "-20px",
                    lineHeight: "19px",
                    textAlign: "center",
                  }}
                >
                  {percentageUsedDataE6}%
                </div>
                <canvas id="engine6" width="100" height="100" />
              </div>
              <div className="">
                {data.map((item) => {
                  return (
                    <div key={item.id} className="pt-3 text-base font-bold">
                      <p>Load {item.engine6kw} kW</p>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  1200 total capacity in KW
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">Engine 7</CardTitle>
              <span className="-ml-24 text-xs font-bold bg-red-500 border-2 border-transparent rounded-md px-[0.5rem] py-[0.100rem] shadow-md">
                DIESEL
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  float: "left",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "40px",
                    position: "absolute",
                    top: "55%",
                    left: "0",
                    marginTop: "-20px",
                    lineHeight: "19px",
                    textAlign: "center",
                  }}
                >
                  {percentageUsedDataE7}%
                </div>
                <canvas id="engine7" width="100" height="100" />
              </div>
              <div className="">
                {data.map((item) => {
                  return (
                    <div key={item.id} className="pt-3 text-base font-bold">
                      <p>Load {item.engine7kw} kW</p>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  1000 total capacity in KW
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <h1 className="text-center text-xl font-bold">UTILIZATION</h1>
      <div className="p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">
                Load Takeoff-1
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  float: "left",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "40px",
                    position: "absolute",
                    top: "55%",
                    left: "0",
                    marginTop: "-20px",
                    lineHeight: "19px",
                    textAlign: "center",
                  }}
                >
                  {percentageUsedDataT1}%
                </div>
                <canvas id="takeoff1" width="100" height="100" />
              </div>
              <div className="">
                {data.map((item) => {
                  return (
                    <div key={item.id} className="pt-3 text-base font-bold">
                      <p>Load {item.takeoff1kw} kW</p>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  1850 total capacity in KW
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">
                Load Takeoff-2
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  float: "left",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "40px",
                    position: "absolute",
                    top: "55%",
                    left: "0",
                    marginTop: "-20px",
                    lineHeight: "19px",
                    textAlign: "center",
                  }}
                >
                  {percentageUsedDataT2}%
                </div>
                <canvas id="takeoff2" width="100" height="100" />
              </div>
              <div className="">
                {data.map((item) => {
                  return (
                    <div key={item.id} className="pt-3 text-base font-bold">
                      <p>Load {item.takeoff2kw} kW</p>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  1200 total capacity in KW
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">
                Load Takeoff-3
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  float: "left",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "40px",
                    position: "absolute",
                    top: "55%",
                    left: "0",
                    marginTop: "-20px",
                    lineHeight: "19px",
                    textAlign: "center",
                  }}
                >
                  {percentageUsedDataT3}%
                </div>
                <canvas id="takeoff3" width="100" height="100" />
              </div>
              <div className="">
                {data.map((item) => {
                  return (
                    <div key={item.id} className="pt-3 text-base font-bold">
                      <p>Load {item.takeoff3kw} kW</p>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  1150 total capacity in KW
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">
                AUXILIARY
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  float: "left",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "40px",
                    position: "absolute",
                    top: "55%",
                    left: "0",
                    marginTop: "-20px",
                    lineHeight: "19px",
                    textAlign: "center",
                  }}
                >
                  {percentageUsedDataLA}%
                </div>
                <canvas id="lv_aux" width="100" height="100" />
              </div>
              <div className="">
                {data.map((item) => {
                  return (
                    <div key={item.id} className="pt-3 text-base font-bold">
                      <p>Load {item.lv_auxiliarykw} kW</p>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  300 total capacity in KW
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Page;
