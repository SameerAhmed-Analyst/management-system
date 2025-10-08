'use client';

import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';

type ApiRow = { tagId: number; timestamp: string; value: number };
type RangeKey = 'today' | 'yesterday' | 'last7' | 'thisWeek' | 'custom';
type StepOpt = 'auto' | '60,1' | '900,1' | '3600,1' | '86400,1';

// ===== helpers =====
function fmtApi(tsLocalInput: string) {
  // backend expects: "YYYY-MM-DD HH:mm:ss.SSS" (local)
  return dayjs(tsLocalInput).format('YYYY-MM-DD HH:mm:ss.SSS');
}
function fmtNice(n: number | null | undefined, digits = 3) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: digits });
}
function fmtRangeSummary(start: string, end: string) {
  const s = dayjs(start).format('YYYY-MM-DD HH:mm');
  const e = dayjs(end).format('YYYY-MM-DD HH:mm');
  return `${s} → ${e}`;
}
function pickAutoTimeStep(startLocal: string, endLocal: string): Exclude<StepOpt, 'auto'> {
  const diffSec = dayjs(endLocal).diff(dayjs(startLocal), 'second');
  if (diffSec <= 2 * 3600) return '60,1';        // <= 2 hours → 1 minute
  if (diffSec <= 12 * 3600) return '900,1';        // <= 12h → 15 min
  if (diffSec <= 2 * 86400) return '3600,1';      // <= 2 days → 1 hour
  if (diffSec <= 30 * 86400) return '86400,1';    // <= 30 days → 1 day
  return '86400,1';                               // > 30 days → 1 day
}

