# bencina.py

import requests
import sys

def obtener_datos_bencina(comuna):
    try:
        url = "https://api.bencinaenlinea.cl/api/busqueda_estacion_filtro"
        response = requests.get(url)
        response.raise_for_status()  # Lanzar una excepción en caso de error de HTTP
        datos = response.json()
        # Filtrar los datos localmente en lugar de hacer múltiples solicitudes HTTP
        estaciones_encontradas = [estacion for estacion in datos["data"] if comuna.lower() in estacion["comuna"].lower()]
        return estaciones_encontradas
    except requests.exceptions.RequestException as e:
        print(f"Error al obtener los datos de la API de bencinas: {e}")
        return None
    except Exception as e:
        print(f"Error inesperado: {e}")
        return None

def imprimir_datos(estacion, file):
    file.write(f"📍 Nombre: {repr(estacion['direccion'])[1:-1]}\n")  # Elimina las comillas al principio y al final
    file.write(f"🗺️ Dirección en mapa: https://www.google.com/maps/search/?api=1&query={estacion['latitud']},{estacion['longitud']}\n")
    file.write("⛽ Precios de los combustibles:\n")
    for combustible in estacion['combustibles']:
        precio = f"${float(combustible['precio']):,.0f}"  # Convierte y formatea el precio como moneda
        unidad = combustible['unidad_cobro'].replace('$', '')  # Elimina el símbolo $ de la unidad de cobro
        file.write(f"{combustible['nombre_largo']}: {precio} x {unidad}\n")

def main(comuna):
    with open('output.txt', 'w', encoding='utf-8') as file:
        file.write(f"Comuna ingresada: {comuna}\n")
        datos_bencina = obtener_datos_bencina(comuna)
        if datos_bencina:
            for estacion in datos_bencina:
                imprimir_datos(estacion, file)
                file.write("-" * 50 + "\n")
        else:
            file.write(f"No se pudieron obtener los datos de bencina para {comuna}\n")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python bencina.py <comuna>")
        sys.exit(1)
    comuna = sys.argv[1]
    main(comuna)
