import psutil
import speedtest
from ping3 import ping, verbose_ping

def get_server_status():
    # Obtener el uso de la CPU
    cpu_usage = psutil.cpu_percent(interval=1)
    # Obtener el uso de la memoria
    memory_info = psutil.virtual_memory()
    memory_usage = memory_info.percent

    # Obtener el ping
    ping_result = ping('8.8.8.8')
    ping_output = f"Ping: {ping_result} ms" if ping_result else "Ping fallido"

    # Obtener la velocidad de internet
    st = speedtest.Speedtest()
    download_speed = st.download() / 1_000_000  # Convertir a Mbps
    upload_speed = st.upload() / 1_000_000  # Convertir a Mbps

    status = (
        f"Uso de CPU: {cpu_usage}%\n"
        f"Uso de Memoria: {memory_usage}%\n"
        f"{ping_output}\n"
        f"Velocidad de Descarga: {download_speed:.2f} Mbps\n"
        f"Velocidad de Subida: {upload_speed:.2f} Mbps"
    )
    return status

if __name__ == "__main__":
    print(get_server_status())
