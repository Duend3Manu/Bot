# -*- coding: utf-8 -*-
import requests
from bs4 import BeautifulSoup
import sys

def obtener_horoscopo(signo_buscar):
    url = "https://www.pudahuel.cl/horoscopo/"

    # Realizamos la solicitud GET a la página
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")

    # Encontramos todas las divisiones que contienen la información de cada signo
    signos = soup.find_all("div", class_="col-md-offset-1 col-12 col-md-10")

    # Creamos un diccionario para almacenar los datos de cada signo
    datos_signos = {}

    # Iteramos sobre cada signo para extraer la información
    for s in signos:
        nombre_signo = s.find("h4", class_="media-heading").text.strip()
        descripcion = s.find("strong").text.strip()
        palabra = s.find_all("strong")[1].text.strip().split(": ")[1]
        numero = s.find_all("strong")[2].text.strip().split(": ")[1]
        color = s.find_all("strong")[3].text.strip().split(": ")[1]
        # Convertimos el nombre del signo a minúsculas y sin tildes
        nombre_signo_normalizado = nombre_signo.lower().replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
        datos_signos[nombre_signo_normalizado] = {
            "descripcion": descripcion,
            "palabra": palabra,
            "numero": numero,
            "color": color
        }

    # Buscamos el signo sin tildes
    if signo_buscar.lower() in datos_signos:
        return datos_signos[signo_buscar.lower()]
    else:
        return "Signo no encontrado."

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python horoscopo.py <signo>")
    else:
        signo = sys.argv[1]
        horoscopo = obtener_horoscopo(signo)
        if isinstance(horoscopo, dict):
            print(signo.capitalize())
            print("Descripción:", horoscopo["descripcion"])
            print("PALABRA:", horoscopo["palabra"])
            print("NÚMERO:", horoscopo["numero"])
            print("COLOR:", horoscopo["color"])
            print("="*50)
        else:
            print(horoscopo)
