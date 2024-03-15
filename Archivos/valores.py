import requests
from bs4 import BeautifulSoup
import sys

# Establecer la codificación de la salida estándar a UTF-8
sys.stdout.reconfigure(encoding='utf-8')

# Obtener valores de divisas extranjeras
html_divisas = '''
<div class="currencyTitleContainer-DS-EntryPoint1-1">
    <span class="currencyConversion-DS-EntryPoint1-1" title="1 USD = 980,3500 CLP">1 USD = 980,3500 CLP</span>
    <span class="currencyConversion-DS-EntryPoint1-1" title="1 EUR = 1.064,1700 CLP">1 EUR = 1.064,1700 CLP</span>
    <span class="currencyConversion-DS-EntryPoint1-1" title="1 ARS = 1,1595 CLP">1 ARS = 1,1595 CLP</span>
    <span class="currencyConversion-DS-EntryPoint1-1" title="1 SOL = 260,4543 CLP">1 SOL = 260,4543 CLP</span>
    <div class="currencySubtitle-DS-EntryPoint1-1">
        <span>última actualización • 5 de marzo, 20:43:31 GMT-3</span>
        <span class="color_nochange-DS-EntryPoint1-1 price_display-DS-EntryPoint1-1 priceChangeToday">&lrm;0 (&lrm;0,00%)</span>
    </div>
</div>
'''

# Parsear el HTML de divisas
soup_divisas = BeautifulSoup(html_divisas, 'html.parser')
spans_divisa = soup_divisas.find_all('span', class_='currencyConversion-DS-EntryPoint1-1')

valores_divisas = []

# Obtener valor del dólar desde Google Finance
url_dolar_google = 'https://www.google.com/finance/quote/USD-CLP?sa=X&ved=2ahUKEwiW267rg-WEAxUtGLkGHR61D3EQmY0JegQIGRAv'
response_dolar_google = requests.get(url_dolar_google)

if response_dolar_google.status_code == 200:
    html_dolar_google = response_dolar_google.content
    soup_dolar_google = BeautifulSoup(html_dolar_google, 'html.parser')
    dolar_google_div = soup_dolar_google.find('div', class_='YMlKec fxKbKc')
    if dolar_google_div:
        dolar_google = dolar_google_div.text.strip()
        valores_divisas.append(f"💵 USD Google : ${dolar_google.replace('.', ',')}\n")
    else:
        print("No se pudo encontrar el valor del dólar en Google Finance.")
else:
    print("No se pudo acceder a la página de Google Finance.")

# Obtener valor del dólar desde tu indicador personalizado
url_dolar_indicador = 'https://mindicador.cl/api/dolar'
response_dolar_indicador = requests.get(url_dolar_indicador)

if response_dolar_indicador.status_code == 200:
    data_dolar_indicador = response_dolar_indicador.json()
    valor_dolar_indicador = data_dolar_indicador['serie'][0]['valor']
    valores_divisas.append(f"💵 USD Mi Indicador : ${valor_dolar_indicador}\n")
else:
    print("No se pudo obtener el valor del dólar desde tu indicador personalizado.")

# Iterar sobre los elementos span de divisas
for span in spans_divisa:
    titulo, valor = span['title'].split('=')
    divisa = titulo.split()[1]
    valor_decimal = float(''.join(filter(str.isdigit, valor))[:-4] + '.' + ''.join(filter(str.isdigit, valor))[-4:-2])
    valor_con_signo = '${:,.2f}'.format(valor_decimal).replace(',', ' ')
    if divisa == 'USD':
        divisa = '💸 USD Bing'
    if divisa == 'EUR':
        divisa = '💶 EUR'
    if divisa == 'ARS':
        divisa = '💰 ARS'
    if divisa == 'SOL':
        divisa = '💰 SOL'
    valores_divisas.append(f"{divisa} : {valor_con_signo}\n")

# Obtener valor de UTM
url_utm = 'https://calculadorautm.cl/'
response_utm = requests.get(url_utm)

if response_utm.status_code == 200:
    html_utm = response_utm.content
    soup_utm = BeautifulSoup(html_utm, 'html.parser')
    valor_utm_div = soup_utm.find('div', class_='gb-container')
    if valor_utm_div:
        valor_utm = valor_utm_div.find('h2').text.strip().split('=')[-1].strip()
        valores_divisas.append(f"💲 UTM : ${valor_utm.replace('.', ',')}\n")
    else:
        print("No se pudo encontrar el valor de UTM en la página.")
else:
    print("No se pudo acceder a la página de Valor UTM.")

# Obtener valor de UF
url_uf = 'https://valoruf.cl/'
response_uf = requests.get(url_uf)

if response_uf.status_code == 200:
    html_uf = response_uf.content
    soup_uf = BeautifulSoup(html_uf, 'html.parser')
    span_uf = soup_uf.find('span', class_='vpr')
    if span_uf:
        valor_uf = span_uf.text.strip()
        valor_uf = valor_uf.replace('$', '').replace('.', '').replace(',', '.')
        valores_divisas.append(f"💲 UF : ${valor_uf}\n")
    else:
        print("No se pudo encontrar el valor de UF en la página.")
else:
    print("No se pudo acceder a la página de Valor UF.")

# Imprimir resultados
print("📈 Valores de las divisas 📈:")
for divisa in valores_divisas:
    print(divisa)
