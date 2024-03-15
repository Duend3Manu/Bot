import requests
from bs4 import BeautifulSoup
import re

url = 'https://chile.as.com/resultados/futbol/copa_libertadores/2024/calendario/tercera_ronda_a/'
page = requests.get(url)

if page.status_code == 200:
    soup = BeautifulSoup(page.content, 'html.parser')
    partidos = soup.find_all("li", {"class": "list-resultado"})
    
    for partido in partidos:
        tipo_partido_vuelta = partido.find("div", {"class": "cont-vuelta"})
        tipo_partido = "Vuelta" if tipo_partido_vuelta else "Ida"
        
        equipo_local = partido.find("span", {"class": "nombre-equipo"}).text.strip()
        equipo_visitante = partido.find_all("span", {"class": "nombre-equipo"})[-1].text.strip()
        
        fecha_partido_element = partido.find("span", {"class": "fecha"})
        fecha_partido = fecha_partido_element.text.strip() if fecha_partido_element else "Fecha no disponible"
        
        # Obtener el resultado del partido y limpiarlo
        resultado_element = partido.find("div", {"class": "cont-resultado finalizado"})
        resultado_text = resultado_element.text.strip() if resultado_element else "Resultado no disponible"
        resultado_clean = re.sub(r'\s+', ' ', resultado_text)  # Eliminar espacios adicionales
        resultado_clean = resultado_clean.replace(' - ', '-')  # Eliminar espacio alrededor del guión
        
        print(f"Tipo de partido: {tipo_partido}")
        print(f"Equipo local: {equipo_local}")
        print(f"Equipo visitante: {equipo_visitante}")
        print(f"Fecha del partido: {fecha_partido}")
        print(f"Resultado: {resultado_clean}\n")
else:
    print("Error en la solicitud:", page.status_code)
