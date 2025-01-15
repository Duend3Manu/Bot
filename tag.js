const { chromium } = require('playwright');
const fs = require('fs');

async function searchTagTotal(rut) {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // Navegar a la página principal
        await page.goto('https://unired.tagtotal.cl/');

        // Ingresar el RUT
        await page.fill('input#rut', rut);

        // Hacer clic en el botón "Buscar"
        await Promise.all([
            page.waitForNavigation(),  // Esperar la navegación
            page.click('button#rut-btn')
        ]);

        // Esperar a que la página cargue completamente
        await page.waitForTimeout(15000);  // Aumentar el tiempo de espera si es necesario

        // Obtener las deudas
        const deudas = await page.$$('.row-tabla-deuda');

        // Guardar información en CSV
        const csvStream = fs.createWriteStream('tag.csv', { flags: 'w' });
        csvStream.write('Autopista,RUT Cliente,Vence,Monto\n');

        for (const deuda of deudas) {
            const empresaInfo = await deuda.$('.empresa-info');
            const autopista = await empresaInfo.$eval('.nombre-s strong', el => el.textContent.trim());
            const rutCliente = await empresaInfo.$eval(':nth-child(2)', el => el.textContent.trim());
            const vence = await empresaInfo.$eval(':nth-child(4)', el => el.textContent.trim());

            // Intentar capturar el monto de manera segura
            let monto = 'No disponible';
            try {
                const montoElement = await deuda.$('.valor b');
                if (montoElement)
                    monto = await montoElement.textContent();
            } catch (error) {
                console.log(`No se pudo obtener el monto para ${autopista}`);
            }

            csvStream.write(`${autopista},${rutCliente},${vence},${monto}\n`);
        }

        csvStream.end();

        // Obtener el valor total a pagar
        const totalPagar = await page.$eval('.precio-desktop', el => el.textContent.trim());
        console.log('\nTotal a pagar:', totalPagar);

        // Mostrar desglose de deudas
        console.log('\nDesglose de deudas:');
        for (const deuda of deudas) {
            const empresaInfo = await deuda.$('.empresa-info');
            const autopista = await empresaInfo.$eval('.nombre-s strong', el => el.textContent.trim());
            let monto = 'No disponible';
            try {
                const montoElement = await deuda.$('.valor b');
                if (montoElement)
                    monto = await montoElement.textContent();
            } catch (error) {
                console.log(`No se pudo obtener el monto para ${autopista}`);
            }
            console.log(`${autopista}: ${monto}`);
        }

    } catch (error) {
        console.error('Ocurrió un error:', error);

    } finally {
        await browser.close();
    }
}

// Obtener el RUT como argumento de línea de comandos
if (process.argv.length !== 3) {
    console.log('Uso: node tag.js <RUT>');
    process.exit(1);
}

const rut = process.argv[2];
searchTagTotal(rut);
