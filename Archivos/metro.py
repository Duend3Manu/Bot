from bs4 import BeautifulSoup
import requests
from unidecode import unidecode

url = 'https://www.metro.cl/el-viaje/estado-red'
page = requests.get(url)
soup = BeautifulSoup(page.content, 'html.parser')

lines = ['Línea 1', 'Línea 2', 'Línea 3', 'Línea 4', 'Línea 4a', 'Línea 5', 'Línea 6']
statuses = {'estado1': 'Estación Operativa', 'estado4': 'Accesos Cerrados', 'estado2': 'Estación Cerrada Temporalmente'}

for line in lines:
    line_result = soup.find('strong', string=line)
    line_status = 'Operativa'
    if line_result:
        station_results = line_result.find_next('ul').find_all('li')
        for station_result in station_results:
            station_name = station_result.text.strip() # Obtiene el nombre de la estación directamente del objeto station_result
            station_status = statuses[station_result['class'][0]]
            if station_status in ['Accesos Cerrados', 'Estación Cerrada Temporalmente']:
                print(f'- {unidecode(line)}: {station_name} - {station_status}')
                if station_status == 'Estación Cerrada Temporalmente':
                    line_status = 'Cerrada Temporalmente'
    print(f'- {unidecode(line)}: {line_status}')
