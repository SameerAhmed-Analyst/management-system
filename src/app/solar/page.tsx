"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@tremor/react";
import { Chart } from "chart.js/auto";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";

/* ---------------- existing types ---------------- */
interface SolarData {
  id: number;
  solar3_kW: number;
  solar3_kWh: number;
  solar4_kW: number;
  solar4_kWh: number;
  solar5_kW: number;
  solar5_kWh: number;
  solar_total_kW: number;
  solar_total_kWh: number;
  AM17_solar1_kW: number;
  AM17_solar1_kWh: number;
  AM17_solar2_kW: number;
  AM17_solar2_kWh: number;
  AM17_total_kW: number;
  AM17_total_kWh: number;
  AM8_solar_kW: number;
  AM8_solar_kWh: number;
  AM18_solar_kW: number;
  AM19_solar_kW: number;
  AM19_2_solar_kW: number;
}

/* ---------------- energy helpers ---------------- */
type ProxyRow = { tagId: number; timestamp: string; value: number };
const TAGS = [13, 15, 11, 187, 188, 190, 192] as const;

const fmtKwh = (n?: number) =>
  n == null
    ? "—"
    : `${new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(n)} kWh`;

// ✅ Matches your backend: start at yesterday 00:00:00, end at today 00:00:01
function yesterdayWindowForBackend() {
  const now = new Date();

  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  end.setSeconds(1, 0); // +1 second so we get the second midnight bucket

  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.000`;

  return { timeBegin: fmt(start), timeEnd: fmt(end) };
}

function deltaForTag(rows: ProxyRow[]) {
  if (!rows || rows.length < 2) return undefined;
  const sorted = [...rows].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const d = Number(sorted.at(-1)!.value) - Number(sorted[0].value);
  return Number.isFinite(d) ? d : undefined;
}

/* ---------------- your existing GET ---------------- */
async function getData() {
  try {
    const res = await fetch("/api/v1/solar", {
      method: "GET",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to fetch data");
    const result = await res.json();
    return result;
  } catch (error) {
    console.log("error: " + error);
    return { data: [] as SolarData[] };
  }
}

/* ====================================================================== */

const Page = () => {
  const [data, setData] = useState<SolarData[]>([]);

  // yesterday kWh state
  const [yesterdayKwhByTag, setYesterdayKwhByTag] = useState<Record<number, number>>({});
  const [energyLoading, setEnergyLoading] = useState(false);
  const [energyErr, setEnergyErr] = useState<string | null>(null);

  // donut percentages
  const [percentageUsedDataS3, setPercentageUsedDataS3] = useState("");
  const [percentageUsedDataS4, setPercentageUsedDataS4] = useState("");
  const [percentageUsedDataS5, setPercentageUsedDataS5] = useState("");
  const [percentageUsedDataS1AM17, setPercentageUsedDataS1AM17] = useState("");
  const [percentageUsedDataS2AM17, setPercentageUsedDataS2AM17] = useState("");
  const [percentageUsedDataSAM8, setPercentageUsedDataSAM8] = useState("");
  const [percentageUsedDataSAM18, setPercentageUsedDataSAM18] = useState("");
  const [percentageUsedDataSAM19, setPercentageUsedDataSAM19] = useState("");
  const [percentageUsedDataSAM19_2, setPercentageUsedDataSAM19_2] = useState("");

  // load your existing /api/v1/solar data once
  useEffect(() => {
    (async () => {
      const result = await getData();
      setData(result.data ?? []);
    })();
  }, []);

  // load yesterday energy once (no interval/delay)
  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      try {
        setEnergyLoading(true);
        setEnergyErr(null);

        const { timeBegin, timeEnd } = yesterdayWindowForBackend();

        const res = await fetch("/api/v1/proxy-query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          signal: abort.signal,
          body: JSON.stringify({
            valueIds: TAGS,
            valueNames: Array(TAGS.length).fill(""),
            timeBegin,
            timeEnd,
            timeStep: "86400,1",
            sqlClause: "",
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw: ProxyRow[] = await res.json();

        const by = new Map<number, ProxyRow[]>();
        for (const r of raw ?? []) {
          const arr = by.get(r.tagId) ?? [];
          arr.push({ ...r, value: Number(r.value) });
          by.set(r.tagId, arr);
        }

        const out: Record<number, number> = {};
        for (const id of TAGS) {
          const d = deltaForTag(by.get(id) ?? []);
          if (d != null) out[id] = d;
        }
        setYesterdayKwhByTag(out);
      } catch (e: any) {
        if (e?.name !== "AbortError") setEnergyErr(e?.message ?? "Failed to fetch");
      } finally {
        setEnergyLoading(false);
      }
    })();
    return () => abort.abort();
  }, []);

  /* ---------------- donut chart function (unchanged) ---------------- */
  const initializeChart = (canvasId: string, values: number[], totalCapacity: number) => {
    const ctx = document.getElementById(canvasId) as HTMLCanvasElement;
    let chartStatus = Chart.getChart(ctx);
    if (chartStatus !== undefined) chartStatus.destroy();

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
          legend: { position: "bottom" },
          tooltip: { enabled: false },
        },
        animation: false,
      },
    });

    chart.update();
    return percentageUsed;
  };

  /* ---------------- wire charts ---------------- */
  useEffect(() => {
    if (data.length > 0) {
      setPercentageUsedDataS3(initializeChart("solar3", data.map(i => i.solar3_kW), 500));
      setPercentageUsedDataS4(initializeChart("solar4", data.map(i => i.solar4_kW), 625));
      setPercentageUsedDataS5(initializeChart("solar5", data.map(i => i.solar5_kW), 500));
      setPercentageUsedDataS1AM17(initializeChart("am17-solar1", data.map(i => i.AM17_solar1_kW), 908));
      setPercentageUsedDataS2AM17(initializeChart("am17-solar2", data.map(i => i.AM17_solar2_kW), 750));
      setPercentageUsedDataSAM8(initializeChart("am8-solar", data.map(i => i.AM8_solar_kW), 925));
      setPercentageUsedDataSAM18(initializeChart("am18-solar", data.map(i => i.AM18_solar_kW), 675));
      setPercentageUsedDataSAM19(initializeChart("am19-solar", data.map(i => i.AM19_solar_kW), 6000));
      setPercentageUsedDataSAM19_2(initializeChart("am19-2-solar", data.map(i => i.AM19_2_solar_kW), 6000));
    }
  }, [data]);

  /* --------------------- render --------------------- */
  return (
    <div className="">
      <h1 className="pt-5 text-center text-xl font-bold">SOLAR Generation</h1>
      <p className="text-center pt-2">
        <span className="bg-blue-800 text-white px-5 py-[6px] rounded-full rounded-tr-none rounded-bl-none font-semibold">
          AM5 SOLAR
        </span>
      </p>

      <div className="p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* LT-3 */}
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">Solar LT-3</CardTitle>
              <a href="/solar/13" aria-label="LT-3 details">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </a>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div style={{ width: 100, height: 100, float: "left", position: "relative" }}>
                <div style={{ width: "100%", height: 40, position: "absolute", top: "55%", left: 0, marginTop: -20, lineHeight: "19px", textAlign: "center" }}>
                  {percentageUsedDataS3}%
                </div>
                <canvas id="solar3" width="100" height="100" />
              </div>
              <div>
                {data.map((item) => (
                  <div key={item.id} className="pt-3 text-base font-bold">
                    <p>Load {item.solar3_kW} kW</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">500 total capacity in KW</p>
              </div>
            </CardContent>
            <div className="border-t px-4 py-3 flex flex-wrap items-center justify-between text-sm sm:flex-nowrap gap-1">
              <span className="text-muted-foreground whitespace-nowrap">Energy Produced (Yesterday)</span>
              <span className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap tabular-nums">
                {energyLoading ? "Loading..." : energyErr ? "—" : fmtKwh(yesterdayKwhByTag[13])}
              </span>
            </div>
          </Card>

          {/* LT-4 */}
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">Solar LT-4</CardTitle>
              <a href="/solar/15" aria-label="LT-4 details">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </a>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div style={{ width: 100, height: 100, float: "left", position: "relative" }}>
                <div style={{ width: "100%", height: 40, position: "absolute", top: "55%", left: 0, marginTop: -20, lineHeight: "19px", textAlign: "center" }}>
                  {percentageUsedDataS4}%
                </div>
                <canvas id="solar4" width="100" height="100" />
              </div>
              <div>
                {data.map((item) => (
                  <div key={item.id} className="pt-3 text-base font-bold">
                    <p>Load {item.solar4_kW} kW</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">625 total capacity in KW</p>
              </div>
            </CardContent>
            <div className="border-t px-4 py-3 flex flex-wrap items-center justify-between text-sm sm:flex-nowrap gap-1">
              <span className="text-muted-foreground whitespace-nowrap">Energy Produced (Yesterday)</span>
              <span className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap tabular-nums">
                {energyLoading ? "Loading..." : energyErr ? "—" : fmtKwh(yesterdayKwhByTag[15])}
              </span>
            </div>
          </Card>

          {/* LT-5 */}
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">Solar LT-5</CardTitle>
              <a href="/solar/11" aria-label="LT-5 details">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </a>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div style={{ width: 100, height: 100, float: "left", position: "relative" }}>
                <div style={{ width: "100%", height: 40, position: "absolute", top: "55%", left: 0, marginTop: -20, lineHeight: "19px", textAlign: "center" }}>
                  {percentageUsedDataS5}%
                </div>
                <canvas id="solar5" width="100" height="100" />
              </div>
              <div>
                {data.map((item) => (
                  <div key={item.id} className="pt-3 text-base font-bold">
                    <p>Load {item.solar5_kW} kW</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">500 total capacity in KW</p>
              </div>
            </CardContent>
            <div className="border-t px-4 py-3 flex flex-wrap items-center justify-between text-sm sm:flex-nowrap gap-1">
              <span className="text-muted-foreground whitespace-nowrap">Energy Produced (Yesterday)</span>
              <span className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap tabular-nums">
                {energyLoading ? "Loading..." : energyErr ? "—" : fmtKwh(yesterdayKwhByTag[11])}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* AM17 */}
      <p className="text-center pt-2">
        <span className="bg-blue-600 text-white px-5 py-[6px] rounded-full rounded-tr-none rounded-bl-none font-semibold">
          AM17 SOLAR
        </span>
      </p>
      <div className="p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">Solar-1 AM17</CardTitle>
              <a href="/solar/188" aria-label="AM17 Solar 1 details">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </a>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div style={{ width: 100, height: 100, float: "left", position: "relative" }}>
                <div style={{ width: "100%", height: 40, position: "absolute", top: "55%", left: 0, marginTop: -20, lineHeight: "19px", textAlign: "center" }}>
                  {percentageUsedDataS1AM17}%
                </div>
                <canvas id="am17-solar1" width="100" height="100" />
              </div>
              <div>
                {data.map((item) => (
                  <div key={item.id} className="pt-3 text-base font-bold">
                    <p>Load {item.AM17_solar1_kW} kW</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">908 total capacity in KW</p>
              </div>
            </CardContent>
            <div className="border-t px-4 py-3 flex flex-wrap items-center justify-between text-sm sm:flex-nowrap gap-1">
              <span className="text-muted-foreground whitespace-nowrap">Energy Produced (Yesterday)</span>
              <span className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap tabular-nums">
                {energyLoading ? "Loading..." : energyErr ? "—" : fmtKwh(yesterdayKwhByTag[188])}
              </span>
            </div>
          </Card>

          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">Solar-2 AM17</CardTitle>
              <a href="/solar/190" aria-label="AM17 Solar 2 details">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </a>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div style={{ width: 100, height: 100, float: "left", position: "relative" }}>
                <div style={{ width: "100%", height: 40, position: "absolute", top: "55%", left: 0, marginTop: -20, lineHeight: "19px", textAlign: "center" }}>
                  {percentageUsedDataS2AM17}%
                </div>
                <canvas id="am17-solar2" width="100" height="100" />
              </div>
              <div>
                {data.map((item) => (
                  <div key={item.id} className="pt-3 text-base font-bold">
                    <p>Load {item.AM17_solar2_kW} kW</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">750 total capacity in KW</p>
              </div>
            </CardContent>
            <div className="border-t px-4 py-3 flex flex-wrap items-center justify-between text-sm sm:flex-nowrap gap-1">
              <span className="text-muted-foreground whitespace-nowrap">Energy Produced (Yesterday)</span>
              <span className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap tabular-nums">
                {energyLoading ? "Loading..." : energyErr ? "—" : fmtKwh(yesterdayKwhByTag[190])}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* AM8 */}
      <p className="text-center pt-2">
        <span className="bg-blue-500 text-white px-5 py-[6px] rounded-full rounded-tr-none rounded-bl-none font-semibold">
          AM8 SOLAR
        </span>
      </p>
      <div className="p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">AM-8 Solar</CardTitle>
              <a href="/solar/187" aria-label="AM-8 details">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </a>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div style={{ width: 100, height: 100, float: "left", position: "relative" }}>
                <div style={{ width: "100%", height: 40, position: "absolute", top: "55%", left: 0, marginTop: -20, lineHeight: "19px", textAlign: "center" }}>
                  {percentageUsedDataSAM8}%
                </div>
                <canvas id="am8-solar" width="100" height="100" />
              </div>
              <div>
                {data.map((item) => (
                  <div key={item.id} className="pt-3 text-base font-bold">
                    <p>Load {item.AM8_solar_kW} kW</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">925 total capacity in KW</p>
              </div>
            </CardContent>
            <div className="border-t px-4 py-3 flex flex-wrap items-center justify-between text-sm sm:flex-nowrap gap-1">
              <span className="text-muted-foreground whitespace-nowrap">Energy Produced (Yesterday)</span>
              <span className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap tabular-nums">
                {energyLoading ? "Loading..." : energyErr ? "—" : fmtKwh(yesterdayKwhByTag[187])}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* AM18 */}
      <p className="text-center pt-2">
        <span className="bg-blue-300 px-5 py-[6px] rounded-full rounded-tr-none rounded-bl-none font-semibold">
          AM18 SOLAR
        </span>
      </p>
      <div className="p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">AM-18 Solar</CardTitle>
              <a href="/solar/192" aria-label="AM-18 details">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </a>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div style={{ width: 100, height: 100, float: "left", position: "relative" }}>
                <div style={{ width: "100%", height: 40, position: "absolute", top: "55%", left: 0, marginTop: -20, lineHeight: "19px", textAlign: "center" }}>
                  {percentageUsedDataSAM18}%
                </div>
                <canvas id="am18-solar" width="100" height="100" />
              </div>
              <div>
                {data.map((item) => (
                  <div key={item.id} className="pt-3 text-base font-bold">
                    <p>Load {item.AM18_solar_kW} kW</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">675 total capacity in KW</p>
              </div>
            </CardContent>
            <div className="border-t px-4 py-3 flex flex-wrap items-center justify-between text-sm sm:flex-nowrap gap-1">
              <span className="text-muted-foreground whitespace-nowrap">Energy Produced (Yesterday)</span>
              <span className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap tabular-nums">
                {energyLoading ? "Loading..." : energyErr ? "—" : fmtKwh(yesterdayKwhByTag[192])}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* AM19 */}
      <p className="text-center pt-2">
        <span className="bg-blue-100 px-5 py-[6px] rounded-full rounded-tr-none rounded-bl-none font-semibold">
          AM19 SOLAR
        </span>
      </p>
      <div className="p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">AM-19 Solar</CardTitle>
              <a href="/solar/4454" aria-label="AM-19 details">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </a>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div style={{ width: 100, height: 100, float: "left", position: "relative" }}>
                <div style={{ width: "100%", height: 40, position: "absolute", top: "55%", left: 0, marginTop: -20, lineHeight: "19px", textAlign: "center" }}>
                  {percentageUsedDataSAM19}%
                </div>
                <canvas id="am19-solar" width="100" height="100" />
              </div>
              <div>
                {data.map((item) => (
                  <div key={item.id} className="pt-3 text-base font-bold">
                    <p>Load {item.AM19_solar_kW} kW</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">6000 total capacity in KW AM5</p>
              </div>
            </CardContent>
            <div className="border-t px-4 py-3 flex flex-wrap items-center justify-between text-sm sm:flex-nowrap gap-1">
              <span className="text-muted-foreground whitespace-nowrap">Energy Produced (Yesterday)</span>
              <span className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap tabular-nums">
                {energyLoading ? "Loading..." : energyErr ? "—" : fmtKwh(yesterdayKwhByTag[4454])}
              </span>
            </div>
          </Card>

          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <CardTitle className="text-xl font-bold">AM-19_2 Solar</CardTitle>
              <a href="/solar/4457" aria-label="AM-19_2 details">
                <svg xmlns="http://www.w3.org/0/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </a>
            </CardHeader>
            <CardContent className="flex justify-evenly">
              <div style={{ width: 100, height: 100, float: "left", position: "relative" }}>
                <div style={{ width: "100%", height: 40, position: "absolute", top: "55%", left: 0, marginTop: -20, lineHeight: "19px", textAlign: "center" }}>
                  {percentageUsedDataSAM19_2}%
                </div>
                <canvas id="am19-2-solar" width="100" height="100" />
              </div>
              <div>
                {data.map((item) => (
                  <div key={item.id} className="pt-3 text-base font-bold">
                    <p>Load {item.AM19_2_solar_kW} kW</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">6000 total capacity in KW AM17</p>
              </div>
            </CardContent>
            <div className="border-t px-4 py-3 flex flex-wrap items-center justify-between text-sm sm:flex-nowrap gap-1">
              <span className="text-muted-foreground whitespace-nowrap">Energy Produced (Yesterday)</span>
              <span className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap tabular-nums">
                {energyLoading ? "Loading..." : energyErr ? "—" : fmtKwh(yesterdayKwhByTag[4457])}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Page;
