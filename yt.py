# -*- coding: utf-8 -*-
from youtubesearchpython import VideosSearch
import sys

# Establecer la codificación de la salida estándar
sys.stdout.reconfigure(encoding='utf-8')

def buscar_videos(query, max_resultados=5):
    videos = VideosSearch(query, limit=max_resultados).result()["result"]
    resultados = []
    for video in videos:
        titulo = video["title"]
        enlace = "https://www.youtube.com/watch?v=" + video["id"]
        canal = video["channel"]["name"]
        resultados.append({"titulo": titulo, "enlace": enlace, "canal": canal})
    return resultados

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python yt.py <texto a buscar>")
        sys.exit(1)
    
    query = sys.argv[1]
    resultados = buscar_videos(query)

    for resultado in resultados:
        print("Título:", str(resultado["titulo"]))
        print("Canal:", str(resultado["canal"]))
        print("Enlace:", resultado["enlace"])
        print()
