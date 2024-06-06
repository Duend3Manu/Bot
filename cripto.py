import json
import requests
import locale

def fetch_crypto_info(coin_id):
    try:
        currency = 'clp'  # Siempre mostraremos los valores en CLP
        url = f'https://api.coingecko.com/api/v3/coins/{coin_id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false'
        response = requests.get(url)
        data = response.json()
        
        price = data['market_data']['current_price'][currency]
        change_1h = data['market_data']['price_change_percentage_1h_in_currency'][currency]
        change_24h = data['market_data']['price_change_percentage_24h_in_currency'][currency]

        # Establecer la configuración regional para obtener el formato de separadores adecuado
        locale.setlocale(locale.LC_ALL, 'es_CL.UTF-8')

        # Formatear el precio con separadores de coma para los miles y puntos para los decimales
        formatted_price = locale.format_string('%.2f', price, grouping=True)

        # Construir el diccionario con la información
        crypto_data = {
            'coin_id': coin_id.capitalize(),
            'currency': currency.upper(),
            'price': formatted_price,
            'change_1h': f'{change_1h:.2f}%',
            'change_24h': f'{change_24h:.2f}%'
        }

        # Guardar los datos en un archivo JSON
        with open('cripto.json', 'w') as json_file:
            json.dump(crypto_data, json_file)

    except Exception as e:
        print(f'Error al obtener información de {coin_id.capitalize()} en {currency.upper()}:', e)

def main():
    command = input('Ingresa el comando en el formato !cripto <nombre de la criptomoneda>: ').lower().split()
    if len(command) != 2 or command[0] != '!cripto':
        print('Formato de comando incorrecto. Debe ser en el formato !cripto <nombre de la criptomoneda>.')
        return
    coin_id = command[1]
    fetch_crypto_info(coin_id)

if __name__ == "__main__":
    main()
