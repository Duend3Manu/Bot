import sys
from bs4 import BeautifulSoup

# Configurar la salida estándar para usar UTF-8
sys.stdout.reconfigure(encoding='utf-8')

html_content = """
<div id="cs-tipodecambio">
    <h6 style="text-align: center;">VALORES EN TIEMPO REAL</h6>
    <table id="lista-de-monedas" class=" aligncenter">
    <thead>
    <tr id="cabecera" style="display: '';">
    <th style="text-align: left;">DIVISA</th>
    <th style="text-align: right;">COMPRAMOS</th>
    <th style="text-align: right;">VENDEMOS</th>
    </tr>
    </thead>
    <tbody id="listavariable">
    <tr><td id="2-moneda" class="nom_divisa"><span class="flag-us cs_flag"></span>Dolar EEUU</td><td class="" style="text-align:right;color:green;" id="2-compra">968</td><td class="" style="text-align:right;color:green;" id="2-venta">978</td></tr>
    <tr><td id="3-moneda" class="nom_divisa"><span class="flag-eu cs_flag"></span>Euro</td><td class="" style="text-align:right;color:green;" id="3-compra">1.035</td><td class="" style="text-align:right;color:green;" id="3-venta">1.054</td></tr>
    <tr><td id="4-moneda" class="nom_divisa"><span class="flag-ar cs_flag"></span>Peso Argentino</td><td class="" style="text-align:right;color:green;" id="4-compra">0,81</td><td class="" style="text-align:right;color:green;" id="4-venta">0,9</td></tr>
    <tr><td id="15-moneda" class="nom_divisa"><span class="flag-co cs_flag"></span>Peso Colombiano</td><td class="" style="text-align:right;color:green;" id="15-compra">0,23</td><td class="" style="text-align:right;color:green;" id="15-venta">0,26</td></tr>
    <tr><td id="18-moneda" class="nom_divisa"><span class="flag-bo cs_flag"></span>Bolivianos</td><td class="" style="text-align:right;color:green;" id="18-compra">67</td><td class="" style="text-align:right;color:green;" id="18-venta">98</td></tr>
    <tr><td id="19-moneda" class="nom_divisa"><span class="flag-pe cs_flag"></span>Sol Peruano</td><td class="" style="text-align:right;color:green;" id="19-compra">254</td><td class="" style="text-align:right;color:green;" id="19-venta">266</td></tr>
    <tr><td id="21-moneda" class="nom_divisa"><span class="flag-cn cs_flag"></span>Yuan Chino</td><td class="" style="text-align:right;color:green;" id="21-compra">126</td><td class="" style="text-align:right;color:green;" id="21-venta">144</td></tr>
    <tr><td id="8-moneda" class="nom_divisa"><span class="flag-jp cs_flag"></span>Yen Japones</td><td class="" style="text-align:right;color:green;" id="8-compra">6,5</td><td class="" style="text-align:right;color:green;" id="8-venta">7,5</td></tr>
    </tbody>
    </table>
</div>
"""

# Diccionario de banderas
flags = {
    "Dolar EEUU": "🇺🇸",
    "Euro": "🇪🇺",
    "Peso Argentino": "🇦🇷",
    "Peso Colombiano": "🇨🇴",
    "Bolivianos": "🇧🇴",
    "Sol Peruano": "🇵🇪",
    "Yuan Chino": "🇨🇳",
    "Yen Japones": "🇯🇵"
}

# Parsear el HTML
soup = BeautifulSoup(html_content, 'html.parser')

# Encontrar la tabla de divisas
tabla = soup.find('table', {'id': 'lista-de-monedas'})

if tabla is not None:
    # Obtener todas las filas de la tabla
    tbody = tabla.find('tbody', {'id': 'listavariable'})
    if tbody is not None:
        filas = tbody.find_all('tr')

        # Extraer y mostrar los datos en formato de tabla
        divisas = []
        for fila in filas:
            datos = fila.find_all('td')
            nombre_divisa = datos[0].text.strip()
            divisa = {
                'nombre': nombre_divisa,
                'compra': datos[1].text.strip(),
                'venta': datos[2].text.strip(),
                'flag': flags.get(nombre_divisa, '')
            }
            divisas.append(divisa)

        # Imprimir en formato de tabla alineado
        header = "| Bandera | Moneda          | Venta | Compra |"
        separator = "|---------|-----------------|-------|--------|"
        rows = [f"| {divisa['flag']}     | {divisa['nombre']:<15} | {divisa['venta']:<5} | {divisa['compra']:<5} |" for divisa in divisas]

        # Imprimir la tabla completa
        print(header)
        print(separator)
        for row in rows:
            print(row)
    else:
        print("No se encontró el cuerpo de la tabla 'listavariable'.")
else:
    print("No se encontró la tabla 'lista-de-monedas'.")
