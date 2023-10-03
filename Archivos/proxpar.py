# -*- coding: utf-8 -*-
import requests
from bs4 import BeautifulSoup
from unidecode import unidecode

urlas = 'https://chile.as.com/resultados/futbol/chile/calendario/?omnil=mpal'
page = requests.post(urlas)

fecha_buscada = '06 - 08 Oct.'

if page.status_code == 200:
    soup = BeautifulSoup(page.content, 'html.parser')
    jornadas = soup.findAll("div", {"class": "cont-modulo resultados"})
    for jornada in jornadas:
        fechaJornada = jornada.find('h2').find('span').text.strip()
        if fechaJornada == fecha_buscada:
            print('---------------------------------\n')
            print('---------------------------------\n')
            titulo = jornada.find('h2').find('a')
            print(unidecode(titulo.text), end=' : ')
            print(unidecode(fechaJornada))

            partidos = jornada.find('tbody').find_all('tr')
            for partido in partidos:
                print(unidecode(partido.find('td', {"class": "col-equipo-local"}).text.strip()), end=' ')
                print(unidecode(partido.find('td', {"class": "col-resultado"}).text.strip()), end=' ')
                print(unidecode(partido.find('td', {"class": "col-equipo-visitante"}).text.strip()))
                print('\n')
else:
    print("Error en request:", page.status_code)
