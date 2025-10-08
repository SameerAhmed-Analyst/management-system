"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@tremor/react";
import { Chart } from "chart.js/auto";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import EnergyFlow from "@/components/EnergyFlow";
import SeparatedSourcesCard from "@/components/separated-sources-card";

interface PowerDataTypes {
  id: number;
  powerhouse1gen: number;
  powerhouse2gen: number;
  powerhouse3gen: number;
  AM17_PH2: number;
  totalpowergen: number;
  steamph1: number;
  steamph2: number;
  steamph3: number;
  steamph4: number;
  cb: number;
  steamgen: number;
  ps: null;
  ngas_psi: number;
  ngas_mbar: number;
  rlng_psi: number;
  rlng_mbar: number;
  fgc: number;
  fgc_mbar: number;
  industrialgas_psi: number;
  industrialgas_mbar: number;
  hrsg_gasflow: number;
  steam_pressure_mainheader_1: number;
  steam_pressure_mainheader_2_and_3: number;
  steam_pressure_mainheader_4: number;
  totalsolargen: number;
}

export interface Powerhouse1Takeoffs {
  takeoff1kw: number;
  takeoff2kw: number;
  takeoff3kw: number;
}

export interface Powerhouse2Takeoffs {
  Takeoff4kw: number;
  Takeoff5kw: number;
  Takeoff6kw: number;
  Takeoff7kw: number;
  Takeoff8kw: number;
  AUX_LV_Takeoff: number;
}

export interface Powerhouse3Takeoffs {
  Takeoff1kw: number;
  Takeoff2kw: number;
  Takeoff3kw: number;
  Takeoff4kw: number;
}

export interface AM17Takeoffs {
  AUXILIARY_kw: number;
  TOWARDS_PH1_kw: number;
  AM17_B_kw: number;
}

export interface ApiResponse {
  dashboard: PowerDataTypes[];
  ph1_takeoffs: Powerhouse1Takeoffs[];
  ph2_takeoffs: Powerhouse2Takeoffs[];
  ph3_takeoffs: Powerhouse3Takeoffs[];
  am17_takeoffs: AM17Takeoffs[];
}

