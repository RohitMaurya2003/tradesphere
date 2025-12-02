import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function OptionsChain() {
  const [symbol, setSymbol] = useState('NIFTY');
  const [chain, setChain] = useState([]);
  const [meta, setMeta] = useState({ spot: null, expiry: null, lotSize: 25 });
  const [showGreeks, setShowGreeks] = useState(true);
  const [greeksCache, setGreeksCache] = useState({});
  const [basket, setBasket] = useState([]);
  const [expiry, setExpiry] = useState('');
  const [payoff, setPayoff] = useState(null);

  async function loadChain() {
    try {
      const { data } = await axios.get('/api/derivatives/options/chain', { params: { symbol } });
      setChain(data.chain || []);
      setMeta({ spot: data.spot, expiry: data.expiry, lotSize: data.lotSize });
      if (!expiry && data.expiry) setExpiry(new Date(data.expiry).toISOString().slice(0, 10));
    } catch (e) {
      toast.error('Failed to load options chain');
    }
  }

  async function getGreeks(strike, premium, type) {
    const key = `${strike}-${premium}-${type}`;
    if (greeksCache[key]) return greeksCache[key];
    try {
      const iv = chain.find(r => r.strike === strike)?.[type.toLowerCase()]?.iv || 20;
      const timeDays = 14;
      const { data } = await axios.post('/api/derivatives/options/greeks', {
        spot: meta.spot,
        strike,
        iv,
        timeDays,
        rate: 0.06,
        type
      });
      setGreeksCache(prev => ({ ...prev, [key]: data }));
      return data;
    } catch (e) {
      return null;
    }
  }

  useEffect(() => { loadChain(); /* eslint-disable-next-line */ }, []);

  const atmStrike = useMemo(() => {
    if (!chain.length || !meta.spot) return null;
    return chain.reduce((prev, cur) => (Math.abs(cur.strike - meta.spot) < Math.abs(prev.strike - meta.spot) ? cur : prev), chain[0]);
  }, [chain, meta.spot]);

  return (
    <div className="p-4">
      {/* Header controls */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <input
          value={symbol}
          onChange={e => setSymbol(e.target.value.toUpperCase())}
          className="border rounded px-3 py-2"
          placeholder="Symbol (e.g., NIFTY, RELIANCE)"
        />
        <input
          type="date"
          value={expiry}
          onChange={e => setExpiry(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <button onClick={loadChain} className="bg-blue-600 text-white px-4 py-2 rounded">Refresh</button>
        <button onClick={() => setShowGreeks(s => !s)} className="bg-gray-700 text-white px-4 py-2 rounded">
          {showGreeks ? 'Hide Greeks' : 'Show Greeks'}
        </button>
      </div>

      <div className="text-sm text-gray-600 mb-2">Spot: {meta.spot} | Expiry: {meta.expiry ? new Date(meta.expiry).toLocaleDateString() : '-' } | Lot: {meta.lotSize}</div>

      {/* Chain grid: Calls | Strike | Puts */}
      <div className="grid grid-cols-12 gap-2">
        {/* Calls side */}
        <div className="col-span-5 bg-green-50 rounded border">
          <div className="grid grid-cols-10 gap-1 px-2 py-2 text-[11px] font-semibold text-gray-700 border-b">
            <div className="col-span-2">OI</div>
            <div className="col-span-2">LTP</div>
            <div>IV%</div>
            {showGreeks && (<>
              <div>Δ</div>
              <div>Θ</div>
              <div>Γ</div>
              <div>V</div>
              <div>R</div>
            </>)}
          </div>
          <div>
            {chain.map((row) => {
              const isATM = atmStrike && row.strike === atmStrike.strike;
              const key = `C-${row.strike}-${row.call.premium}`;
              return (
                <RowLeft
                  key={key}
                  isATM={isATM}
                  strike={row.strike}
                  side="CALL"
                  data={row.call}
                  showGreeks={showGreeks}
                  getGreeks={getGreeks}
                  onAdd={() => setBasket(b => [...b, { side: 'CALL', strike: row.strike, premium: row.call.premium, qty: 1 }])}
                />
              );
            })}
          </div>
        </div>

        {/* Strike center */}
        <div className="col-span-2 bg-white rounded border">
          <div className="px-2 py-2 text-[11px] font-semibold text-gray-700 border-b">Strike</div>
          {chain.map((row) => {
            const isATM = atmStrike && row.strike === atmStrike.strike;
            return (
              <div key={`S-${row.strike}`} className={`px-2 py-2 text-center border-b text-sm ${isATM ? 'bg-yellow-50 font-semibold' : ''}`}>
                {row.strike}
                {isATM && (
                  <div className="mt-1 h-1 bg-yellow-300 rounded" />
                )}
              </div>
            );
          })}
        </div>

        {/* Puts side */}
        <div className="col-span-5 bg-red-50 rounded border">
          <div className="grid grid-cols-10 gap-1 px-2 py-2 text-[11px] font-semibold text-gray-700 border-b">
            {showGreeks && (<>
              <div>Δ</div>
              <div>Θ</div>
              <div>Γ</div>
              <div>V</div>
              <div>R</div>
            </>)}
            <div>IV%</div>
            <div className="col-span-2">LTP</div>
            <div className="col-span-2">OI</div>
          </div>
          <div>
            {chain.map((row) => {
              const isATM = atmStrike && row.strike === atmStrike.strike;
              const key = `P-${row.strike}-${row.put.premium}`;
              return (
                <RowRight
                  key={key}
                  isATM={isATM}
                  strike={row.strike}
                  side="PUT"
                  data={row.put}
                  showGreeks={showGreeks}
                  getGreeks={getGreeks}
                  onAdd={() => setBasket(b => [...b, { side: 'PUT', strike: row.strike, premium: row.put.premium, qty: 1 }])}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-700">Basket: {basket.length} legs</div>
        <div className="flex gap-2">
          <button
            onClick={() => setBasket([])}
            className="px-3 py-2 bg-gray-200 rounded"
          >Clear Basket</button>
          <button
            onClick={async () => {
              try {
                if (!basket.length) { toast.error('Add legs to basket'); return; }
                const legs = basket.map(b => ({ type: b.side, strike: b.strike, premium: b.premium, qty: b.qty }));
                const { data } = await axios.post('/api/derivatives/options/payoff', { legs, spot: meta.spot });
                setPayoff(data);
              } catch (e) {
                toast.error('Failed to load payoff');
              }
            }}
            className="px-3 py-2 bg-indigo-600 text-white rounded"
          >Show Payoff</button>
        </div>
      </div>

      {/* Payoff chart */}
      {payoff && (
        <div className="mt-3 p-3 border rounded bg-white">
          <div className="text-sm font-semibold mb-2">Combined Payoff</div>
          <MiniChart points={payoff.points} spot={meta.spot} />
        </div>
      )}
    </div>
  );
}

function GreeksInline({ strike, premium, type, getGreeks }) {
  const [g, setG] = useState(null);
  useEffect(() => { (async () => { const r = await getGreeks(strike, premium, type); setG(r); })(); }, [strike, premium, type]);
  if (!g) return (
    <>
      <span className="text-gray-400">…</span>
      <span className="text-gray-400">…</span>
      <span className="text-gray-400">…</span>
      <span className="text-gray-400">…</span>
      <span className="text-gray-400">…</span>
    </>
  );
  return (
    <>
      <span>{g.delta}</span>
      <span>{g.theta}</span>
      <span>{g.gamma}</span>
      <span>{g.vega}</span>
      <span>{g.rho}</span>
    </>
  );
}

function MiniChart({ points = [], spot }) {
  const width = 640;
  const height = 220;
  const padding = 32;
  if (!points.length) return null;
  const xs = points.map(p => p.underlying);
  const ys = points.map(p => p.pnl);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const scaleX = x => padding + ((x - minX) / (maxX - minX || 1)) * (width - padding * 2);
  const scaleY = y => height - padding - ((y - minY) / (maxY - minY || 1)) * (height - padding * 2);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${scaleX(p.underlying)},${scaleY(p.pnl)}`).join(' ');
  const spotX = scaleX(spot || (minX + maxX) / 2);
  return (
    <svg width={width} height={height}>
      <rect x={0} y={0} width={width} height={height} fill="#ffffff" />
      {/* Axis */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ddd" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ddd" />
      {/* Zero PnL line */}
      <line x1={padding} y1={scaleY(0)} x2={width - padding} y2={scaleY(0)} stroke="#aaa" strokeDasharray="4 4" />
      {/* Spot marker */}
      <line x1={spotX} y1={padding} x2={spotX} y2={height - padding} stroke="#f59e0b" strokeDasharray="3 3" />
      {/* Payoff path */}
      <path d={path} fill="none" stroke="#4f46e5" strokeWidth={2} />
    </svg>
  );
}

function LtpBar({ price = 0, max = 0, color = 'bg-green-500' }) {
  const pct = Math.min(100, Math.round(((price || 0) / (max || 1)) * 100));
  return (
    <div className="w-full h-2 bg-gray-200 rounded">
      <div className={`h-2 ${color} rounded`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function RowLeft({ isATM, strike, side, data, showGreeks, getGreeks, onAdd }) {
  const maxLtp =  Math.max(1, data.premium * 1.5);
  return (
    <div className={`grid grid-cols-10 gap-1 items-center px-2 py-2 border-b text-sm ${isATM ? 'bg-yellow-50' : ''}`}>
      <div className="col-span-2 flex items-center gap-1">
        <span className="min-w-[52px]">{data.oi}</span>
        <button onClick={onAdd} className="px-2 py-1 text-[11px] bg-emerald-600 text-white rounded">Buy</button>
      </div>
      <div className="col-span-2">
        <div className="flex items-center justify-between">
          <span>{data.premium}</span>
        </div>
        <LtpBar price={data.premium} max={maxLtp} color="bg-green-500" />
      </div>
      <div>{data.iv}</div>
      {showGreeks && (
        <div className="col-span-5 grid grid-cols-5 gap-1 text-[12px] text-gray-800">
          <GreeksInline strike={strike} premium={data.premium} type={side} getGreeks={getGreeks} />
        </div>
      )}
    </div>
  );
}

function RowRight({ isATM, strike, side, data, showGreeks, getGreeks, onAdd }) {
  const maxLtp = Math.max(1, data.premium * 1.5);
  return (
    <div className={`grid grid-cols-10 gap-1 items-center px-2 py-2 border-b text-sm ${isATM ? 'bg-yellow-50' : ''}`}>
      {showGreeks && (
        <div className="col-span-5 grid grid-cols-5 gap-1 text-[12px] text-gray-800">
          <GreeksInline strike={strike} premium={data.premium} type={side} getGreeks={getGreeks} />
        </div>
      )}
      <div>{data.iv}</div>
      <div className="col-span-2">
        <div className="flex items-center justify-between">
          <span>{data.premium}</span>
        </div>
        <LtpBar price={data.premium} max={maxLtp} color="bg-red-500" />
      </div>
      <div className="col-span-2 flex items-center gap-1">
        <span className="min-w-[52px]">{data.oi}</span>
        <button onClick={onAdd} className="px-2 py-1 text-[11px] bg-rose-600 text-white rounded">Buy</button>
      </div>
    </div>
  );
}
