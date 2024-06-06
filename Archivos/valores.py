import requests
from bs4 import BeautifulSoup
import sys
import asyncio
import aiohttp
import re

# Establecer la codificación de la salida estándar a UTF-8
sys.stdout.reconfigure(encoding='utf-8')

async def obtener_valor_google(session, url):
    try:
        async with session.get(url) as response:
            if response.status == 200:
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                div_valor = soup.find('div', class_='YMlKec fxKbKc')
                if div_valor:
                    return div_valor.text.strip().replace('.', ',')
                else:
                    return None
            else:
                print(f"No se pudo acceder a la página {url}")
                return None
    except Exception as e:
        print(f"Error al obtener el valor desde {url}: {e}")
        return None

async def obtener_valores_divisas():
    async with aiohttp.ClientSession() as session:
        urls = {
            '💵 USD Google': 'https://www.google.com/finance/quote/USD-CLP',
            '💶 EUR': 'https://www.google.com/finance/quote/EUR-CLP',
            '🇦🇷 ARG$': 'https://www.google.com/finance/quote/ARS-CLP',
            '🇵🇪 SOL': 'https://www.google.com/finance/quote/PEN-CLP'
        }
        tareas = []
        for nombre, url in urls.items():
            tareas.append(obtener_valor_google(session, url))
        resultados = await asyncio.gather(*tareas)
        return dict(zip(urls.keys(), resultados))

async def obtener_valor_dolar_indicador():
    try:
        url = 'https://mindicador.cl/api/dolar'
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return data['serie'][0]['valor']
                else:
                    print("No se pudo obtener el valor del dólar desde el indicador personalizado.")
                    return None
    except Exception as e:
        print(f"Error al obtener el valor del dólar desde el indicador personalizado: {e}")
        return None

async def obtener_valores_uf_utm():
    try:
        url_uf = 'https://valoruf.cl/'
        url_utm = 'https://calculadorautm.cl/'
        async with aiohttp.ClientSession() as session:
            uf_response = await session.get(url_uf)
            utm_response = await session.get(url_utm)
            if uf_response.status == 200 and utm_response.status == 200:
                uf_html = await uf_response.text()
                utm_html = await utm_response.text()
                uf_soup = BeautifulSoup(uf_html, 'html.parser')
                utm_soup = BeautifulSoup(utm_html, 'html.parser')
                uf_valor = uf_soup.find('span', class_='vpr').text.strip().replace('$', '').replace('.', '').replace(',', '.')
                utm_valor_strong = utm_soup.find('strong')
                utm_valor = utm_valor_strong.text.strip().split('=')[-1].strip().replace(' CLP', '').replace('.', ',')
                return uf_valor, utm_valor
            else:
                print("No se pudo obtener los valores de UF y UTM.")
                return None, None
    except Exception as e:
        print(f"Error al obtener los valores de UF y UTM: {e}")
        return None, None

async def main():
    valor_dolar_indicador = await obtener_valor_dolar_indicador()
    if valor_dolar_indicador:
        print(f"💵 USD Mi Indicador : ${str(valor_dolar_indicador).replace('.', ',')}\n")

    valores_divisas = await obtener_valores_divisas()
    if valores_divisas:
        for divisa, valor in valores_divisas.items():
            valor = re.sub(r'[^\d.,]', '', valor)  # Eliminar caracteres no numéricos excepto puntos y comas
            valor = valor.replace('.', '').replace(',', '.')  # Reemplazar las comas por puntos para permitir la conversión a float
            valor = "{:,.2f}".format(float(valor))  # Formatear el valor con dos decimales y separador de miles
            print(f"{divisa} : ${valor}\n")

    uf_valor, utm_valor = await obtener_valores_uf_utm()
    if uf_valor and utm_valor:
        uf_valor = uf_valor.replace('.', ',')  # Reemplazar el punto por la coma para separar los miles
        utm_valor = utm_valor.replace('.', ',')  # Reemplazar el punto por la coma para separar los miles

        print(f"🇨🇱💲 UF : ${uf_valor}\n")
        print(f"🇨🇱💲 UTM : {utm_valor}\n")


if __name__ == "__main__":
    asyncio.run(main())
