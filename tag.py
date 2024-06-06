# -*- coding: utf-8 -*-
import sys
import time
import csv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options

def search_tag_total(rut):
    # Configurar opciones de Chrome
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Ejecutar Chrome en modo headless
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    # Inicializar el navegador con las opciones configuradas
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

    try:
        # Cargar la primera página
        driver.get("https://unired.tagtotal.cl/")

        # Esperar a que la página cargue completamente
        time.sleep(5)

        # Ingresar el RUT
        rut_input = driver.find_element(By.ID, "rut")
        rut_input.send_keys(rut)

        # Hacer clic en el botón "Buscar"
        search_button = driver.find_element(By.ID, "rut-btn")
        search_button.click()

        # Esperar a que la página cargue los resultados
        time.sleep(20)

        # Obtener las deudas
        deudas = driver.find_elements(By.CSS_SELECTOR, ".row-tabla-deuda")

        # Guardar información en CSV
        with open('tag.csv', 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Autopista', 'RUT Cliente', 'Tipo Deuda', 'Monto'])
            for deuda in deudas:
                autopista = deuda.find_element(By.CSS_SELECTOR, ".nombre-s").text.strip()
                info = deuda.find_elements(By.CSS_SELECTOR, "p")
                for i in range(0, len(info), 2):
                    rut_cliente = info[i].text.strip()
                    tipo_deuda = info[i+1].text.strip()
                    monto = deuda.find_element(By.CSS_SELECTOR, ".switch.medium + span").text.strip()

                    writer.writerow([autopista, rut_cliente, tipo_deuda, monto])

        # Obtener el valor total a pagar
        total_pagar = driver.find_element(By.CSS_SELECTOR, ".precio-desktop").text
        print("\nTotal a pagar:", total_pagar)

    except Exception as e:
        print("Ocurrió un error:", e)

    finally:
        # Cerrar el navegador al finalizar
        driver.quit()

# Obtener el RUT como argumento de línea de comandos
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python tag.py <RUT>")
        sys.exit(1)

    rut = sys.argv[1]
    search_tag_total(rut)
