# -*- coding: utf-8 -*-
import sys
import requests
from bs4 import BeautifulSoup

# Establecer la codificación de la salida estándar
sys.stdout.reconfigure(encoding='utf-8')

def obtener_estado_transbank():
    try:
        # Realizar la solicitud HTTP para obtener el estado de Transbank
        response = requests.get('https://status.transbankdevelopers.cl/')
        response.raise_for_status()

        # Parsear el HTML
        soup = BeautifulSoup(response.text, 'html.parser')

        # Encontrar todos los elementos que contienen el estado de los servicios
        servicios = soup.find_all('div', class_='component-inner-container')

        # Crear un diccionario para almacenar el estado de cada servicio
        servicio_estado = {}

        # Iterar sobre cada servicio y extraer su nombre y estado
        for servicio in servicios:
            nombre = servicio.find('span', class_='name').text.strip()
            estado = servicio.find('span', class_='component-status').text.strip()
            servicio_estado[nombre] = estado

        return servicio_estado
    except requests.RequestException as e:
        # Manejar errores de solicitud HTTP
        print('Error al realizar la solicitud HTTP:', str(e))
        return None
    except Exception as e:
        # Manejar otros errores
        print('Error inesperado:', str(e))
        return None

def mostrar_estado(servicio, estado):
    # Asignar emojis a los diferentes estados
    emojis = {
        "Operational": "✅",  # tick verde
        "No disponible": "❌",  # x roja
        "Degradado": "⚠️"  # signo de exclamación amarillo
    }
    
    # Obtener el emoji correspondiente al estado
    emoji = emojis.get(estado, "❓")  # signo de interrogación en caso de estado desconocido

    # Devolver el estado del servicio con su emoji correspondiente
    return f"{emoji} {servicio}: {estado}"

# Llamada a la función para obtener el estado de Transbank Developers
estado = obtener_estado_transbank()
if estado:
    print("Estado de Transbank Developers:")
    for servicio, estado in estado.items():
        print(mostrar_estado(servicio, estado))
else:
    print("No se pudo obtener el estado de Transbank Developers en este momento.")
