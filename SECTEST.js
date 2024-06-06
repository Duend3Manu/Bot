const axios = require('axios');
const express = require('express');
const app = express();
const port = 9898;


// Middleware para parsear JSON
app.use(express.json());

// Función para obtener la fecha y hora del servidor
async function getServerTime() {
    try {
        const response = await axios.post('https://apps.sec.cl/INTONLINEv1/ClientesAfectados/GetHoraServer', {}, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Language': 'es-419,es;q=0.9',
                'Origin': 'https://apps.sec.cl',
                'Referer': 'https://apps.sec.cl/INTONLINEv1/index.aspx',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const serverTime = response.data[0].FECHA;
        const [date, time] = serverTime.split(' ');
        const [day, month, year] = date.split('-');
        const [hour, minute, second] = time.split(':');
        return {
            anho: parseInt(year),
            mes: parseInt(month),
            dia: parseInt(day),
            hora: parseInt(hour)
        };
    } catch (error) {
        console.error('Error fetching server time:', error);
        return null;
    }
}

// Función para obtener los datos de clientes afectados basado en la fecha y hora del servidor
async function fetchData(timeData) {
    try {
        const { anho, mes, dia, hora } = timeData;
        const response = await axios.post('https://apps.sec.cl/INTONLINEv1/ClientesAfectados/GetPorFecha', {
            anho, mes, dia, hora
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Language': 'es-419,es;q=0.9',
                'Origin': 'https://apps.sec.cl',
                'Referer': 'https://apps.sec.cl/INTONLINEv1/index.aspx',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Función principal para generar el mensaje de WhatsApp
async function generateWhatsAppMessage(regionFilter = null, highImpactThreshold = 1000) {
    const timeData = await getServerTime();
    if (!timeData) {
        return 'Error retrieving server time.';
    }

    const data = await fetchData(timeData);
    if (!data) {
        return 'Error retrieving data.';
    }

    const regionData = {};
    data.forEach(entry => {
        const { NOMBRE_REGION, NOMBRE_COMUNA, CLIENTES_AFECTADOS } = entry;
        if (!regionFilter || NOMBRE_REGION === regionFilter) {
            if (!regionData[NOMBRE_REGION]) {
                regionData[NOMBRE_REGION] = {
                    total_clients: 0,
                    comunas: {}
                };
            }
            regionData[NOMBRE_REGION].total_clients += CLIENTES_AFECTADOS;
            if (!regionData[NOMBRE_REGION].comunas[NOMBRE_COMUNA]) {
                regionData[NOMBRE_REGION].comunas[NOMBRE_COMUNA] = 0;
            }
            regionData[NOMBRE_REGION].comunas[NOMBRE_COMUNA] += CLIENTES_AFECTADOS;
        }
    });

    // Ordenar comunas y regiones por número de clientes afectados
    for (const region in regionData) {
        const comunas = Object.entries(regionData[region].comunas);
        comunas.sort((a, b) => b[1] - a[1]);
        regionData[region].comunas = Object.fromEntries(comunas);
    }

    const sortedRegions = Object.entries(regionData).sort((a, b) => b[1].total_clients - a[1].total_clients);
    const reportTime = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' });
    let message = `🇨🇱 Resumen Nacional de Clientes Sin Suministro de Energia: Total de ${Object.values(regionData).reduce((acc, curr) => acc + curr.total_clients, 0)} clientes afectados ${reportTime}.\n\n`;

    if (regionFilter) {
        message += `Detalle de la Región ${regionFilter}:\n`;
        Object.entries(regionData[regionFilter].comunas).forEach(([comuna, clients]) => {
            const emoji = clients > highImpactThreshold ? ' ⚠️' : '';
            message += `- ${comuna}: ${clients} clientes${emoji}\n`;
        });
    } else {
        message += "📍 Detalle por Región:\n";
        sortedRegions.forEach(([region, details]) => {
            const emoji = details.total_clients > highImpactThreshold ? ' ⚠️' : '';
            message += `- ${region}: ${details.total_clients} clientes${emoji}\n`;
        });
    }
    
    return message;
}


app.get('/report/:region?', async (req, res) => {
    const region = req.params.region;
    const message = await generateWhatsAppMessage(region);
    res.send(message);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
module.exports = {
    generateWhatsAppMessage
};
