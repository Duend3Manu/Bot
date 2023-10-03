from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

def login(driver, username, password):
    driver.get("https://fapello.com/login/")
    wait = WebDriverWait(driver, 60)  # Aumentamos el tiempo de espera
    wait.until(EC.presence_of_element_located((By.XPATH, "//button[@type='submit']")))
    driver.find_element(By.NAME, "username").send_keys(username)
    driver.find_element(By.NAME, "password").send_keys(password)
    driver.find_element(By.XPATH, "//button[@type='submit']").click()
    try:
        wait.until(EC.visibility_of_element_located((By.XPATH, "//div[@class='dashboard']")))
    except TimeoutException as e:
        print(f"Tiempo de espera excedido al esperar la página de inicio de sesión: {e}")

def search(driver, query):
    driver.find_element(By.XPATH, "//a[@href='https://fapello.com/search/']").click()
    wait = WebDriverWait(driver, 60)  # Aumentamos el tiempo de espera
    wait.until(EC.presence_of_element_located((By.NAME, "q")))
    driver.find_element(By.NAME, "q").send_keys(query)
    driver.find_element(By.XPATH, "//button[@type='submit']").click()

def main():
    driver = webdriver.Edge()
    try:
        login(driver, "Talkyboti", "Duende2023")
        if "Welcome, Talkyboti" in driver.page_source:
            print("Inicio de sesión exitoso")
            search(driver, "victoria matosa")
            print(driver.title)
        else:
            print("El inicio de sesión falló")
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