async function getData(): Promise<ApiResponse | null> {
  try {
    const res = await fetch("/api/v1/dashboard", {
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
    return result.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

export default function Home() {
  const [data, setData] = useState<PowerDataTypes[]>([]);
  const [ph1Takeoffs, setPh1Takeoffs] = useState<Powerhouse1Takeoffs[]>([]);
  const [ph2Takeoffs, setPh2Takeoffs] = useState<Powerhouse2Takeoffs[]>([]);
  const [ph3Takeoffs, setPh3Takeoffs] = useState<Powerhouse3Takeoffs[]>([]);
  const [am17Takeoffs, setAm17Takeoffs] = useState<AM17Takeoffs[]>([]);
  const [percentageUsedDataEPH1, setPercentageUsedDataEPH1] = useState("");
  const [percentageUsedDataEPH2, setPercentageUsedDataEPH2] = useState("");
  const [percentageUsedDataSolar, setPercentageUsedDataSolar] = useState("");
  const [totalSolar, setTotalSolar] = useState(0);

  const refreshList = async () => {
    const result = await getData();
    if (result) {
      setData(result.dashboard);
      setPh1Takeoffs(result.ph1_takeoffs);
      setPh2Takeoffs(result.ph2_takeoffs);
      setPh3Takeoffs(result.ph3_takeoffs);
      setAm17Takeoffs(result.am17_takeoffs);
    }
  };

  useEffect(() => {
    refreshList();

    const intervalId = setInterval(() => {
      refreshList(); // Fetch data every 1 seconds
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      const ctx = document.getElementById("electricalph") as HTMLCanvasElement;
      let chartStatus = Chart.getChart(ctx);

      if (chartStatus !== undefined) {
        chartStatus.destroy();
      }

      const valuesph1 = data.map((item) => item.powerhouse1gen);
      const valuesph2 = data.map((item) => item.powerhouse2gen);
      const valuesph3 = data.map((item) => item.powerhouse3gen);
      const valuesph4 = data.map((item) => item.AM17_PH2);
      const valuesSolar = data.map((item) => item.totalsolargen);

      const totalValueph1 = valuesph1.reduce((acc, curr) => acc + curr, 0);
      const totalValueph2 = valuesph2.reduce((acc, curr) => acc + curr, 0);
      const totalValueph3 = valuesph3.reduce((acc, curr) => acc + curr, 0);
      const totalValueph4 = valuesph4.reduce((acc, curr) => acc + curr, 0);
      const totalValueSolar = valuesSolar.reduce((acc, curr) => acc + curr, 0);

      const remainingCapacity = 9650 + 14400 - 25675;

      const percentageUsedph1 = ((totalValueph1 / 9600) * 100).toFixed(1);
      const percentageUsedph2 = ((totalValueph2 / 14400) * 100).toFixed(1);
      const percentageUsedph3 = ((totalValueph3 / 14400) * 100).toFixed(1);
      const percentageUsedph4 = ((totalValueph4 / 4500) * 100).toFixed(1);
      const percentageUsedSolar = ((totalValueSolar / 1625) * 100).toFixed(1);

      setPercentageUsedDataEPH1(percentageUsedph1);
      setPercentageUsedDataEPH2(percentageUsedph2);
      setPercentageUsedDataSolar(percentageUsedSolar);
      setTotalSolar(totalValueSolar);

      const chart = new Chart(ctx, {
        type: "doughnut",
        data: {
          datasets: [
            {
              label: "D",
              data: [
                totalValueph1,
                totalValueph2,
                totalValueph3,
                totalValueph4,
                totalValueSolar,
              ],
              backgroundColor: [
                "#384C6B",
                "#a75281",
                "#C09741",
                "#4F9D9A",
                "#9595B7",
              ],
            },
          ],
        },
        options: {
          responsive: true,
          cutout: "60%",
          spacing: 7,
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
        plugins: [
          // outsideTextLabels
        ],
      });
      chart.update(); // Update the chart to apply changes
    }
  }, [data]);

  useEffect(() => {
    if (data.length > 0) {
      const ctx = document.getElementById(
        "powerhouse2gen"
      ) as HTMLCanvasElement;
      let chartStatus = Chart.getChart(ctx);

      if (chartStatus !== undefined) {
        chartStatus.destroy();
      }

      const valuesph1 = data.map((item) => item.steamph1);
      const valuesph2 = data.map((item) => item.steamph2);
      const valuesph3 = data.map((item) => item.steamph3);
      const valuesph4 = data.map((item) => item.steamph4);
      const valuesCoal = data.map((item) => item.cb);
      const totalValueph1 = valuesph1.reduce((acc, curr) => acc + curr, 0);
      const totalValueph2 = valuesph2.reduce((acc, curr) => acc + curr, 0);
      const totalValueph3 = valuesph3.reduce((acc, curr) => acc + curr, 0);
      const totalValueph4 = valuesph4.reduce((acc, curr) => acc + curr, 0);
      const totalValueCoal = valuesCoal.reduce((acc, curr) => acc + curr, 0);

      const chart = new Chart(ctx, {
        type: "doughnut",
        data: {
          datasets: [
            {
              label: "Data from API",
              data: [
                totalValueph1,
                totalValueph2,
                totalValueph3,
                totalValueph4,
                totalValueCoal,
              ],
              backgroundColor: [
                "#384C6B",
                "#b495b7",
                "#E28A2B",
                "#95b798",
                "#9595B7",
              ],
            },
          ],
        },
        options: {
          responsive: true,
          cutout: "60%",
          spacing: 7,
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
        plugins: [
          // outsideTextLabels
        ],
      });
      chart.update(); // Update the chart to apply changes
    }
  }, [data]);

  const am5Value =
    (ph1Takeoffs[0]?.takeoff1kw ?? 0) +
    (ph1Takeoffs[0]?.takeoff2kw ?? 0) +
    (ph1Takeoffs[0]?.takeoff3kw ?? 0) +
    (ph2Takeoffs[0]?.Takeoff4kw ?? 0) +
    (ph2Takeoffs[0]?.Takeoff5kw ?? 0) +
    (ph2Takeoffs[0]?.Takeoff6kw ?? 0) +
    (ph2Takeoffs[0]?.AUX_LV_Takeoff ?? 0);

  const am17AValue =
    (ph3Takeoffs[0]?.Takeoff3kw ?? 0) + (ph3Takeoffs[0]?.Takeoff4kw ?? 0);

  const am17BValue =
    (am17Takeoffs[0]?.AM17_B_kw ?? 0) + (am17Takeoffs[0]?.AUXILIARY_kw ?? 0);

  const am8Value = ph2Takeoffs[0]?.Takeoff7kw ?? 0;

  const am18Value = ph3Takeoffs[0]?.Takeoff1kw ?? 0;

  const steamHeader_1 = data[0]?.steam_pressure_mainheader_1 ?? 0;
  const steamHeader_2_and_3 = data[0]?.steam_pressure_mainheader_2_and_3 ?? 0;
  const steamHeader_4 = data[0]?.steam_pressure_mainheader_4 ?? 0;

  return ( 
    <>
      <div className="">
        {/* <h1 className="text-2xl font-bold text-center pt-5">DASHBOARD</h1> */}
        <div className="p-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-0 m-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-0">
                <CardTitle className="text-xl font-bold">
                  Overview
                  {/* <sup className="text-red-600 text-xs">* Testing</sup> */}
                </CardTitle>
                <a 
                // href="/custom_report"
                >
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
                </a>
              </CardHeader>
              <CardContent className="p-0">
                <EnergyFlow />
                <div className="px-2 pb-1 text-[10px] sm:text-xs text-gray-500">
                  <div className="grid grid-cols-5 gap-x-1 text-center border-b pb-1 tracking-tight">
                    <span>AM5</span>
                    <span>AM8</span>
                    <span>AM17 A</span>
                    <span>AM17 B</span>
                    <span>AM18</span>
                  </div>
                  <div className="grid grid-cols-5 gap-x-1 text-center pt-1 tracking-tight text-blue-500 font-semibold">
                    <span>{am5Value.toFixed(0)} kW</span>
                    <span>{am8Value.toFixed(0)} kW</span>
                    <span>{am17AValue.toFixed(0)} kW</span>
                    <span>{am17BValue.toFixed(0)} kW</span>
                    <span>{am18Value.toFixed(0)} kW</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="p-0 m-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-0">
                <CardTitle className="text-xl font-bold">
                  Steam Pressures
                  {/* <sup className="text-red-600 text-xs">
                    * Under Development
                  </sup> */}
                </CardTitle>
                <a href="/">
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
                </a>
              </CardHeader>
              <CardContent className="p-0">
                {/* <SeparatedSourcesCard /> */}
                <div className="px-2 pb-1 text-[10px] mt-[1.75rem] sm:text-xs text-gray-500">
                  <div className="grid grid-cols-5 gap-x-1 text-center border-b pb-1 tracking-tight">
                    <span>H1</span>
                    <span>H2&3</span>
                    <span>H4</span>
                    <span>AM17 H1</span>
                    <span>AM17 H2</span>
                  </div>
                  <div className="grid grid-cols-5 gap-x-1 text-center pt-1 tracking-tight text-blue-500 font-semibold">
                    <span>{steamHeader_1.toFixed(0)} PSI</span>
                    <span>{steamHeader_2_and_3.toFixed(0)} PSI</span>
                    <span>{steamHeader_4.toFixed(0)} PSI</span>
                    <span>0 PSI</span>
                    <span>0 PSI</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="p-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                <CardTitle className="text-xl font-bold">
                  Electrical Power Generation
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
              <CardContent className="flex justify-center">
                <div
                  style={{
                    width: "250px",
                    height: "250px",
                    position: "relative",
                    marginTop: "15px",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "40px",
                      position: "absolute",
                      top: "30%",
                      left: "139px",
                      lineHeight: "19px",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {/* {percentageUsedDataEPH1}% */}
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "40px",
                      position: "absolute",
                      top: "96%",
                      left: "-2px",
                      lineHeight: "19px",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {/* {percentageUsedDataEPH2}% */}
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "40px",
                      position: "absolute",
                      top: "53%",
                      left: "0",
                      marginTop: "-20px",
                      lineHeight: "19px",
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: "x-large",
                    }}
                  >
                    {data.map((item) =>
                      (
                        (item.powerhouse1gen +
                          item.powerhouse2gen +
                          item.powerhouse3gen +
                          item.AM17_PH2 +
                          item.totalsolargen) /
                        1000
                      ).toFixed(1)
                    )}{" "}
                    MW
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "40px",
                      position: "absolute",
                      top: "0%",
                      left: "-82px",
                      lineHeight: "19px",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {/* {percentageUsedDataSolar}% */}
                  </div>
                  <canvas id="electricalph" width="200" height="200" />
                </div>
              </CardContent>
              <div className="">
                <a href="/powerhouse1">
                  <div className="flex">
                    <div className="bg-[#384C6B] w-10 h-5 m-1"></div>
                    <p>Power House 1</p>
                    {data.map((item) => {
                      return (
                        <p className="ml-auto mr-5" key={1}>
                          {(item.powerhouse1gen / 1000).toFixed(1)} MW
                        </p>
                      );
                    })}
                  </div>
                </a>
                <a href="/powerhouse2">
                  <div className="flex">
                    <div className="bg-[#a75281] w-10 h-5 m-1"></div>
                    <p>Power House 2</p>
                    {data.map((item) => {
                      return (
                        <p className="ml-auto mr-5" key={2}>
                          {(item.powerhouse2gen / 1000).toFixed(1)} MW
                        </p>
                      );
                    })}
                  </div>
                </a>
                <a href="/powerhouse3">
                  <div className="flex">
                    <div className="bg-[#C09741] w-10 h-5 m-1"></div>
                    <p>Power House 3</p>
                    {data.map((item) => {
                      return (
                        <p className="ml-auto mr-5" key={3}>
                          {(item.powerhouse3gen / 1000).toFixed(1)} MW
                        </p>
                      );
                    })}
                  </div>
                </a>
                <a href="/am17_powerhouse2">
                  <div className="flex">
                    <div className="bg-[#4F9D9A] w-10 h-5 m-1"></div>
                    <p>Power House 4</p>
                    {data.map((item) => {
                      return (
                        <p className="ml-auto mr-5" key={4}>
                          {(item.AM17_PH2 / 1000).toFixed(1)} MW
                        </p>
                      );
                    })}
                  </div>
                </a>
                <a href="/solar">
                  <div className="flex">
                    <div className="bg-[#9595B7] w-10 h-5 m-1"></div>
                    <p>Solar</p>
                    {data.map((item) => {
                      return (
                        <p className="ml-auto mr-5" key={5}>
                          {(item.totalsolargen / 1000).toFixed(2)} MW
                        </p>
                      );
                    })}
                  </div>
                </a>
                <div className="flex bg-[#1b2d92] m-[2px] p-1 text-white font-semibold rounded">
                  <p className="ml-1">Total Power Generation</p>
                  {data.map((item) => {
                    return (
                      <p className="ml-auto mr-5" key={18}>
                        {(
                          (item.powerhouse1gen +
                            item.powerhouse2gen +
                            item.powerhouse3gen +
                            item.AM17_PH2 +
                            item.totalsolargen) /
                          1000
                        ).toFixed(1)}{" "}
                        MW
                      </p>
                    );
                  })}
                </div>
              </div>
            </Card>
            <Card className="p-0">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <CardTitle className="text-xl font-bold">
                  Steam Generation
                </CardTitle>
                <a href="/steam-report">
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
                </a>
              </CardHeader>

              <CardContent className="flex justify-center">
                <div className="relative mt-4 w-[250px] h-[250px]">
                  {/* Total Steam Flow */}
                  <div className="absolute top-1/2 left-0 w-full -mt-5 text-center font-bold text-xl">
                    {data?.[0]
                      ? (
                          data[0].steamph1 +
                          data[0].steamph2 +
                          data[0].steamph3 +
                          data[0].steamph4 +
                          data[0].cb
                        ).toFixed(1)
                      : "N/A"}{" "}
                    T/H
                  </div>

                  {/* Steam Pressure */}
                  {/* <div className="absolute top-[53%] left-0 w-full text-center font-bold text-lg text-purple-700">
                    {steamPressure !== null
                      ? `${steamPressure.toFixed(0)} PSI`
                      : "N/A PSI"}
                  </div> */}
                  <div className="absolute top-[53%] left-0 w-full text-center font-bold text-lg text-purple-700">
                    {`${steamHeader_2_and_3.toFixed(0)} PSI`}
                  </div>

                  <canvas id="powerhouse2gen" width="200" height="200" />
                </div>
              </CardContent>

              {/* Generation Details */}
              <div>
                {data?.[0] && (
                  <>
                    {[
                      {
                        href: "/steamph1",
                        label: "Steam Power House 1",
                        color: "#384C6B",
                        value: data[0].steamph1,
                      },
                      {
                        href: "/steamph2",
                        label: "Steam Power House 2",
                        color: "#b495b7",
                        value: data[0].steamph2.toFixed(1),
                        hrsg_gasflow: data[0].hrsg_gasflow,
                      },
                      {
                        href: "/steamph3",
                        label: "Steam Power House 3",
                        color: "#E28A2B",
                        value: data[0].steamph3,
                      },
                      {
                        href: "/steamph4",
                        label: "Steam Power House 4",
                        color: "#95b798",
                        value: data[0].steamph4,
                      },
                      {
                        href: "/coalboiler",
                        label: "Out Source Boiler",
                        color: "#9595B7",
                        value: data[0].cb,
                      },
                    ].map((item, index) => (
                      <a href={item.href} key={index}>
                        <div className="flex items-center">
                          <div
                            className="w-10 h-5 m-1"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <p>{item.label}</p>

                          {/* Conditionally render green/red dot for Steam Power House 2 */}
                          {/* {item.label === "Steam Power House 2" && (
                            <span
                              className="-ml-[1px]"
                              style={{
                                position: "relative",
                                top: "-0.5rem",
                              }}
                            >
                              <div
                                className="w-2 h-2 rounded-full inline-block"
                                style={{
                                  backgroundColor:
                                    item.hrsg_gasflow && item.hrsg_gasflow > 20
                                      ? "green"
                                      : "red",
                                }}
                              ></div>
                            </span>
                          )} */}

                          {item.label === "Steam Power House 2" && (
                            <span
                              className="-ml-[1px]"
                              style={{
                                position: "relative",
                                top: "-0.5rem",
                              }}
                            >
                              <span
                                className={`text-xs ${
                                  item.hrsg_gasflow && item.hrsg_gasflow > 20
                                    ? "animate-pulse"
                                    : "grayscale"
                                }`}
                              >
                                🔥
                              </span>
                            </span>
                          )}

                          <p className="ml-auto mr-5">{item.value} T/H</p>
                        </div>
                      </a>
                    ))}

                    {/* Total */}
                    <div className="flex items-center bg-[#1b2d92] m-1 p-1 text-white font-semibold rounded">
                      <p className="ml-1">Total Steam Generation</p>
                      <p className="ml-auto mr-5">
                        {(
                          data[0].steamph1 +
                          data[0].steamph2 +
                          data[0].steamph3 +
                          data[0].steamph4 +
                          data[0].cb
                        ).toFixed(1)}{" "}
                        T/H
                      </p>
                    </div>
                  </>
                )}
              </div>
            </Card>
            <Card className="p-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                <CardTitle className="text-xl font-bold">
                  Gas Pressures
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
              <CardContent className="">
                <div className="flex justify-between">
                  <div className="w-[69.58px]">Capative</div>
                  {data.map((item) => (
                    <>
                      <div key={10} className="w-[50.63px]">
                        {item.ngas_psi}
                      </div>
                      <div>PSI</div>
                      <div key={11} className="w-[53.64px]">
                        {item.ngas_mbar}
                      </div>
                      <div>mBAR</div>
                    </>
                  ))}
                </div>
                <div className="flex justify-between">
                  <div className="w-[69.58px]">Industrial</div>
                  {data.map((item) => (
                    <>
                      <div key={12} className="w-[50.63px]">
                        {item.industrialgas_psi}
                      </div>
                      <div>PSI</div>
                      <div key={13} className="w-[53.64px]">
                        {item.industrialgas_mbar}
                      </div>
                      <div>mBAR</div>
                    </>
                  ))}
                </div>
                <div className="flex justify-between">
                  <div className="w-[69.58px]">RLNG</div>
                  {data.map((item) => (
                    <>
                      <div key={14} className="w-[50.63px]">
                        {item.rlng_psi}
                      </div>
                      <div>PSI</div>
                      <div key={15} className="w-[53.64px]">
                        {item.rlng_mbar}
                      </div>
                      <div>mBAR</div>
                    </>
                  ))}
                </div>
                <div className="flex justify-between">
                  <div className="w-[69.58px]">FGC</div>
                  {data.map((item) => (
                    <>
                      <div key={16} className="w-[50.63px]">
                        {item.fgc}
                      </div>
                      <div>PSI</div>
                      <div key={17} className="w-[53.64px]">
                        {item.fgc_mbar}
                      </div>
                      <div>&nbsp;&nbsp;&nbsp;BAR</div>
                    </>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
