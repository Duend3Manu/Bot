# -*- coding: utf-8 -*-
import os
import sys
import csv
import argparse
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium import webdriver

def find_element_by_text(driver, text):
    try:
        # Espera hasta que el elemento esté presente y visible en la página
        element = WebDriverWait(driver, 20).until(
            EC.visibility_of_element_located((By.XPATH, f"//*[contains(text(), '{text}')]/following::td[1]"))
        )
        return element.text.strip()
    except NoSuchElementException:
        print(f"No se pudo encontrar el elemento con el texto '{text}' en la página.")
        return None
    except TimeoutException:
        print(f"El elemento con el texto '{text}' no se cargó a tiempo.")
        return None

def save_information_to_csv(informacion):
    with open('patente.csv', 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)

        # Información del propietario
        writer.writerow(['*Información del propietario*'])
        writer.writerow(['Nombre', 'RUT'])
        writer.writerow([informacion[0]["Nombre"], format_rut(informacion[0]["RUT"])])
        writer.writerow([])

        # Información vehicular
        writer.writerow(['*Información vehicular*'])
        writer.writerow(['Tipo', 'Marca', 'Modelo', 'Año', 'Color', 'N° Motor', 'N° Chasis', 'Fabricante', 'Procedencia'])
        writer.writerow([informacion[1][key] for key in ['Tipo', 'Marca', 'Modelo', 'Año', 'Color', 'N° Motor', 'N° Chasis', 'Fabricante', 'Procedencia']])
        writer.writerow([])

        # Multas de tránsito
        writer.writerow(['*Multas de tránsito*'])
        writer.writerow([f"{informacion[2]}"])
        writer.writerow([])

        # Información de revisión técnica
        writer.writerow(['*Información de revisión técnica*'])
        for key, value in informacion[3]["Revisión técnica"].items():
            writer.writerow([key, value])
        writer.writerow(['*Gases*'])
        for key, value in informacion[3]["Gases"].items():
            writer.writerow([key, value])
        writer.writerow([])

        # Permiso de circulación
        writer.writerow(['*Permiso de circulación*'])
        for key, value in informacion[4].items():
            writer.writerow([key, value])
        writer.writerow([])

        # SOAP (Seguro obligatorio)
        writer.writerow(['*SOAP (Seguro obligatorio)*'])
        for key, value in informacion[5].items():
            writer.writerow([key, value])
        writer.writerow([])

        # Información de transporte público
        writer.writerow(['*Información de transporte público*'])
        for key, value in informacion[6].items():
            writer.writerow([key, value])
        writer.writerow([])

        # Restricción vehicular
        writer.writerow(['*Restricción vehicular*'])
        for key, value in informacion[7].items():
            writer.writerow([key, value])

def extract_information(driver):
    informacion_propietario = {
        "RUT": find_element_by_text(driver, "RUT"),
        "Nombre": find_element_by_text(driver, "Nombre")
    }

    informacion_vehicular = {
        "Patente": find_element_by_text(driver, "Patente"),
        "Tipo": find_element_by_text(driver, "Tipo"),
        "Marca": find_element_by_text(driver, "Marca"),
        "Modelo": find_element_by_text(driver, "Modelo"),
        "Año": find_element_by_text(driver, "Año"),
        "Color": find_element_by_text(driver, "Color"),
        "N° Motor": find_element_by_text(driver, "N° Motor"),
        "N° Chasis": find_element_by_text(driver, "N° Chasis"),
        "Fabricante": find_element_by_text(driver, "Fabricante"),
        "Procedencia": find_element_by_text(driver, "Procedencia")
    }

    multas_transito = find_element_by_text(driver, "Multas de tránsito")
    
    informacion_revision_tecnica = {}
    informacion_revision_tecnica["Revisión técnica"] = {}
    informacion_revision_tecnica["Gases"] = {}

    informacion_revision_tecnica["Revisión técnica"]["Comuna de revisión"] = find_element_by_text(driver, "Comuna de revisión")
    informacion_revision_tecnica["Revisión técnica"]["Mes de revisión"] = find_element_by_text(driver, "Mes de revisión")
    informacion_revision_tecnica["Revisión técnica"]["Último control"] = find_element_by_text(driver, "Último control")
    informacion_revision_tecnica["Revisión técnica"]["Estado"] = find_element_by_text(driver, "Estado")
    informacion_revision_tecnica["Revisión técnica"]["Fecha de vencimiento"] = find_element_by_text(driver, "Fecha de vencimiento")

    informacion_revision_tecnica["Gases"]["Comuna de revisión"] = find_element_by_text(driver, "Comuna de revisión")
    informacion_revision_tecnica["Gases"]["Mes de revisión"] = find_element_by_text(driver, "Mes de revisión")
    informacion_revision_tecnica["Gases"]["Último control"] = find_element_by_text(driver, "Último control")
    informacion_revision_tecnica["Gases"]["Estado"] = find_element_by_text(driver, "Estado")
    informacion_revision_tecnica["Gases"]["Fecha de vencimiento"] = find_element_by_text(driver, "Fecha de vencimiento")

    permiso_circulacion = {}
    permiso_circulacion["Año de pago"] = find_element_by_text(driver, "Año de pago")
    permiso_circulacion["Municipalidad"] = find_element_by_text(driver, "Municipalidad")
    permiso_circulacion["Fecha de pago"] = find_element_by_text(driver, "Fecha de pago")

    soap_seguro_obligatorio = {}
    soap_seguro_obligatorio["Estado"] = find_element_by_text(driver, "Estado")
    soap_seguro_obligatorio["Compañia"] = find_element_by_text(driver, "Compañia")
    soap_seguro_obligatorio["Fecha inicio"] = find_element_by_text(driver, "Fecha inicio")
    soap_seguro_obligatorio["Fecha de vencimiento"] = find_element_by_text(driver, "Fecha de vencimiento")

    informacion_transporte_publico = {}
    informacion_transporte_publico["Transporte público"] = find_element_by_text(driver, "Transporte público")
    informacion_transporte_publico["Tipo transporte público"] = find_element_by_text(driver, "Tipo transporte público")

    restriccion_vehicular = {}
    restriccion_vehicular["Condición"] = find_element_by_text(driver, "Condición")
    restriccion_vehicular["COMUNAS DE PUENTE ALTO Y SAN BERNARDO"] = find_element_by_text(driver, "COMUNAS DE PUENTE ALTO Y SAN BERNARDO")
    restriccion_vehicular["PROVINCIA DE SANTIAGO E INTERIOR DE ANILLO A. VESPUCIO"] = find_element_by_text(driver, "PROVINCIA DE SANTIAGO E INTERIOR DE ANILLO A. VESPUCIO")

    return informacion_propietario, informacion_vehicular, multas_transito, informacion_revision_tecnica, permiso_circulacion, soap_seguro_obligatorio, informacion_transporte_publico, restriccion_vehicular

