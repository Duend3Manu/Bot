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

# Goles a favor y en contra
td_elements = soup.find_all('td', class_='hidden-xs')
gf_values = []
gc_values = []
count = 0

for i in range(len(td_elements)):
    if count < 16:
        if i % 2 == 0:
            gf_values.append(int(td_elements[i].text.strip()))
        else:
            gc_values.append(int(td_elements[i].text.strip()))
            count += 1

# Calcular la diferencia de goles
dif_values = [gf - gc for gf, gc in zip(gf_values, gc_values)]

# Verificar que todas las listas tienen la misma longitud
if not (len(equipos) == len(puntos) == len(dif_values)):
    raise ValueError("Las listas no tienen la misma longitud")

# Crear DataFrame
df = pd.DataFrame({
    'Posición': list(range(1, 17)),
    'Equipo': equipos,
    'Puntos': puntos,
    'DIF': dif_values
})

# Reducción del tamaño de las columnas para adaptar a pantalla de WhatsApp
df['Equipo'] = df['Equipo'].str.slice(0, 13)
df['Puntos'] = df['Puntos'].str.slice(0, 6)
df['DIF'] = df['DIF'].astype(str).str.slice(0, 4)

# Imprimir tabla con líneas separadoras y posición
print('-----------------------------------------------------\n')
print(tabulate(df, headers='keys', tablefmt='plain', showindex=False, numalign='right'))
print('-----------------------------------------------------\n')