// ===== Positive-only responsive bar chart (SVG) =====
function DeltaBarChart({
  deltas,                         // positive-only deltas
  height = 224,                   // 56 * 4 (Tailwind h-56-ish)
  className = '',
  title = 'Per-step usage (Δ)',
}: {
  deltas: { ts: string; delta: number }[];
  height?: number;
  className?: string;
  title?: string;
}) {
  const n = deltas.length;

  // min/max for scaling with headroom (no negatives)
  const { min, max } = useMemo(() => {
    let mx = 0;
    for (const d of deltas) {
      if (d.delta > mx) mx = d.delta;
    }
    if (mx === 0) mx = 1; // avoid divide-by-zero; still render axis
    const pad = mx * 0.05;
    return { min: 0, max: mx + pad };
  }, [deltas]);

  const h = height;
  const yOf = (v: number) => h - ((v - min) / (max - min)) * h;

  // layout
  const bar = 1;
  const gap = 0.28;
  const cw = n * (bar + gap) + (n > 0 ? gap : 0);

  const startLabel = deltas[0]?.ts ? dayjs(deltas[0].ts).format('MM-DD HH:mm') : '';
  const midLabel = n > 0 ? dayjs(deltas[Math.floor(n / 2)].ts).format('MM-DD HH:mm') : '';
  const endLabel = deltas[n - 1]?.ts ? dayjs(deltas[n - 1].ts).format('MM-DD HH:mm') : '';

  // grid
  const ticks = 5;
  const gridVals = Array.from({ length: ticks + 1 }, (_, i) => min + (i * (max - min)) / ticks);

  // hover (works on touch)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const hover = hoverIdx != null ? deltas[hoverIdx] : null;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-end justify-between mb-2 gap-2">
        <h3 className="text-sm md:text-base font-medium text-gray-800">{title}</h3>
        <div className="text-xs md:text-sm text-gray-600">
          {hover ? (
            <>
              <span className="font-medium">{dayjs(hover.ts).format('YYYY-MM-DD HH:mm')}</span>{' • '}
              Δ {fmtNice(hover.delta, 3)}
            </>
          ) : (
            <>max Δ: {fmtNice(Math.max(0, ...deltas.map(d => d.delta)), 3)}</>
          )}
        </div>
      </div>

      <div className="w-full bg-gray-50 border border-gray-200 rounded relative overflow-hidden">
        <svg
          viewBox={`0 0 ${cw} ${h}`}
          className="w-full h-40 sm:h-56"       // shorter on small screens
          role="img"
          aria-label={`${title}. ${n} bars.`}
          preserveAspectRatio="none"
        >
          {/* Gridlines + value ticks */}
          {gridVals.map((gv, i) => (
            <g key={`grid-${i}`}>
              <line x1={0} y1={yOf(gv)} x2={cw} y2={yOf(gv)} stroke="#e5e7eb" strokeWidth={0.05} />
              {i > 0 && i < gridVals.length - 1 && (
                <text x={0.3} y={yOf(gv) - 0.6} fontSize="1.2" fill="#9ca3af">
                  {fmtNice(gv, 2)}
                </text>
              )}
            </g>
          ))}

          {/* Bars (always positive, from bottom up) */}
          {deltas.map((d, i) => {
            const x = gap + i * (bar + gap);
            const yTop = yOf(d.delta);
            const heightPx = h - yTop;
            const isHover = hoverIdx === i;

            return (
              <g key={`${d.ts}-${i}`}>
                <rect
                  x={x}
                  y={yTop}
                  width={bar}
                  height={heightPx}
                  fill="#2563eb"
                  opacity={isHover ? 1 : 0.9}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  onTouchStart={() => setHoverIdx(i)}
                >
                  <title>{`${dayjs(d.ts).format('YYYY-MM-DD HH:mm')} • Δ ${fmtNice(d.delta, 3)}`}</title>
                </rect>
                {isHover && (
                  <rect x={x - 0.12} y={0} width={bar + 0.24} height={h} fill="#000" opacity={0.06} />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mt-1">
        <span className="truncate">{startLabel}</span>
        <span className="truncate">{midLabel}</span>
        <span className="truncate">{endLabel}</span>
      </div>
    </div>
  );
}

// ===== main page =====
export default function SolarPage({ id }: { id: string }) {
  // datetime state
  const [startLocal, setStartLocal] = useState(
    dayjs().subtract(1, 'day').startOf('day').format('YYYY-MM-DDTHH:mm')
  );
  const [endLocal, setEndLocal] = useState(
    dayjs().subtract(1, 'day').endOf('day').format('YYYY-MM-DDTHH:mm')
  );
  const [activeRange, setActiveRange] = useState<RangeKey>('yesterday');

  // timeStep selector
  const [timeStepMode, setTimeStepMode] = useState<StepOpt>('auto');

  // data state
  const [data, setData] = useState<ApiRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [showCalculation, setShowCalculation] = useState(false);

  // derived
  const idNum = useMemo(() => Number(id), [id]);
  const rangeInvalid = dayjs(endLocal).isBefore(dayjs(startLocal));
  const startApi = useMemo(() => fmtApi(startLocal), [startLocal]);
  const endApi = useMemo(() => fmtApi(endLocal), [endLocal]);

  const chosenTimeStep = useMemo<Exclude<StepOpt, 'auto'>>(
    () => (timeStepMode === 'auto' ? pickAutoTimeStep(startLocal, endLocal) : timeStepMode),
    [timeStepMode, startLocal, endLocal]
  );

  // handlers
  const handleRangeChange = (range: RangeKey) => {
    setActiveRange(range);
    switch (range) {
      case 'today':
        setStartLocal(dayjs().startOf('day').format('YYYY-MM-DDTHH:mm'));
        setEndLocal(dayjs().endOf('day').format('YYYY-MM-DDTHH:mm'));
        break;
      case 'yesterday':
        setStartLocal(dayjs().subtract(1, 'day').startOf('day').format('YYYY-MM-DDTHH:mm'));
        setEndLocal(dayjs().subtract(1, 'day').endOf('day').format('YYYY-MM-DDTHH:mm'));
        break;
      case 'last7':
        setStartLocal(dayjs().subtract(7, 'day').startOf('day').format('YYYY-MM-DDTHH:mm'));
        setEndLocal(dayjs().endOf('day').format('YYYY-MM-DDTHH:mm'));
        break;
      case 'thisWeek':
        setStartLocal(dayjs().startOf('week').format('YYYY-MM-DDTHH:mm'));
        setEndLocal(dayjs().endOf('week').format('YYYY-MM-DDTHH:mm'));
        break;
      case 'custom':
        // inputs will be shown
        break;
    }
  };

  // fetch
  useEffect(() => {
    if (!idNum || !Number.isFinite(idNum) || rangeInvalid) return;

    const abort = new AbortController();
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/v1/proxy-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abort.signal,
          body: JSON.stringify({
            valueIds: [idNum],
            valueNames: [''],
            timeBegin: startApi,
            timeEnd: endApi,
            sqlClause: '',
            timeStep: chosenTimeStep,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const raw: ApiRow[] = await res.json();
        const cleaned = (raw ?? [])
          .map(r => ({
            tagId: r.tagId,
            timestamp: r.timestamp, // "YYYY-MM-DDTHH:mm:ss" (no timezone)
            value: typeof r.value === 'number' ? r.value : Number(r.value),
          }))
          .filter(r => Number.isFinite(r.value) && r.timestamp)
          .sort((a, b) => dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf());

        setData(cleaned);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError(e?.message ?? 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => abort.abort();
  }, [idNum, startApi, endApi, chosenTimeStep, rangeInvalid]);

  // totals
  // const totalUsedSimple = useMemo(() => {
  //   if (!showCalculation || data.length < 2) return null;
  //   return data[data.length - 1].value - data[0].value;
  // }, [showCalculation, data]);

  const totalUsedSimple = useMemo(() => {
    if (data.length < 2) return null;
    return data[data.length - 1].value - data[0].value;
  }, [data]);

  // const totalUsedResetAware = useMemo(() => {
  //   if (!showCalculation || data.length < 2) return null;
  //   let sum = 0;
  //   for (let i = 1; i < data.length; i++) {
  //     const d = data[i].value - data[i - 1].value;
  //     if (d > 0) sum += d; // ignore negatives (resets/rollovers)
  //   }
  //   return sum;
  // }, [showCalculation, data]);

  // per-step deltas (now positive-only; negatives removed)
  const deltas = useMemo(() => {
    if (data.length < 2) return [] as { ts: string; delta: number }[];
    const out: { ts: string; delta: number }[] = [];
    for (let i = 1; i < data.length; i++) {
      const delta = data[i].value - data[i - 1].value;
      if (delta > 0) {
        out.push({ ts: data[i].timestamp, delta });
      }
    }
    return out;
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-4xl bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-4 sm:p-6 md:p-8 space-y-5">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Solar Data</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {/* {timeStepMode === 'auto' ? `Auto resolution → ${chosenTimeStep}` : `Resolution → ${timeStepMode}`} */}
            {/* {' • '} */}
            {/* {loading ? 'Loading…' : error ? `Error: ${error}` : `Points: ${data.length}`} */}
          </p>
        </header>

        {/* Sticky controls (nice on mobile) */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 -mx-4 px-4 sm:mx-0 sm:px-0 py-2">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            {/* Quick Range Buttons */}
            <div className="flex flex-wrap gap-2">
              {([
                { label: 'Today', value: 'today' },
                { label: 'Yesterday', value: 'yesterday' },
                { label: 'Last 7 Days', value: 'last7' },
                { label: 'This Week', value: 'thisWeek' },
                { label: 'Custom', value: 'custom' },
              ] as { label: string; value: RangeKey }[]).map((r) => (
                <button
                  key={r.value}
                  onClick={() => handleRangeChange(r.value)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium border touch-manipulation active:scale-[0.99] ${
                    activeRange === r.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 hover:bg-blue-50 border-gray-300'
                  }`}
                  aria-pressed={activeRange === r.value}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Resolution selector — show only for Custom */}
            {activeRange === 'custom' && (
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <span>Resolution</span>
                <select
                  className="border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm"
                  value={timeStepMode}
                  onChange={(e) => setTimeStepMode(e.target.value as StepOpt)}
                  title="Aggregation interval"
                >
                  <option value="auto">Auto</option>
                  <option value="60,1">1 Minute</option>
                  <option value="900,1">15 Minutes</option>
                  <option value="3600,1">1 Hour</option>
                  <option value="86400,1">1 Day</option>
                </select>
              </label>
            )}
          </div>

          {/* Range summary or inputs (mobile friendly) */}
          {activeRange === 'custom' ? (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label htmlFor="startTime" className="text-sm text-gray-700">
                Start Time
                <input
                  type="datetime-local"
                  name="startTime"
                  id="startTime"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                  className="mt-1 block w-full border bg-white border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </label>
              <label htmlFor="endTime" className="text-sm text-gray-700">
                End Time
                <input
                  type="datetime-local"
                  name="endTime"
                  id="endTime"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                  className="mt-1 block w-full border bg-white border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </label>
            </div>
          ) : (
            <div className="mt-3 text-sm text-gray-700">
              <span className="font-medium">Time Range:</span>{' '}
              <span className="text-gray-600">{fmtRangeSummary(startLocal, endLocal)}</span>
            </div>
          )}

          {rangeInvalid && <p className="mt-2 text-sm text-red-600">End time must be after start time.</p>}
        </div>

        {/* Results — always visible */}
        {data.length >= 2 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-5 space-y-2">
            <p className="text-gray-700 text-sm sm:text-base">
              <strong>Initial Value:</strong> {fmtNice(data[0].value, 3)}
            </p>
            <p className="text-gray-700 text-sm sm:text-base">
              <strong>Last Value:</strong> {fmtNice(data[data.length - 1].value, 3)}
            </p>
            <p className="text-blue-700 text-base sm:text-lg font-semibold">
              {/* Total Used (last − first):  */}{fmtNice(totalUsedSimple, 2)} kWh
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Not enough data to compute (need ≥ 2 points).</p>
        )}

        {/* Chart */}
        {deltas.length > 0 && (
          <DeltaBarChart
            deltas={deltas}
            height={224} // responsive inside component
            className="mt-2"
            title="Per-step usage (Δ value)"
          />
        )}
      </div>
    </div>
  );
}
