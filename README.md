# Real-Time System Health Dashboard (Memoraid)

An innovative, real-time system monitoring dashboard for Windows, built with Python (FastAPI) and React (Vite).
Visualizes CPU, GPU, Memory, Disk I/O, and Battery status in a high-performance Glassmorphism UI.

![Dashboard Preview](https://via.placeholder.com/800x450.png?text=System+Health+Dashboard+Preview)

## Features
- **Real-Time Visualization**: WebSocket-based streaming (1s interval).
- **GPU Acceleration Monitoring**: Tracks NVIDIA GPU load, temps, and VRAM.
- **Glassmorphism Design**: Modern, sleek UI with dark mode and animations.
- **Comprehensive Metrics**:
  - CPU Usage & Frequency per core.
  - RAM Usage & Availability.
  - Disk Space & I/O (Read/Write IOPs).
  - Battery Health & Charging Status.

## Tech Stack
- **Backend**: Python 3.10+, FastAPI, psutil, GPUtil, WMI.
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Framer Motion.

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- Windows OS (for WMI/HW support)

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Or manually:
# pip install fastapi uvicorn psutil GPUtil wmi websockets
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Running the Project
1. Start the Backend: `uvicorn main:app --reload` (Runs on http://localhost:8000)
2. Start the Frontend: `npm run dev` (Runs on http://localhost:5173)
3. Open browser to `http://localhost:5173`

## License
MIT


**Author:** Mohamed Dilshad KP  
**Repository:** https://github.com/Dilshad-01/memoraid-system-monitor.git
