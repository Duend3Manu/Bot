import sys
import codecs
from bs4 import BeautifulSoup
import requests
import pandas as pd
from datetime import date
import unidecode
from tabulate import tabulate

# Configurar la codificación de caracteres de la consola a UTF-8
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

url = 'https://chile.as.com/resultados/futbol/chile/clasificacion/?omnil=mpal'
page = requests.get(url)

soup = BeautifulSoup(page.content, 'html.parser')

# Equipos
eq = soup.find_all('span', class_='nombre-equipo')
equipos = []
count = 0
for i in eq:
    if count < 16:
        equipos.append(unidecode.unidecode(i.text))
    else:
        break
    count += 1

# Puntos
pt = soup.find_all('td', class_='destacado')
puntos = []
count = 0
for i in pt:
    if count < 16:
        puntos.append(i.text)
    else:
        break
    count += 1

# Crear DataFrame
df = pd.DataFrame({'Posición': list(range(1, 17)), 'Equipo': equipos, 'Puntos': puntos})

# Reducción del tamaño de las columnas para adaptar a pantalla de WhatsApp
df['Equipo'] = df['Equipo'].str.slice(0, 13)
df['Puntos'] = df['Puntos'].str.slice(0, 6)

# Especificar el nombre fijo del archivo CSV
filename = "tabla.csv"  # Nombre fijo para el archivo CSV

# Guardar tabla en archivo CSV
df.to_csv(filename, index=False, encoding='utf-8')

# Imprimir tabla con líneas separadoras y posición
print(tabulate(df, headers='keys', tablefmt='plain', showindex=False, numalign='right'))
