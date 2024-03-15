import sys
from bs4 import BeautifulSoup
import requests
from unidecode import unidecode

sys.stdout.reconfigure(encoding='utf-8')

url = 'https://www.metro.cl/el-viaje/estado-red'
page = requests.get(url)
soup = BeautifulSoup(page.content, 'html.parser')

lines = ['Línea 1', 'Línea 2', 'Línea 3', 'Línea 4', 'Línea 4a', 'Línea 5', 'Línea 6']
statuses = {'estado1': 'Estación Operativa', 'estado4': 'Accesos Cerrados', 'estado2': 'Estación Cerrada Temporalmente'}

colors = {
    'Línea 1': '🔴',
    'Línea 2': '🟡',
    'Línea 3': '🟤',
    'Línea 4': '🔵',
    'Línea 4a': '🔷',
    'Línea 5': '🟢',
    'Línea 6': '🟣'
}

problems = []

for line in lines:
    line_result = soup.find('strong', string=line)
    line_status = 'Operativa'
    if line_result:
        station_results = line_result.find_next('ul').find_all('li')
        for station_result in station_results:
            station_name = station_result.text.strip()
            station_status = statuses[station_result['class'][0]]
            if station_status in ['Accesos Cerrados', 'Estación Cerrada Temporalmente']:
                print(f'{colors[line]} {unidecode(line)}: {station_name} - {station_status}')
                problems.append(station_name)
                if station_status == 'Estación Cerrada Temporalmente':
                    line_status = 'Cerrada Temporalmente'
        print(f'{colors[line]}{unidecode(line)}: {line_status}')

if len(problems) == 0:
    print("Toda la red del metro está operativa.")
else:
    print(f"Problemas en las estaciones {' '.join(problems)}, más información en https://twitter.com/metrodesantiago")