def print_information(informacion):
    message = ""
    # Información del propietario
    message += "*Información del propietario*\n"
    message += f"Nombre: {informacion[0]['Nombre']}\n"
    message += f"RUT: {format_rut(informacion[0]['RUT'])}\n\n"

    # Información vehicular
    message += "*Información vehicular*\n"
    message += f"Tipo: {informacion[1]['Tipo']}\n"
    message += f"Marca: {informacion[1]['Marca']}\n"
    message += f"Modelo: {informacion[1]['Modelo']}\n"
    message += f"Año: {informacion[1]['Año']}\n"
    message += f"Color: {informacion[1]['Color']}\n"
    message += f"N° Motor: {informacion[1]['N° Motor']}\n"
    message += f"N° Chasis: {informacion[1]['N° Chasis']}\n"
    message += f"Fabricante: {informacion[1]['Fabricante']}\n"
    message += f"Procedencia: {informacion[1]['Procedencia']}\n\n"

    # Multas de tránsito
    message += "*Multas de tránsito*\n"
    message += f"{informacion[2]}\n\n"

    # Información de revisión técnica
    message += "*Información de revisión técnica*\n"
    for key, value in informacion[3]["Revisión técnica"].items():
        message += f"{key}: {value}\n"
    message += "*Gases*\n"
    for key, value in informacion[3]["Gases"].items():
        message += f"{key}: {value}\n"

    # Permiso de circulación
    message += "\n*Permiso de circulación*\n"
    for key, value in informacion[4].items():
        message += f"{key}: {value}\n"

    # SOAP (Seguro obligatorio)
    message += "\n*SOAP (Seguro obligatorio)*\n"
    for key, value in informacion[5].items():
        message += f"{key}: {value}\n"

    # Información de transporte público
    message += "\n*Información de transporte público*\n"
    for key, value in informacion[6].items():
        message += f"{key}: {value}\n"

    # Restricción vehicular
    message += "\n*Restricción vehicular*\n"
    for key, value in informacion[7].items():
        message += f"{key}: {value}\n"

    return message.strip()

def format_rut(rut):
    return f"{rut[:7]}-{rut[7:]}"

def initialize_driver():
    try:
        # Agregar la ruta del controlador de Edge al PATH
        os.environ["PATH"] += os.pathsep + r"C:\bots\AirFryers-bot\Archivos\edge"
        return webdriver.Edge()
    except Exception as e:
        print(f"Ocurrió un error al inicializar el navegador: {e}")
        return None

def main():
    # Parsear el argumento de la patente desde la línea de comandos
    parser = argparse.ArgumentParser(description='Buscar información de una patente en Chile.')
    parser.add_argument('patente', type=str, help='Patente a buscar')
    args = parser.parse_args()

    driver = initialize_driver()
    if not driver:
        return

    driver.get("https://www.patentechile.com/")
    search_vehicle(driver, args.patente)
    informacion = extract_information(driver)
    save_information_to_csv(informacion)  # Guardar información en CSV
    print(print_information(informacion))
    
    driver.quit()

def search_vehicle(driver, patente):
    driver.find_element(By.ID, "btnVehiculo").click()
    input_field = driver.find_element(By.ID, "txtTerm")
    input_field.clear()
    input_field.send_keys(patente)
    search_button = driver.find_element(By.ID, "btnConsultar")
    search_button.click()
    try:
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Nombre')]")))
    except TimeoutException:
        print("La página de resultados tardó demasiado en cargar.")

if __name__ == "__main__":
    main()
