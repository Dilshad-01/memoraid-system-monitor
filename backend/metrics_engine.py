import psutil
import psutil
try:
    import GPUtil
except ImportError:
    GPUtil = None
import platform
import wmi
import pythoncom
from datetime import datetime

# Initialize WMI for thermal/battery info if possible
# Note: WMI calls can be slow, so we might want to cache or run in background
try:
    w = wmi.WMI()
except:
    w = None

def get_cpu_metrics():
    """Gather CPU usage, frequency, and count."""
    try:
        cpu_percent = psutil.cpu_percent(interval=None, percpu=True)  # Non-blocking if interval is None and called previously, but first call might be 0. 
        # For real-time, we usually call it with interval=0 or None in a loop.
        # Here we assume the caller handles the loop interval or we accept instantaneous 0 on first call.
        
        freq = psutil.cpu_freq()
        current_freq = freq.current if freq else 0
        max_freq = freq.max if freq else 0
        
        return {
            "usage_per_core": cpu_percent,
            "total_usage": psutil.cpu_percent(interval=None),
            "freq_current": current_freq,
            "freq_max": max_freq,
            "cores_physical": psutil.cpu_count(logical=False),
            "cores_logical": psutil.cpu_count(logical=True)
        }
    except Exception as e:
        return {"error": str(e)}

def get_memory_metrics():
    """Gather Memory usage stats."""
    try:
        mem = psutil.virtual_memory()
        return {
            "total": mem.total,
            "available": mem.available,
            "percent": mem.percent,
            "used": mem.used,
            "free": mem.free
        }
    except Exception as e:
        return {"error": str(e)}

def get_disk_metrics():
    """Gather Disk I/O and Usage."""
    disks = []
    try:
        # Disk Usage
        partitions = psutil.disk_partitions()
        for p in partitions:
            if 'cdrom' in p.opts or p.fstype == '':
                continue
            try:
                usage = psutil.disk_usage(p.mountpoint)
                disks.append({
                    "device": p.device,
                    "mountpoint": p.mountpoint,
                    "total": usage.total,
                    "used": usage.used,
                    "percent": usage.percent
                })
            except PermissionError:
                continue

        # Disk I/O (system wide)
        io = psutil.disk_io_counters()
        io_stats = {
            "read_bytes": io.read_bytes,
            "write_bytes": io.write_bytes,
            "read_count": io.read_count,
            "write_count": io.write_count
        }
        
        return {"partitions": disks, "io": io_stats}
    except Exception as e:
        return {"error": str(e)}

def get_gpu_metrics():
    """Gather GPU stats using GPUtil."""
    gpus = []
    if GPUtil is None:
        return gpus
    try:
        # GPUtil primarily works for NVIDIA
        nvidia_gpus = GPUtil.getGPUs()
        for gpu in nvidia_gpus:
            gpus.append({
                "id": gpu.id,
                "name": gpu.name,
                "load": gpu.load * 100,
                "memory_total": gpu.memoryTotal,
                "memory_used": gpu.memoryUsed,
                "memory_free": gpu.memoryFree,
                "temperature": gpu.temperature
            })
    except Exception:
        pass
        
    return gpus

def get_battery_status():
    """Gather Battery status."""
    try:
        battery = psutil.sensors_battery()
        if not battery:
            return {"available": False}
            
        return {
            "available": True,
            "percent": battery.percent,
            "power_plugged": battery.power_plugged,
            "secsleft": battery.secsleft  # -1 if unavailable
        }
    except Exception:
        return {"available": False}

def get_system_metrics():
    """Aggregates all metrics."""
    return {
        "timestamp": datetime.now().isoformat(),
        "cpu": get_cpu_metrics(),
        "memory": get_memory_metrics(),
        "disk": get_disk_metrics(),
        "gpu": get_gpu_metrics(),
        "battery": get_battery_status()
    }

if __name__ == "__main__":
    import time
    # Initialize cpu percent
    psutil.cpu_percent(interval=None)
    print("Collecting metrics...")
    time.sleep(1)
    print(get_system_metrics())
