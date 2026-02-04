import { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import { Activity, Battery, Disc, Cpu, Server, Zap, HardDrive, Thermometer } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from './lib/utils'

function App() {
  const [metrics, setMetrics] = useState(null)
  const [history, setHistory] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const ws = useRef(null)

  useEffect(() => {
    connectWs()
    return () => {
      if (ws.current) ws.current.close()
    }
  }, [])

  const connectWs = () => {
    ws.current = new WebSocket('ws://localhost:8000/ws')

    ws.current.onopen = () => {
      setIsConnected(true)
      console.log('Connected to backend')
    }

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMetrics(data)
      setHistory(prev => {
        const newHistory = [...prev, { ...data, time: new Date().toLocaleTimeString() }]
        if (newHistory.length > 20) newHistory.shift()
        return newHistory
      })
    }

    ws.current.onclose = () => {
      setIsConnected(false)
      setTimeout(connectWs, 3000) // Reconnect
    }
  }

  if (!metrics) return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="animate-pulse flex flex-col items-center">
        <Activity className="w-12 h-12 text-blue-500 mb-4" />
        <p className="text-xl font-mono text-blue-400">CONNECTING TO SYSTEM...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 font-sans selection:bg-blue-500/30 selection:text-blue-200">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
              MEMORAID <span className="text-white/60 font-light">SYSTEM MONITOR</span>
            </h1>
            <p className="text-neutral-500 mt-2 font-mono text-sm">
              <span className={cn("inline-block w-2 h-2 rounded-full mr-2", isConnected ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-red-500")}></span>
              STATUS: {isConnected ? "ONLINE" : "OFFLINE"} / {metrics.timestamp.split('T')[1].split('.')[0]}
            </p>
          </div>
          <div className="flex gap-4">
            <StatsBadge icon={<Battery className="w-4 h-4" />} value={`${metrics.battery.percent}%`} label={metrics.battery.power_plugged ? "CHARGING" : "DISCHARGING"} color="text-green-400" />
            <StatsBadge icon={<Thermometer className="w-4 h-4" />} value="45°C" label="AVG TEMP" color="text-orange-400" />
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* CPU Widget */}
          <GlassCard className="col-span-1 lg:col-span-2 row-span-2">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2"><Cpu className="text-blue-500" /> CPU</h2>
                <div className="text-4xl font-mono font-black mt-2 text-white/90">
                  {metrics.cpu.total_usage}%
                </div>
                <div className="text-sm text-neutral-400 font-mono mt-1">
                  {(metrics.cpu.freq_current / 1000).toFixed(2)} GHz / {metrics.cpu.cores_physical} Cores
                </div>
              </div>
              <div className="text-right">
                <RadialProgress value={metrics.cpu.total_usage} color="#3b82f6" />
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cpu.total_usage" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#cpuGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Memory Widget */}
          <GlassCard>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Server className="text-purple-500" /> MEMORY</h2>
            <div className="flex justify-between items-end mb-4">
              <div>
                <span className="text-3xl font-mono font-bold">{metrics.memory.percent}%</span>
                <span className="text-sm text-neutral-500 block">{(metrics.memory.used / 1024 / 1024 / 1024).toFixed(1)} GB / {(metrics.memory.total / 1024 / 1024 / 1024).toFixed(1)} GB</span>
              </div>
              <div className="h-2 w-24 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${metrics.memory.percent}%` }} />
              </div>
            </div>
            <div className="space-y-2 text-sm text-neutral-400">
              <div className="flex justify-between border-b border-white/5 pb-1"><span>Available</span> <span>{(metrics.memory.available / 1024 / 1024 / 1024).toFixed(1)} GB</span></div>
              <div className="flex justify-between border-b border-white/5 pb-1"><span>Free</span> <span>{(metrics.memory.free / 1024 / 1024 / 1024).toFixed(1)} GB</span></div>
            </div>
          </GlassCard>

          {/* Disk Widget */}
          <GlassCard>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><HardDrive className="text-pink-500" /> STORAGE</h2>
            {metrics.disk.partitions.map((disk, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-mono text-pink-300">{disk.mountpoint}</span>
                  <span className="text-neutral-400">{disk.percent}%</span>
                </div>
                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${disk.percent}%` }}
                    className="h-full bg-pink-500"
                  />
                </div>
                <div className="text-xs text-neutral-500 text-right">
                  {(disk.used / 1024 / 1024 / 1024).toFixed(1)} GB used of {(disk.total / 1024 / 1024 / 1024).toFixed(1)} GB
                </div>
              </div>
            ))}
          </GlassCard>

          {/* GPU Widget */}
          <GlassCard className="col-span-1 lg:col-span-3">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-6"><Zap className="text-yellow-400" /> GPU ACCELERATION</h2>
                {metrics.gpu.length > 0 ? metrics.gpu.map((gpu, i) => (
                  <div key={i} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricBox label="LOAD" value={`${gpu.load.toFixed(1)}%`} color="text-yellow-400" />
                    <MetricBox label="TEMP" value={`${gpu.temperature}°C`} color="text-orange-400" />
                    <MetricBox label="VRAM USED" value={`${gpu.memory_used.toFixed(0)} MB`} color="text-yellow-200" />
                    <MetricBox label="VRAM FREE" value={`${gpu.memory_free.toFixed(0)} MB`} color="text-neutral-400" />
                  </div>
                )) : (
                  <div className="h-32 flex items-center justify-center text-neutral-500 bg-white/5 rounded-lg border border-white/5 border-dashed">
                    NO DEDICATED GPU DETECTED
                  </div>
                )}
              </div>
              <div className="w-full md:w-1/3">
                <h3 className="text-sm font-bold text-neutral-500 mb-2">NETWORK / IO ACTIVITY</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                    <span className="text-xs text-neutral-400">DISK READ</span>
                    <span className="font-mono font-bold text-emerald-400">{(metrics.disk.io.read_count / 100).toFixed(0)} IOPs</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                    <span className="text-xs text-neutral-400">DISK WRITE</span>
                    <span className="font-mono font-bold text-blue-400">{(metrics.disk.io.write_count / 100).toFixed(0)} IOPs</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

        </div>
      </div>
    </div>
  )
}

// Components

function GlassCard({ children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("glass-card p-6 relative overflow-hidden group", className)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      {children}
    </motion.div>
  )
}

function StatsBadge({ icon, value, label, color }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
      <span className={color}>{icon}</span>
      <div className="flex flex-col leading-none">
        <span className="font-bold text-sm tracking-wide">{value}</span>
        <span className="text-[10px] text-neutral-500 font-bold">{label}</span>
      </div>
    </div>
  )
}

function MetricBox({ label, value, color }) {
  return (
    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
      <div className="text-xs text-neutral-500 mb-1">{label}</div>
      <div className={cn("text-xl font-mono font-bold", color)}>{value}</div>
    </div>
  )
}

function RadialProgress({ value, color }) {
  const data = [{ value: value, fill: color }]
  return (
    <div className="w-24 h-24 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background clockWise dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-sm font-bold text-white">{value.toFixed(0)}%</span>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl">
        <p className="text-blue-400 font-bold font-mono">{`${payload[0].value}%`}</p>
        <p className="text-xs text-neutral-400">CPU LOAD</p>
      </div>
    );
  }
  return null;
}

export default App
