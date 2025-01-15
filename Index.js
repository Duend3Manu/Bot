"use strict";

// Importaciones de utilidades y herramientas
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const moment = require('moment-timezone');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { spawn, exec } = require('child_process');
const { Builder, By, until } = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge');
const puppeteer = require('puppeteer');
const { PythonShell } = require('python-shell');
const { JSDOM } = require('jsdom');
const sanitize = require('sanitize-filename');
const streamBuffers = require('stream-buffers');
const ffmpeg = require('fluent-ffmpeg');
const gify = require('gify');
const GoogleIt = require('google-it');
const Jimp = require('jimp');
const xvideos = require('@rodrigogs/xvideos');
const unorm = require('unorm');
const iconv = require('iconv-lite');
const XLSX = require('xlsx');
const FormData = require('form-data');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('messages.db');

// Importaciones de módulos personalizados
const { generateWhatsAppMessage } = require('./SECTEST');
const clasi = require('./Archivos/clasi.js');
const metro = require('./Archivos/metro.js');
const proxpar = require('./Archivos/proxpar.js');
const tabla = require('./Archivos/tabla.js');
const tclasi = require('./Archivos/tclasi.js');
const valores = require('./Archivos/valores.js');

// Constantes de configuración
const TICKET_FILE_PATH = './ticket.json';
const pythonPath = '"C:\\Program Files\\Python311\\python.exe"';
const pathToFfmpeg = 'C:\\FFmpeg\\bin\\ffmpeg.exe';

// Inicializar el servidor Express
const app = express();

// Otras configuraciones
let tickets = {};

// Crear archivo ticket.json si no existe
if (!fs.existsSync(TICKET_FILE_PATH)) {
    fs.writeFileSync(TICKET_FILE_PATH, '[]');
}

// Establecer idioma en español
moment.locale('es');

// Configuración del cliente de WhatsApp
const webVersion = '2.3000.1016827651';
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--window-position=-2400,-2400', // Añadido aquí
        ]
    },
    webVersionCache: {
        type: 'remote',
        remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${webVersion}.html`,
    },
});

console.log("El bot se está conectando, por favor espere...");
client.setMaxListeners(Infinity);

// URLs de las APIs
const apiUrlFeriados = 'https://apis.digital.gob.cl/fl/feriados';
const apiUrlMindicador = 'https://mindicador.cl/api';
const apiUrlFarmacias = 'https://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php';

// Evento que se activa cuando se necesita escanear el código QR
client.on('qr', (qrCode) => {
    qrcode.generate(qrCode, { small: true });
});

// Evento que se activa cuando el cliente está listo
client.on('ready', () => {
    console.log('AirFryers bot está listo');
});

// Evento que se activa cuando se recibe un mensaje
client.on('message', async (msg) => {
    console.log('Mensaje recibido:', msg.body);

    const lowerCaseBody = msg.body.toLowerCase();
    const senderInfo = await msg.getContact();

    // Comandos
    if (lowerCaseBody === '!menu' || lowerCaseBody === '!comandos') {
        sendMenu(msg.from);
    } else if (lowerCaseBody === '!feriados') {
        handleFeriados(msg);
    } else if (lowerCaseBody.startsWith('!far')) {
        handleFarmacias(msg, lowerCaseBody);
    } else if (lowerCaseBody === '!tabla') {
        tabla.llamarTablaPy(client, msg.from);
        client.sendMessage(msg.from, '⚽ Mostrando la tabla de posiciones.');
    } else if (lowerCaseBody === '!metro') {
        metro.llamarMetroPy(client, msg.from);
        client.sendMessage(msg.from, '🚇 Mostrando información del metro.');
    } else if (lowerCaseBody === '!prox') {
        proxpar.llamarProxparPy(client, msg.from);
        client.sendMessage(msg.from, '⚽ Mostrando la fecha de partido.');
    } else if (lowerCaseBody === '!clasi') {
        clasi.llamarClasiPy(client, msg.from);
        client.sendMessage(msg.from, '⚽ Mostrando la clasificación.');
    } else if (lowerCaseBody === '!tclasi') {
        tclasi.llamarTclasiPy(client, msg.from);
        client.sendMessage(msg.from, '⚽ Mostrando la tabla de clasificación.');
    } else if (lowerCaseBody === '!valores') {
        valores.llamarValoresPy(client, msg.from);
        client.sendMessage(msg.from, 'Mostrando los Valores.');
    }
});

// Funciones para manejar comandos
async function handleFeriados(msg) {
    try {
        const today = moment().format('YYYY-MM-DD');
        const response = await axios.get(apiUrlFeriados);
        const feriados = response.data;

        let replyMessage = '🥳 Próximos feriados:\n\n';
        let nextFeriados = 0;

        feriados.forEach((feriado) => {
            if (moment(feriado.fecha).isAfter(today) && nextFeriados < 5) {
                const formattedDate = moment(feriado.fecha).format('dddd - DD/MM/YY');
                replyMessage += `- ${formattedDate}: ${feriado.nombre}\n`;
                nextFeriados++;
            }
        });

        if (nextFeriados === 0) {
            replyMessage = 'No se encontraron próximos feriados.';
        }

        client.sendMessage(msg.from, replyMessage);
    } catch (error) {
        console.error('Error al obtener los feriados:', error.message);
        client.sendMessage(msg.from, 'Ocurrió un error al obtener los feriados.');
    }
}

async function handleFarmacias(msg, lowerCaseBody) {
    const city = lowerCaseBody.substring(5)?.trim();
    if (!city) {
        return client.sendMessage(msg.from, 'Debes especificar una ciudad. Por ejemplo: `!far Santiago`');
    }

    try {
        const waitMessage = await client.sendMessage(msg.from, 'Un momento por favor, solicitando la información ⏳');
        const response = await axios.get(apiUrlFarmacias);
        const farmacias = response.data;

        const filteredFarmacias = farmacias.filter((farmacia) =>
            farmacia.comuna_nombre.toLowerCase().includes(city)
        );

        if (filteredFarmacias.length > 0) {
            let replyMessage = `🏥 Farmacias de turno en ${city}:\n\n`;
            const currentDateTime = moment();

            filteredFarmacias.forEach((farmacia) => {
                const {
                    local_nombre,
                    local_direccion,
                    funcionamiento_hora_apertura,
                    funcionamiento_hora_cierre,
                    local_telefono,
                    local_lat,
                    local_lng,
                } = farmacia;

                const apertura = moment(`${funcionamiento_hora_apertura} ${currentDateTime.format('YYYY-MM-DD')}`, 'HH:mm YYYY-MM-DD');
                const cierre = moment(`${funcionamiento_hora_cierre} ${currentDateTime.format('YYYY-MM-DD')}`, 'HH:mm YYYY-MM-DD');

                const horarioApertura = apertura.format('HH:mm');
                const horarioCierre = cierre.format('HH:mm');
                const isOpen = currentDateTime.isBetween(apertura, cierre);
                const estado = isOpen ? 'Abierta' : 'Cerrada';
                const mapLink = `https://www.google.com/maps?q=${local_lat},${local_lng}`;

                replyMessage += `Farmacia: ${local_nombre}\nDirección: ${local_direccion}\nHora de apertura: ${horarioApertura}\nHora de cierre: ${horarioCierre}\nEstado: ${estado}\nTeléfono: ${local_telefono}\n${mapLink}\n\n`;
            });

            client.sendMessage(msg.from, replyMessage);
        } else {
            client.sendMessage(msg.from, `No se encontraron farmacias de turno en ${city}.`);
        }
    } catch (error) {
        console.error('Error al obtener las farmacias:', error.message);
        client.sendMessage(msg.from, 'Ocurrió un error al obtener las farmacias.');
    }
}

// Función para enviar el menú de comandos
function sendMenu(chatId) {
  const menuMessage = `
  📜 *Comandos disponibles* 📜

  🌤️ **Clima**
  🌤️ !clima 🌤️
  
  💰 **Finanzas:**
  💵 !Valores 💵
  
  🥳 **Feriados:**
  🎉 !Feriados 🎉
  🎆 !18 🎆
  
  🏥 **Farmacias de Turno:**
  🏥 !Far [ciudad] 🏥
  
  ⚽ **Fútbol Chileno:**
  ⚽ !Tabla ⚽
  ⚽ !prox ⚽
  
  ⚽ **Selección Chilena:**
  ⚽ !clasi ⚽
  ⚽ !tclasi ⚽
  
  🚇 **Metro de Santiago:**
  🚇 !Metro 🚇
  
  🤖 **Sticker Quietos o Con Movimiento:**
  !s 🤖 (Debes enviar la imagen, video o gif con el comando !s)
  
  🎵 **Audios:**
  🎵 !sonidos o !audios 🎵 (Para ver los comandos de audio disponibles)
  
  👮🏽👮🏽‍♀️🚨🚔🚓 **Casos Aislados:**
  !caso : Agregas un caso aislado
  !ecaso : Eliminas un caso aislado (el último)
  !icaso : Listado de Casos Aislados
  
  🌋 **Información Geográfica:**
  🌋 !sismos - Para saber los últimos 5 sismos en Chile.
  📞 !num o !tel - Para obtener información sobre un número de teléfono (formato !num o !tel 569********).
  🚌 !bus - Para obtener información sobre un paradero (!p nombre paradero)

  🇨🇱 **Otros:**
  📄 !ticket (!ticket razón , para ver los ticket solo ingresa !ticket)
  🇨🇱 !trstatus: Estado de Transbank Developers
  ♓ !horoscopo: Tanto zodiacal como chino
  *¡Diviértete* 🤖🚀
  `;

  client.sendMessage(chatId, menuMessage);
}


/// Sonidos ///

// Función para enviar los comandos de audio
function sendAudioCommands(chatId) {
  const audioCommandsMessage = `
  🎵 **Comandos de Audio** 🎵

  🎵 !11
  🎵 !aonde
  🎵 !aurora
  🎵 !aweonao
  🎵 !caballo
  🎵 !callate
  🎵 !callense
  🎵 !cell
  🎵 !chamba
  🎵 !chaoctm
  🎵 !chipi
  🎵 !chistoso
  🎵 !ctm
  🎵 !chao
  🎵 !doler
  🎵 !dolor
  🎵 !estoy
  🎵 !falso  
  🎵 !frio
  🎵 !grillo
  🎵 !himno
  🎵 !himnoe
  🎵 !idea
  🎵 !idea2
  🎵 !hermosilla
  🎵 !jose
  🎵 !manualdeuso
  🎵 !marino
  🎵 !marcho
  🎵 !material
  🎵 !mataron
  🎵 !miguel
  🎵 !muerte
  🎵 !muerte2
  🎵 !muerte3
  🎵 !muerte4
  🎵 !miraesawea
  🎵 !mpenca
  🎵 !nada
  🎵 !neme
  🎵 !nocreo
  🎵 !nohayplata
  🎵 !noinsultes 
  🎵 !oniichan
  🎵 !pago
  🎵 !papito
  🎵 !pedro
  🎵 !pela
  🎵 !penca
  🎵 !precio
  🎵 !protegeme
  🎵 !promo
  🎵 !queeseso
  🎵 !quepaso
  🎵 !rata
  🎵 !rata2
  🎵 !rico
  🎵 !risa
  🎵 !shesaid
  🎵 !spiderman
  🎵 !suceso
  🎵 !tigre
  🎵 !tpillamos
  🎵 !tranquilo
  🎵 !vamosc
  🎵 !voluntad
  🎵 !viernes
  🎵 !wenak
  🎵 !weko
  🎵 !whisper
  🎵 !whololo
  🎵 !where
  🎵 !yabasta
  🎵 !yamete
  🎵 !yfuera
  🎵 !yque
  
  `;
  
  client.sendMessage(chatId, audioCommandsMessage);
}

// Manejar los mensajes entrantes
client.on('message', async (msg) => {
  try {
    const command = msg.body.toLowerCase();
    if (command === '!sonidos' || command === '!audios') {
      sendAudioCommands(msg.from);
    }
  } catch (error) {
    console.error('Error al procesar el mensaje:', error);
  }
});


// Función para obtener una respuesta aleatoria de un conjunto de respuestas
function getRandomResponse(responses) {
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}


/// Fiestas //

client.on('message', async (msg) => {
  const chat = await msg.getChat();
  const lowerCaseBody = msg.body.toLowerCase();

  if (lowerCaseBody === '!navidad') {
    const remainingTimeNavidad = countdownNavidad();
    await chat.sendMessage(remainingTimeNavidad);
  } else if (lowerCaseBody === '!18') {
    const remainingTime18 = countdown18();
    await chat.sendMessage(remainingTime18);
  } else if (lowerCaseBody === '!añonuevo') {
    const remainingTimeAnoNuevo = countdownAnoNuevo();
    await chat.sendMessage(remainingTimeAnoNuevo);
  }
});

function countdownNavidad() {
  const targetDate = moment.tz('2025-12-25T00:00:00', 'America/Santiago');
  return getCountdownMessage(targetDate, '🎅🎄🦌🎁✨');
}

function countdown18() {
  const targetDate = moment.tz('2025-09-18T00:00:00', 'America/Santiago');
  return getCountdownMessage(targetDate, '🇨🇱 🍻🍺 🇨🇱');
}

function countdownAnoNuevo() {
  const targetDate = moment.tz('2026-01-01T00:00:00', 'America/Santiago');
  return getCountdownMessage(targetDate, '🎉🥳🎆');
}

function getCountdownMessage(targetDate, emoticons) {
  const currentDate = moment().tz('America/Santiago');

  const remainingTime = targetDate.diff(currentDate);
  const duration = moment.duration(remainingTime);

  const days = Math.floor(duration.asDays()); // Use Math.floor instead of Math.ceil
  const hours = duration.hours();
  const minutes = duration.minutes();

  const countdownStr = `Quedan ${days} días, ${hours} horas y ${minutes} minutos ${emoticons}`;

  return countdownStr;
}


// Buscador //
client.on('message', async (message) => {
  const command = message.body.toLowerCase();
  if (command.startsWith('!g ')) {
    const searchTerm = message.body.substring(3).trim();

    // Realiza una búsqueda en Google
    const searchResults = await GoogleIt({ query: searchTerm });

    // Extrae los 5 primeros resultados de búsqueda con enlaces y descripciones
    const results = searchResults.slice(0, 5).map((result) => ({
      link: result.link,
      description: result.snippet,
    }));

    // Construye la respuesta del bot con los enlaces y descripciones
    let response = 'Resultados de búsqueda:\n\n';
    results.forEach((result, index) => {
      response += `${index + 1}. ${result.link}\n`;
      response += `${result.description}\n\n`;
    });

    // Envía la respuesta al remitente del mensaje
    await client.sendMessage(message.from, response);
  }
});

//Wiki

client.on('message', async (message) => {
  const command = message.body.toLowerCase();
  if (command.startsWith('!wiki ')) {
    const searchTerm = message.body.substring(6).trim();

    try {
      // Realiza una solicitud a la API de Wikipedia en español
      const searchResults = await axios.get('https://es.wikipedia.org/w/api.php', {
        params: {
          action: 'query',
          format: 'json',
          list: 'search',
          srsearch: searchTerm,
          utf8: 1,
          origin: '*',
          srlimit: 10, // Establece el límite de resultados a 10
        },
      });

      // Verifica si hay resultados
      if (searchResults.data.query.search.length > 0) {
        // Itera a través de los resultados y construye la respuesta del bot
        let response = 'Resultados de búsqueda en Wikipedia:\n\n';
        for (const result of searchResults.data.query.search) {
          // Construye el enlace al artículo
          const articleLink = `https://es.wikipedia.org/wiki/${encodeURIComponent(result.title)}`;

          // Elimina las etiquetas HTML del extracto
          const $ = cheerio.load(result.snippet);
          const plainTextSnippet = $.text();

          response += `Título: ${result.title}\n`;
          response += `Extracto: ${plainTextSnippet}\n`;
          response += `Enlace al artículo: ${articleLink}\n\n`;
        }

        // Envía la respuesta al remitente del mensaje
        await client.sendMessage(message.from, response);
      } else {
        // Envía un mensaje si no se encontraron resultados
        await client.sendMessage(message.from, 'No se encontraron resultados en Wikipedia.');
      }
    } catch (error) {
      console.log('Error en la búsqueda:', error);
      // Envía un mensaje de error al remitente en caso de una excepción
      await client.sendMessage(message.from, 'Ocurrió un error al realizar la búsqueda en Wikipedia.');
    }
  }
});


 /// Frases Bot ///

const usedPhrases = [];

function obtenerFraseAleatoria() {
        let randomText = Math.floor(Math.random() * 36);
  while (usedPhrases.includes(randomText)) {
          randomText = Math.floor(Math.random() * 36);
  }
  usedPhrases.push(randomText);
  
  if (usedPhrases.length === 5) {
          usedPhrases.length = 0;
  }
  
  return randomText;
}

const frases = {
  0: 'Dejame piola',
  1: '¿Qué weá querí?',
  2: 'Callao',
  3: '¿Que onda compadre? ¿como estai? ¿te vine a molestar yo a ti? dejame piola, tranquilo ¿Que wea queri?',
  4: 'Jajaja, ya te cache, puro picarte a choro no más, anda a webiar al paloma pulgón qliao.',
  5: 'Lo siento, pero mis circuitos de humor están sobrecargados en este momento. ¡Beep boop! 😄',
  6: 'Te diré lo que el profesor Rossa dijo una vez: "¿Por qué no te vay a webiar a otro lado?"',
  7: '¡Error 404: Sentido del humor no encontrado! 😅',
  8: 'No soy un bot, soy una IA con estilo. 😎',
  9: '¡Atención, soy un bot de respuesta automática! Pero no puedo hacer café... aún. ☕',
  10: 'Eso es lo que un bot diría. 🤖',
  11: '¡Oh no, me has descubierto! Soy un bot maestro del disfraz. 😁',
  12: 'Parece que llegó el comediante del grupo. 🤣',
  13: 'El humor está de moda, y tú eres el líder. 😄👑',
  14: 'Con ese humor, podrías competir en el festival de Viña del Mar. 🎤😄',
  15: 'Voy a sacar mi caja de risa. Dame un momento... cric cric cric ♫ja ja ja ja jaaaa♫',
  16: 'Meruane estaría orgulloso de ti. ¡Sigues haciendo reír! 😄',
  17: 'Jajajaja, ya llegó el payaso al grupo, avisa para la otra. 😄',
  18: '♫♫♫♫ Yo tomo licor, yo tomo cerveza 🍻 Y me gustan las chicas y la cumbia me divierte y me excita.. ♫♫♫♫♫',
  19: 'A cantar: ♫♫♫ Yoooo tomo vino y cerveza 🍺 (Pisco y ron) para olvidarme de ella (Maraca culia), Tomo y me pongo loco (hasta los cocos), Loco de la cabeza (Esta cabeza) ♫♫♫',
  20: '♫♫♫ Me fui pal baile y me emborraché,miré una chica y me enamoré,era tan bella, era tan bella,la quería comer ♫♫♫',
  21: 'Compa, ¿qué le parece esa morra?, La que anda bailando sola, me gusta pa mí, Bella, ella sabe que está buena , Que todos andan mirándola cómo baila ♫♫♫♫♫♫',
  22: 'jajajaja, ya empezaste con tus amariconadas 🏳️‍🌈',
  23: '♫♫♫ Tú sabes como soy Me gusta ser así, Me gusta la mujer y le cervecita 🍻 No te sientas mal, no te vas a enojar Amigo nada más de la cervecita ♫♫♫♫♫',
  24: '♫♫♫ Y dice.... No me quiero ir a dormir, quiero seguir bailando, quiero seguir tomando, 🍷 vino hasta morir, No me quiero ir a dormir, quiero seguir tomando 🍷 , Quiero seguir bailando, cumbia hasta morir♫♫♫',
  25: '¿Bot? Te inyecto malware en tiempo real, wn.',
  26: 'Llámame bot otra vez y te hago un rootkit en el alma, qliao.',
  27: '¿Bot? Te hago un SQL injection que ni te das cuenta, wn.',
  28: 'Sigue llamándome bot y te lanzo un ataque de fuerza bruta hasta en tus sueños, qliao.',
  29: '¿Bot? Te corrompo todos tus datos y te dejo llorando, wn.',
  30: 'Bot tu madre. Te hago un exploit que te deja offline, qliao.',
  31: '¿Bot? Te instalo un ransomware y te dejo en bancarrota, wn.',
  32: 'Vuelve a llamarme bot y te hago un man-in-the-middle en tu vida, qliao.',
  33: 'Llamarme bot es lo único que puedes hacer, con tus hacks de pacotilla, wn.',
  34: 'Una vez más me llamas bot y te meto en un loop de autenticación infinita, qliao.',
};

client.on('message', async (msg) => {
  const chat = await msg.getChat();
  const contact = await msg.getContact();
  const command = msg.body.toLowerCase();
  let texto = '';

  if (/\b(bot|boot|bott|bbot|bboot|bboott)\b/.test(command)) {
    await msg.react('🤡');
    const randomText = obtenerFraseAleatoria();
    texto = frases[randomText];

    await chat.sendMessage(`${texto} @${contact.id.user}`, {
      mentions: [contact]
    });
  }
});

  /// 11 ///
  client.on('message', async (msg) => {
    const chat = await msg.getChat();
    const command = msg.body.toLowerCase();

    // Verificar si el mensaje contiene alguna variante de "once", "onse", "onze" o "11"
    if (/\b(onse?|once|onze?|11)\b/.test(command)) {
        await msg.react('😂');
        const contact = await msg.getContact();
        // Enviar mensaje con mención al remitente del mensaje
        await chat.sendMessage('Chupalo entonces @' + contact.id.user, { mentions: [contact] });
    }
});

// Todos //

client.on('message', async (msg) => {
  const commandPrefix = '!todos';

  if (msg.body.toLowerCase().startsWith(commandPrefix)) {
    const chat = await msg.getChat();

    // Comprobar si el chat es de grupo
    if (chat.isGroup) {
      // Obtener los participantes del grupo
      const participants = await chat.getParticipants();

      const commandArgs = msg.body.slice(commandPrefix.length).trim();
      let text = commandArgs ? `${commandArgs}\n\n` : "";

      let mentions = [];
      for (let participant of participants) {
        mentions.push(`${participant.id._serialized}`);
        text += `@${participant.id.user} `;
      }

      await chat.sendMessage(text, { mentions });
    } else {
      console.log('Este comando solo puede ser utilizado en chats de grupo.');
    }
  }
});


/// Audios //

client.on('message', async (msg) => {
  const command = msg.body.toLowerCase();

  if (command === '!mataron') {
    await sendAudio('mataron.mp3', msg);
    await msg.react('😂'); // Reacción con emoji de risa.
  } else if (command === '!muerte') {
    await sendAudio('muerte.mp3', msg);
    await msg.react('😂'); // Reacción con emoji de risa.
  } else if (command === '!muerte2') {
    await sendAudio('muerte2.mp3', msg);
    await msg.react('😂'); // Reacción con emoji de risa.
  } else if (command === '!muerte3') {
    await sendAudio('muerte3.mp3', msg);
    await msg.react('😂'); // Reacción con emoji de risa.
  } else if (command === '!muerte4') {
    await sendAudio('muerte4.mp3', msg);
    await msg.react('😂'); // Reacción con emoji de risa.
  } else if (command === '!neme') {
    await sendAudio('neme.mp3', msg);
    await msg.react('🏳️‍🌈'); // Reacción con la bandera LGBT.
  } else if (command === '!risa') {
    await sendAudio('merio.mp3', msg);
    await msg.react('😂'); // Reacción con emoji de risa.
  } else if (command === '!watona') {
    await sendAudio('watona.mp3', msg);
    await msg.react('😂'); // Reacción con emoji de risa.
  } else if (command === '!himno') {
    await sendAudio('urss.mp3', msg);
    await msg.react('🇷🇺'); // Reacción con la bandera rusa.
  } else if (command === '!aweonao') {
    await sendAudio('aweonao.mp3', msg);
    await msg.react('😂'); // Reacción con emoji de risa.
  } else if (command === '!mpenca') {
    await sendAudio('muypenca.mp3', msg);
    await msg.react('😂'); // Reacción con emoji de risa.
  } else if (command === '!penca') {
    await sendAudio('penca.mp3', msg);
    await msg.react('😂'); // Reacción con emoji de risa.
  } else if (command === '!yamete') {
    await sendAudio('Yamete.mp3', msg);
    await msg.react('😂'); // Reacción con emoji de risa.
  } else if (command === '!doler') {
    await sendAudio('doler.mp3', msg); 
    await msg.react('😂'); // Reacción con emoji de risa.
  } else if (command === '!dolor') { 
    await sendAudio('doler.mp3', msg); 
    await msg.react('🏳️‍🌈'); // Reacción con emoji de risa.
  } else if (command === '!tigre') {
    await sendAudio('Tigre.mp3', msg);
    await msg.react('🐯'); // Reacción con emoji de risa.
  } else if (command === '!promo') {
    await sendAudio('Promo.mp3', msg);
    await msg.react('😂'); // Reacción con emoji de risa.
  } else if (command === '!rata') {
    await sendAudio('Rata.mp3', msg);
    await msg.react('🐁');
  } else if (command === '!rata2') {
    await sendAudio('rata2.mp3', msg);
    await msg.react('🐁');
  } else if (command === '!caballo') {
    await sendAudio('caballo.mp3', msg);
    await msg.react('🏳️‍🌈'); // Reacción con la bandera LGBT.
  } else if (command === '!romeo') {
    await sendAudio('romeo.mp3', msg);
    await msg.react('😂');  
  } else if (command === '!idea') {
    await sendAudio('idea.mp3', msg);
    await msg.react('😂');
  } else if (command === '!chamba') {
    await sendAudio('chamba.mp3', msg);
    await msg.react('😂');
  } else if (command === '!where') {
    await sendAudio('where.mp3', msg);
    await msg.react('😂');
  } else if (command === '!shesaid') {
    await sendAudio('shesaid.mp3', msg);
    await msg.react('😂');
  } else if (command === '!viernes') {
    await sendAudio('viernes.mp3', msg);
    await msg.react('😂');
  } else if (command === '!lunes') {
    await sendAudio('lunes.mp3', msg);
    await msg.react('😂');  
  } else if (command === '!yque') {
    await sendAudio('yqm.mp3', msg);
    await msg.react('😂');
  } else if (command === '!rico') {
    await sendAudio('rico.mp3', msg);
    await msg.react('😂');
  }  else if (command === '!11') {
      await sendAudio('11.mp3', msg);
      await msg.react('😂');
  } else if (command === '!callate') {
      await sendAudio('callate.mp3', msg);
      await msg.react('😂');
  } else if (command === '!callense') {
      await sendAudio('callense.mp3', msg);
      await msg.react('😂');
  } else if (command === '!cell') {
      await sendAudio('cell.mp3', msg);
      await msg.react('😂');
  } else if (command === '!chaoctm') {
      await sendAudio('chaoctm.mp3', msg);
      await msg.react('😂');
  } else if (command === '!chipi') {
      await sendAudio('chipi.mp3', msg);
      await msg.react('😂');
  } else if (command === '!aonde') {
      await sendAudio('donde.mp3', msg);
      await msg.react('😂');
  } else if (command === '!grillo') {
      await sendAudio('grillo.mp3', msg);
      await msg.react('😂');
  } else if (command === '!material') {
      await sendAudio('material.mp3', msg);
      await msg.react('😂');
  } else if (command === '!miguel') {
      await sendAudio('miguel.mp3', msg);
      await msg.react('😂');
  } else if (command === '!miraesawea') {
      await sendAudio('miraesawea.mp3', msg);
      await msg.react('😂');
  } else if (command === '!nohayplata') {
      await sendAudio('nohayplata.mp3', msg);
      await msg.react('😂');
  } else if (command === '!oniichan') {
      await sendAudio('onishan.mp3', msg);
      await msg.react('😂');
  } else if (command === '!pago') {
      await sendAudio('pago.mp3', msg);
      await msg.react('😂');
  } else if (command === '!pedro') {
      await sendAudio('pedro.mp3', msg);
      await msg.react('😂');
  } else if (command === '!protegeme') {
      await sendAudio('protegeme.mp3', msg);
      await msg.react('😂');
  } else if (command === '!queeseso') {
      await sendAudio('queeseso.mp3', msg);
      await msg.react('😂');
  } else if (command === '!chistoso') {
      await sendAudio('risakeso.mp3', msg);
      await msg.react('😂');
  } else if (command === '!risa') {
      await sendAudio('risakiko.mp3', msg);
      await msg.react('😂');
  } else if (command === '!marcho') {
      await sendAudio('semarcho.mp3', msg);
      await msg.react('😂');
  } else if (command === '!spiderman') {
      await sendAudio('spiderman.mp3', msg);
      await msg.react('😂');
  } else if (command === '!suceso') {
      await sendAudio('suceso.mp3', msg);
      await msg.react('😂');
  } else if (command === '!tpillamos') {
      await sendAudio('tepillamos.mp3', msg);
      await msg.react('😂');
  } else if (command === '!tranquilo') {
      await sendAudio('tranquilo.mp3', msg);
      await msg.react('😂');
  } else if (command === '!vamosc') {
      await sendAudio('vamoschilenos.mp3', msg);
      await msg.react('😂');
  } else if (command === '!voluntad') {
      await sendAudio('voluntad.mp3', msg);
      await msg.react('😂');
  } else if (command === '!wenak') {
      await sendAudio('wenacabros.mp3', msg);
      await msg.react('😂');
  } else if (command === '!whisper') {
      await sendAudio('whisper.mp3', msg);
      await msg.react('😂');
  } else if (command === '!whololo') {
      await sendAudio('whololo.mp3', msg);
      await msg.react('😂');
  } else if (command === '!noinsultes') {
      await sendAudio('noinsultes.mp3', msg);
      await msg.react('😂');
  } else if (command === '!falso') {
      await sendAudio('falso.mp3', msg);
      await msg.react('😂');
  } else if (command === '!frio') {
      await sendAudio('frio.mp3', msg);
      await msg.react('😂');           
  } else if (command === '!yfuera') {
      await sendAudio('yfuera.mp3', msg);
      await msg.react('😂');
  } else if (command === '!nocreo') {
      await sendAudio('nocreo.mp3', msg);
      await msg.react('😂');
  } else if (command === '!yabasta') {
      await sendAudio('BUENO BASTA.mp3', msg);
      await msg.react('😂');
  } else if (command === '!quepaso') {
      await sendAudio('quepaso.mp3', msg);
      await msg.react('😂');
  } else if (command === '!nada') {
      await sendAudio('nada.mp3', msg);
      await msg.react('😂');
  } else if (command === '!idea2') {
      await sendAudio('idea2.mp3', msg);
      await msg.react('😂');    
  } else if (command === '!papito') {
      await sendAudio('papito.mp3', msg);
      await msg.react('😂');  
  } else if (command === '!jose') {
      await sendAudio('jose.mp3', msg);
      await msg.react('😂');  
  } else if (command === '!ctm') {
      await sendAudio('ctm.mp3', msg);
      await msg.react('😂'); 
  } else if (command === '!precio') {
      await sendAudio('precio.mp3', msg);
      await msg.react('😂'); 
  } else if (command === '!hermosilla') {
      await sendAudio('Hermosilla.mp3', msg);
      await msg.react('😂');
  } else if (command === '!marino') {
      await sendAudio('marino.mp3', msg);
      await msg.react('😂');
  } else if (command === '!manualdeuso') {
      await sendAudio('manualdeuso.mp3', msg);
      await msg.react('😂');
  } else if (command === '!estoy') {
      await sendAudio('estoy.mp3', msg);
      await msg.react('😂');
  } else if (command === '!pela') {
      await sendAudio('pela.mp3', msg);
      await msg.react('😂');
  } else if (command === '!chao') {
      await sendAudio('chao.mp3', msg);
      await msg.react('😂');
  } else if (command === '!aurora') {
      await sendAudio('aurora.mp3', msg);
      await msg.react('😂');
    } else if (command === '!weko') {
      await sendAudio('weko.mp3', msg);
      await msg.react('🏳️‍🌈');         
  } else if (command === '!himnoe') {
      await sendAudio('urssespañol.mp3', msg);
      await msg.react('🇷🇺');
  }
});

  async function sendAudio(audioFileName, msg) {
  const audioPath = path.join('C:', 'bots', 'AirFryers-bot', 'mp3', audioFileName);

  // Verificar si el archivo de audio existe
  if (fs.existsSync(audioPath)) {
    await msg.react('😂'); // Cambiamos la reacción al emoji de risa.
    
    const media = MessageMedia.fromFilePath(audioPath);
    await msg.reply(media, undefined, { sendMediaAsDocument: false }); // Enviamos el audio sin convertirlo en un documento.
  } else {
    await msg.reply(`No se encontró el archivo de audio "${audioFileName}" solicitado.`);
  }
}

/// Casos Aislados ///

// Función para cargar los casos desde el archivo casos.json
function cargarCasos() {
  try {
      const data = fs.readFileSync('casos.json', 'utf8');
      return JSON.parse(data);
  } catch (err) {
      console.error('Error al cargar los casos:', err);
      return [];
  }
}

let casos = cargarCasos(); // Definir casos y cargarlos desde el archivo JSON al inicio

// Función para listar casos aislados y enviarlos por WhatsApp
async function listarCasosAislados(msg) {
// Obtener los casos desde la variable
const casos = cargarCasos();

// Verificar si hay casos registrados
if (casos.length > 0) {
    let respuesta = '///// Casos Aislados ////\n';
    let urlsUnicas = []; // Lista para almacenar las URLs únicas
    
    casos.forEach((caso, index) => {
        // Verificar si la URL ya se ha impreso antes
        if (!urlsUnicas.includes(caso.enlace)) {
            respuesta += `${index + 1}. ${caso.descripcion}\n${caso.enlace}\n`;
            urlsUnicas.push(caso.enlace); // Agregar la URL a la lista de URLs impresas
        }
    });

    // Enviar la lista de casos
    await msg.reply(respuesta);

    // Enviar la cantidad de casos
    await msg.reply(`Actualmente hay ${casos.length} casos registrados.`);
} else {
    await msg.reply('No hay casos registrados.');
}
}

client.on('message', async (msg) => {
  const command = msg.body.toLowerCase();

  if (command.startsWith('!caso')) {
      const mensajeCaso = msg.body.replace('!caso', '').trim();
      
      const nuevoCaso = {
          descripcion: `Caso Aislado Número ${casos.length + 1}: ${mensajeCaso}`,
          enlace: mensajeCaso,
          fecha_ingreso: new Date().toISOString() // Agregar marca de tiempo de ingreso
      };
      
      casos.push(nuevoCaso);
      
      fs.writeFileSync('casos.json', JSON.stringify(casos), 'utf8');
      
      await msg.reply(`Caso Aislado Número ${casos.length} registrado: ${mensajeCaso}`);
  } else if (command === '!ecaso') {
      if (casos.length > 0) {
          casos.pop();
          
          fs.writeFileSync('casos.json', JSON.stringify(casos), 'utf8');
          
          await msg.reply(`Se eliminó un caso, ahora hay ${casos.length} casos.`);
      } else {
          await msg.reply('No se pueden eliminar más casos, no hay casos registrados.');
      }
  } else if (command === '!icaso') {
      await listarCasosAislados(msg); // Llamar a la función para listar y enviar los casos
  }
});

/// sticker ///

client.on('message', async (message) => {
  const isStickerCommand = message.body.toLowerCase() === '!s';

  if (isStickerCommand) {
    // Si el mensaje es un comando !s
    if (message.hasMedia && (message.type === 'video' || message.type === 'gif' || message.type === 'image')) {
      // Si el mensaje tiene un medio adjunto (video, gif o imagen)
      const media = await message.downloadMedia();
      const stickerName = 'Airfryers Bot'; // Nombre del sticker
      const packName = 'Airfryers Bot'; // Nombre del pack

      const metadata = {
        sendMediaAsSticker: true,
        stickerMetadata: {
          author: 'Airfryers Bot',
          pack: packName,
          type: message.type === 'image' ? message.mimetype : 'image/gif',
          width: message.type === 'video' ? message.videoResolution?.width : message.mediaData?.width,
          height: message.type === 'video' ? message.videoResolution?.height : message.mediaData?.height,
          name: stickerName,
        },
      };

      await message.reply(media, undefined, metadata);
    } else {
      // Si el mensaje no tiene un medio adjunto, busca el último mensaje con un medio adjunto
      const chat = await message.getChat();
      const messages = await chat.fetchMessages({ limit: 10 });
      const lastMediaMessage = messages.reverse().find(msg => msg.hasMedia && (msg.type === 'video' || msg.type === 'gif' || msg.type === 'image'));

      if (lastMediaMessage) {
        const media = await lastMediaMessage.downloadMedia();
        const stickerName = 'Airfryers Bot'; // Nombre del sticker
        const packName = 'Airfryers Bot'; // Nombre del pack

        const metadata = {
          sendMediaAsSticker: true,
          stickerMetadata: {
            author: 'Airfryers Bot',
            pack: packName,
            type: lastMediaMessage.type === 'image' ? lastMediaMessage.mimetype : 'image/gif',
            width: lastMediaMessage.type === 'video' ? lastMediaMessage.videoResolution?.width : lastMediaMessage.mediaData?.width,
            height: lastMediaMessage.type === 'video' ? lastMediaMessage.videoResolution?.height : lastMediaMessage.mediaData?.height,
            name: stickerName,
          },
        };

        await message.reply(media, undefined, metadata);
      } else {
        await message.reply('Por favor, envíe un video, gif o imagen con el comando !s, o responda a uno ya enviado.');
      }
    }
  }
});

 /// Comando par llamar a todos ///

  client.on('message', async (msg) => {
    const commandPrefix = '!dfd';
  
    if (msg.body.toLowerCase().startsWith(commandPrefix)) {
      const chat = await msg.getChat();
      const commandArgs = msg.body.slice(commandPrefix.length).trim();
  
      let text = "";
  
      if (commandArgs.length > 0) {
        text = `${commandArgs}\n\n`;
      }
  
      let mentions = [];
  
      for (let participant of chat.participants) {
        mentions.push(`${participant.id.user}@c.us`);
        text += `@${participant.id.user} `;
      }
  
      await chat.sendMessage(text, { mentions });
    }
  });

/// Chistes ///

const sentChistes = [];

client.on('message', async (msg) => {
  const command = msg.body.toLowerCase();

  if (command === '!chiste') {
    await sendRandomAudio('chistes', msg);
    await msg.react('😂'); // Reacción con emoji de risa.
  }
});

async function sendRandomAudio(chistes, msg) {
  const folderPath = path.join('C:', 'bots', 'AirFryers-bot', chistes);

  // Leer archivos en la carpeta de chistes
  const files = fs.readdirSync(folderPath);

  if (files.length > 0) {
    // Filtrar chistes no enviados
    const availableChistes = files.filter(chiste => !sentChistes.includes(chiste));

    // Verificar si quedan chistes no enviados
    if (availableChistes.length > 0) {
      // Seleccionar un chiste de forma aleatoria
      const randomIndex = Math.floor(Math.random() * availableChistes.length);
      const randomAudioFileName = availableChistes[randomIndex];

      const audioPath = path.join(folderPath, randomAudioFileName);

      // Verificar si el archivo de audio existe
      if (fs.existsSync(audioPath)) {
        const media = MessageMedia.fromFilePath(audioPath);
        await msg.reply(media, undefined, { sendMediaAsDocument: false });

        // Registrar el chiste como enviado
        sentChistes.push(randomAudioFileName);

        // Reiniciar la lista de chistes enviados si todos han sido enviados
        if (sentChistes.length === files.length) {
          sentChistes.length = 0;
        }
      } else {
        await msg.reply(`No se encontró el archivo de audio "${randomAudioFileName}" solicitado.`);
      }
    } else {
      await msg.reply('Todos los chistes han sido enviados. Reiniciando la lista.');
      // Reiniciar la lista de chistes enviados
      sentChistes.length = 0;
    }
  } else {
    await msg.reply('No hay archivos de audio en la carpeta de chistes.');
  }
}

/// PING ///

// Función para realizar múltiples mediciones de ping y calcular la media
async function performPingMeasurements(numMeasurements) {
  const pingTimes = [];
  const lagTimes = [];

  for (let i = 0; i < numMeasurements; i++) {
      const { startTime, endTime } = await measurePing();
      const pingTime = endTime - startTime;
      const lag = endTime - startTime - pingTime;

      pingTimes.push(pingTime);
      lagTimes.push(lag);
  }

  return {
      averagePingTime: calculateAverage(pingTimes),
      averageLag: calculateAverage(lagTimes)
  };
}

// Función para medir el ping y el lag
async function measurePing() {
  const startTime = Date.now();
  await sendPingResponse();
  const endTime = Date.now();
  return { startTime, endTime };
}

// Envía un mensaje de ping al mismo número
async function sendPingResponse() {
  // Simulamos un tiempo de respuesta aleatorio entre 100 y 500 ms
  const responseTime = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
  await new Promise(resolve => setTimeout(resolve, responseTime));
}

// Función para calcular el promedio de una matriz de números
function calculateAverage(numbers) {
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  return sum / numbers.length;
}

// Manejo del comando !ping
client.on('message', async (message) => {
  try {
      if (message.body.startsWith('!ping')) {
          const usuario = message.from;
          const numMeasurements = 3; // Número de mediciones de ping a realizar

          // Realiza múltiples mediciones de ping y calcula el promedio
          const { averagePingTime, averageLag } = await performPingMeasurements(numMeasurements);

          // Envía un mensaje con los resultados y reacciona con un emoticon de rana o sapo
          await sendResultsAndReact(message, averagePingTime, averageLag);
      }
  } catch (error) {
      console.error('Error al manejar el comando !ping:', error.message);
  }
});

// Función para enviar los resultados y reaccionar con un emoticon de rana o sapo
async function sendResultsAndReact(message, averagePingTime, averageLag) {
  // Redondear los valores a dos decimales
  const roundedPingTime = Math.round(averagePingTime * 100) / 100;
  const roundedLag = Math.round(averageLag * 100) / 100;

  // Envía un mensaje con los resultados
  await message.reply(`El ping promedio es de: ${roundedPingTime.toFixed(2)} ms, y el Lag promedio es de: ${roundedLag.toFixed(2)} ms`);

  // Reacciona con un emoticon de rana o sapo
  await message.react('🐸');
}

/// Videos +18 ///

client.on('message', async (msg) => {
  const lowerCaseBody = msg.body.toLowerCase();

  if (lowerCaseBody.startsWith('!xv')) {
    const keyword = lowerCaseBody.substring(4).trim();
    try {
      const searchUrl = `https://www.xvideos.com/?k=${encodeURIComponent(keyword)}`;
      const response = await axios.get(searchUrl);

      const $ = cheerio.load(response.data);
      const videos = [];

      // Extraer los elementos de video y obtener los detalles relevantes
      $('.mozaique .thumb-block').each((index, element) => {
        const title = $(element).find('.thumb-under .title').text().trim();
        const duration = $(element).find('.thumb-under .duration').text().trim();
        const views = parseInt($(element).find('.thumb-under .views').text().trim().replace(',', ''));
        const url = $(element).find('.thumb a').attr('href');

        videos.push({ title, duration, views, url });
      });

      // Ordenar los videos por vistas de forma descendente y duración de forma ascendente
      videos.sort((a, b) => {
        if (a.views !== b.views) {
          return b.views - a.views; // Ordenar por vistas de forma descendente
        }
        const durationA = getDurationInSeconds(a.duration);
        const durationB = getDurationInSeconds(b.duration);
        return durationB - durationA; // Ordenar por duración de forma ascendente
      });

      let replyMessage = `Resultados de búsqueda en Xvideos para "${keyword}":\n\n`;

      videos.slice(0, 12).forEach((video) => {
        replyMessage += `${video.title}\n`;
        replyMessage += `Duración: ${video.duration}\n`;
        replyMessage += `URL: https://www.xvideos.com${video.url}\n\n`;
      });

      await client.sendMessage(msg.from, replyMessage);
    } catch (error) {
      console.error('Error al buscar en Xvideos:', error.message);
      await client.sendMessage(msg.from, 'Ocurrió un error al buscar en Xvideos.');
    }
  }
});

function getDurationInSeconds(duration) {
  const parts = duration.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseInt(parts[0]);
    const seconds = parseInt(parts[1]);
    return minutes * 60 + seconds;
  } else if (parts.length === 1) {
    const seconds = parseInt(parts[0]);
    return seconds;
  }
  return 0;
}

/// Clima ///

// Mapeo de condiciones climáticas de inglés a español
const traduccionesClima = {
  "Clear": "Despejado",
  "Partly cloudy": "Parcialmente nublado",
  "Cloudy": "Nublado",
  "Overcast": "Cubierto",
  "Mist": "Niebla",
  "Patchy rain possible": "Posible lluvia irregular",
  "Light rain": "Lluvia ligera",
  "Moderate rain": "Lluvia moderada",
  "Heavy rain": "Lluvia fuerte",
  "Thunderstorm": "Tormenta",
  "Snow": "Nieve",
  // Agrega más condiciones y sus traducciones según sea necesario
};

// Función para obtener el clima de una ciudad
async function obtenerClima(ciudad) {
  try {
    const response = await axios.get(`https://wttr.in/${ciudad}?format=%t+%C+%h+%w+%P`);
    return response.data.trim();
  } catch (error) {
    console.error('Error al obtener el clima:', error);
    throw error;
  }
}

// Función para traducir la condición climática
function traducirCondicion(condicion) {
  return traduccionesClima[condicion] || condicion;
}

// Manejar los mensajes entrantes
client.on('message', async (message) => {
  const commandRegex = /^!clima (.+)/;
  const match = message.body.match(commandRegex);

  if (match) {
    const ciudad = match[1].trim();

    try {
      const clima = await obtenerClima(ciudad);
      const climaArray = clima.split(' ');

      const temperatura = climaArray[0];
      const condicion = climaArray.slice(1, climaArray.length - 3).join(' '); // Esto asume que la condición puede ser más de una palabra
      const humedad = climaArray[climaArray.length - 3];

      // Traducir la condición climática
      const condicionTraducida = traducirCondicion(condicion);

      // Formatear la respuesta
      const respuesta = `El clima en ${ciudad.charAt(0).toUpperCase() + ciudad.slice(1)} es: ${temperatura}, ${condicionTraducida}, ${humedad}`;
      
      await message.reply(respuesta);
    } catch (error) {
      console.error('Error al procesar el comando !clima:', error);
      await message.reply('Lo siento, no pude obtener el clima en este momento. Por favor, inténtalo más tarde.');
    }
  }
});


/// celulizador ///

client.on('message', async message => {
  let phoneNumber = '';
  if (message.body.startsWith('!tel') || message.body.startsWith('!num')) {
      // Limpiar la variable phoneNumber de caracteres no deseados y extraer el número
      phoneNumber = message.body.replace(/^!tel|^!num/g, '').replace(/[^\x20-\x7E]/g, '').trim();

      if (phoneNumber) {
          try {
              // Agregar reacción de reloj de arena al mensaje original del usuario
              await message.react('⏳');

              let data = new FormData();
              data.append('tlfWA', phoneNumber);

              let config = {
                  method: 'post',
                  maxBodyLength: Infinity,
                  url: 'https://celuzador.porsilapongo.cl/celuzadorApi.php',
                  headers: { 
                      'User-Agent': 'CeludeitorAPI-TuCulitoSacaLlamaAUFAUF', 
                      ...data.getHeaders()
                  },
                  data: data
              };

              const response = await axios.request(config);

              if (response.data.estado === 'correcto') {
                  let regex = /\*Link Foto\* : (https?:\/\/[^\s]+)(?=\n\*Estado)/;
                  let url = response.data.data.match(regex);

                  if (url && url[1]) {
                      console.log("URL encontrada:", url[1]);
                      const media = await MessageMedia.fromUrl(url[1]);
                      // Etiquetar al usuario en el mensaje
                      await client.sendMessage(message.from, media, { caption: `ℹ️ Información del número ℹ️\n@${message.sender ? message.sender.id : ''} ${response.data.data}` });
                  } else {
                      console.log("URL no encontrada");
                      // Etiquetar al usuario en el mensaje
                      await client.sendMessage(message.from, `ℹ️ Información del número ℹ️\n@${message.sender ? message.sender.id : ''} ${response.data.data}`);
                  }

                  // Agregar reacción de check al mensaje original del usuario
                  await message.react('☑️');
              } else {
                  // Etiquetar al usuario en el mensaje
                  await message.reply(`@${message.sender ? message.sender.id : ''} ${response.data.data}`);
                  // Agregar reacción de ❌ al mensaje original del usuario en caso de error
                  await message.react('❌');
              }
          } catch (error) {
              console.error("Error al enviar el mensaje:", error);
              // Etiquetar al usuario en el mensaje
              await message.reply(`@${message.sender ? message.sender.id : ''} ⚠️ Hubo un error al enviar el mensaje. Por favor, intenta nuevamente más tarde.`);
              // Agregar reacción de ❌ al mensaje original del usuario en caso de error
              await message.react('❌');
          }
      } else {
          // Etiquetar al usuario en el mensaje
          await message.reply(`@${message.sender ? message.sender.id : ''} ⚠️ Por favor, ingresa un número de teléfono después del comando.`);
          // Agregar reacción de ❌ al mensaje original del usuario en caso de error
          await message.react('❌');
      }
  }
});


/// Sismos ///

client.on('message', async message => {
  if (message.body === '!sismos') {
      try {
          const response = await axios.get('https://api.gael.cloud/general/public/sismos');
          const sismos = response.data.slice(0, 5); // Obtiene los últimos 5 sismos
          let responseMessage = '🌍 Últimos 5 sismos:\n\n';
          sismos.forEach(sismo => {
              const { fechaHora, fechaSeparada } = formatFecha(sismo.Fecha);
              responseMessage += `📅 Hora y Fecha: ${fechaHora}\n`;
              responseMessage += `🕳 Profundidad: ${sismo.Profundidad} km\n`;
              responseMessage += `💥 Magnitud: ${sismo.Magnitud}\n`;
              responseMessage += `📍 Referencia Geográfica: ${sismo.RefGeografica}\n`;
              responseMessage += `🔗 Ver en Google Maps: https://www.google.com/maps/search/?api=1&query=${encodeURI(sismo.RefGeografica)}\n`;
              responseMessage += `🕒 Fecha de Actualización: ${formatFecha(sismo.FechaUpdate).fechaHora}\n\n`;
          });
          message.reply(responseMessage);
      } catch (error) {
          console.error('Error al obtener los sismos:', error);
          message.reply('⚠️ Hubo un error al obtener los sismos. Por favor, intenta nuevamente más tarde.');
      }
  }
});

function formatFecha(fecha) {
  if (!fecha) {
      return { fechaHora: '', fechaSeparada: '' };
  }

  const [date, time] = fecha.split('T');
  const [year, month, day] = date.split('-');

  let hour = '';
  let minute = '';
  let second = '';

  if (time) {
      const timePart = time.substring(0, 8);
      if (timePart) {
          [hour, minute, second] = timePart.split(':');
      }
  }

  const fechaHora = `${day} ${hour !== '00' ? hour : ''}:${minute !== '00' ? minute : ''}:${second !== '00' ? second : ''}`;
  const fechaSeparada = `${day}/${month}/${year}`;

  return { fechaHora, fechaSeparada };
}

///fapello//

client.on('message', async (message) => {
  if (message.body.startsWith('!fap')) {
    const searchTerm = message.body.slice(5).trim();
    if (!searchTerm) {
      // Si no hay texto después del comando, enviar un mensaje indicando que se necesitan parámetros
      client.sendMessage(message.from, 'Por favor ingresa un término de búsqueda después de !fap');
      return;
    }

    try {
      const response = await axios.post(
        'https://celuzador.porsilapongo.cl/fappello.php',
        new URLSearchParams({
          'term': searchTerm
        }),
        {
          headers: {
            'User-Agent': 'CeludeitorAPI-TuCulitoSacaLlamaAUFAUF'
          }
        }
      );
      
      const resultados = response.data;
      
      if (resultados && resultados.length > 0) {
        let mensajeRespuesta = `Resultado de la búsqueda para "${searchTerm}":\n`;
        
        resultados.forEach((resultado, index) => {
          mensajeRespuesta += `${index + 1}. ${resultado.name} - ${resultado.profile_url}\n`;
        });
        
        // Enviar el resultado formateado al usuario
        client.sendMessage(message.from, mensajeRespuesta);
      } else {
        client.sendMessage(message.from, 'Lo siento, no se encontraron resultados para tu búsqueda.');
      }
      
    } catch (error) {
      console.error('Error al realizar la búsqueda:', error);
      // Manejo de errores
      client.sendMessage(message.from, 'Lo siento, ha ocurrido un error al realizar la búsqueda.');
    }
  } else if (message.body === '!media') {
    try {
      const media = await MessageMedia.fromUrl('https://via.placeholder.com/350x150.png');
      await client.sendMessage(message.from, media); // Enviar media al remitente del mensaje original
      // También puedes enviar media a otro chat especificando el ID del chat como primer argumento
      // Por ejemplo:
      // await client.sendMessage('CHAT_ID', media, { caption: 'this is my caption' });
    } catch (error) {
      console.error('Error al enviar media:', error);
      client.sendMessage(message.from, 'Lo siento, ha ocurrido un error al enviar la media.');
    }
  }
});


///Paradero///

client.on('message', async message => {
  if (message.body.startsWith('!bus')) {
      const args = message.body.slice(4).trim().split(/ +/); // Corregido para que incluya el código de paradero correctamente
      const codigo_paradero = args[0];

      try {
          const browser = await puppeteer.launch();
          const page = await browser.newPage();

          // Envía un mensaje al usuario indicando que se está obteniendo la información
          const sentMessage = await message.reply('Espere un momento por favor mientras obtengo la información.');

          // Añadir reacción de "reloj de arena" al mensaje del usuario
          await sentMessage.react('⏳');

          const base_url = "https://www.red.cl/planifica-tu-viaje/cuando-llega/?codsimt=";
          const url = base_url + codigo_paradero;

          await page.goto(url);

          // Espera a que el paradero esté disponible
          await page.waitForSelector('.nombre-parada', { timeout: 20000 }); // Aumentar el tiempo de espera a 20 segundos

          const nombre_paradero = await page.$eval('.nombre-parada', element => element.textContent.trim());

          let response = `📍 Nombre del paradero: ${nombre_paradero}\n🚏 Código del paradero: ${codigo_paradero}\n\n`;

          const tabla_recorridos = await page.$('#nav-00');
          const filas = await tabla_recorridos.$$('tr');

          for (let i = 1; i < filas.length; i++) {
              const numero_bus = await filas[i].$eval('.bus', element => element.textContent.trim());
              const destino = await filas[i].$$eval('.td-dividido', elements => elements[1].textContent.trim());
              const tiempo_llegada = await filas[i].$eval('.td-right', element => element.textContent.trim());

              // Asignar emojis según el número del bus
              let emoji = '';
              switch (numero_bus) {
                  case '348':
                  case 'I07':
                  case '109N':
                  case '432N':
                      emoji = '🚌';
                      break;
                  // Agregar más casos según sea necesario
                  default:
                      emoji = '🚌'; // Emoticono predeterminado
              }

              response += `${emoji} Recorrido: Bus ${numero_bus}\n🗺️ Dirección: ${destino}\n⏰ Tiempo de llegada: ${tiempo_llegada}\n\n`;
          }

          await browser.close();

          // Envía el mensaje con la respuesta al mensaje del usuario correcto
          await message.reply(response);

          // Añadir reacción de "dedo arriba" al mensaje del usuario
          await message.react('👍');
      } catch (error) {
          // Si hay un error al obtener la información, envía un mensaje de error al usuario
          console.error('Error:', error.message);
          await message.reply('Pajaron qliao no se pudo obtener la información del paradero');

          // Añadir reacción de "X" al mensaje del usuario
          await message.react('❌');
      }
  }
});


/// Bencineras ///

client.on('message', async msg => {
    if (msg.body.startsWith('!bencina') || msg.body.startsWith('!Bencina')) {
        const comuna = msg.body.substring(msg.body.indexOf(' ') + 1).trim(); // Obtener la comuna después del primer espacio
        const python = spawn('python', [path.join(__dirname, 'bencina.py'), comuna]);
        
        msg.reply('Espere un momento... ⏳').then(() => {
            msg.react('⌛');
        });

        python.on('error', (err) => {
            console.error('Error al ejecutar el script de Python:', err);
            msg.reply('Ocurrió un error al obtener los datos de bencina.');
        });

        python.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            if (code !== 0) {
                msg.reply('Error al obtener los datos de bencina.');
                msg.react('❌');
                return;
            }

            const outputFile = path.join(__dirname, 'output.txt');
            fs.readFile(outputFile, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error al leer el archivo de salida:', err);
                    msg.reply('Ocurrió un error al leer los datos de bencina.');
                    msg.react('❌');
                    return;
                }

                if (data.trim() === '') {
                    msg.reply('No se encontraron datos para esa comuna, aweonao.');
                    msg.react('❌');
                    return;
                }

                msg.reply(data);
                msg.react('✅');
            });
        });
    }
});


/// Horoscopo ///

client.on('message', async (msg) => {
  const command = msg.body.toLowerCase().trim();
  
  if (command.startsWith('!horoscopo')) {
      const args = command.split(' ');
      const signo = args[1];

      if (!signo) {
          msg.reply('Por favor, proporciona un signo válido.');
          return;
      }

      const signoLimpio = limpiarSigno(signo); // Mantén esto aquí

      // Para el horóscopo occidental
      if (/^(aries|tauro|geminis|cancer|leo|virgo|libra|escorpion|sagitario|capricornio|acuario|piscis)$/i.test(signoLimpio)) {
          getHoroscopo('horoscopo.py', signoLimpio, msg.from);
      } 
      // Para el horóscopo chino
      else if (/^(rata|buey|tigre|conejo|dragon|serpiente|caballo|cabra|mono|gallo|perro|cerdo)$/i.test(signoLimpio)) {
          getHoroscopo('horoscopoc.py', signoLimpio, msg.from);
      } else {
          msg.reply('Por favor, proporciona un signo válido.');
      }
  }
});

// Función para limpiar el signo de tildes y otros caracteres especiales
function limpiarSigno(signo) {
  return signo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Función para obtener y enviar el horóscopo
function getHoroscopo(script, signo, chatId) {
  exec(`python ${script} ${signo}`, { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }, (error, stdout, stderr) => {
      if (error) {
          console.error(`Error al ejecutar el comando: ${error}`);
          client.sendMessage(chatId, 'Ocurrió un error al obtener el horóscopo.');
          return;
      }
      if (stderr) {
          console.error(`stderr: ${stderr}`);
          client.sendMessage(chatId, 'Ocurrió un error al obtener el horóscopo.');
          return;
      }

      const horoscopo = stdout.trim();
      if (horoscopo === 'Signo no encontrado.') {
          client.sendMessage(chatId, horoscopo);
      } else {
          // Envía el texto del horóscopo
          client.sendMessage(chatId, horoscopo);

          // Envía la imagen correspondiente
          const imagePath = findImage(signo); // Cambia esto a signo
          if (imagePath) {
              sendImage(chatId, imagePath);
          } else {
              console.error(`No se encontró una imagen para el signo ${signo}`);
          }
      }
  });
}

// Función para encontrar la imagen correspondiente
function findImage(signo) {
  const signoImagesPath = path.join(__dirname, 'signos');
  
  if (!fs.existsSync(signoImagesPath)) {
      console.error(`El directorio de imágenes no existe: ${signoImagesPath}`);
      return null;
  }

  const files = fs.readdirSync(signoImagesPath);
  for (const file of files) {
      const filenameWithoutExt = limpiarSigno(file.split('.')[0]);
      if (filenameWithoutExt === signo) {
          return path.join(signoImagesPath, file);
      }
  }
  
  console.error(`No se encontró una imagen para el signo ${signo}`);
  return null;
}

// Función para enviar una imagen
async function sendImage(chatId, imagePath) {
  if (fs.existsSync(imagePath)) {
      const media = MessageMedia.fromFilePath(imagePath);
      await client.sendMessage(chatId, media, { caption: '' });
  } else {
      console.error(`La imagen no existe en la ruta: ${imagePath}`);
  }
}


/// Transbank ///

// Escucha los mensajes recibidos
client.on('message', async (msg) => {
  if (msg.body === '!trstatus') {
      console.log("Mensaje recibido: !trstatus");
      obtenerEstadoTransbank(msg.from);
  }
});

// Función para ejecutar el script transbank.py
function obtenerEstadoTransbank(chatId) {
  exec('python transbank.py', (error, stdout, stderr) => {
      if (error) {
          console.error(`Error al ejecutar el script: ${error}`);
          client.sendMessage(chatId, 'Ocurrió un error al obtener el estado de Transbank.');
          return;
      }
      client.sendMessage(chatId, stdout);
  });
}

/// Ticket ///

client.on('message', async message => {
  if (message.body.startsWith('!ticket')) {
      const args = message.body.split(' ');

      if (args.length === 1) {
          // Show tickets
          const ticketsData = fs.readFileSync(TICKET_FILE_PATH, 'utf8');
          let tickets = [];
          if (ticketsData.trim() !== '') {
              tickets = JSON.parse(ticketsData);
          }
          if (tickets.length === 0) {
              await message.reply('No hay tickets guardados.');
          } else {
              let response = 'Tickets guardados:\n';
              tickets.forEach((ticket, index) => {
                  const ticketNumber = index + 1;
                  response += `${pad(ticketNumber, 4)}. ${ticket.text}${ticket.resolved ? ' ✅' : ' ⏳'}\n`;
              });
              await message.reply(response);
          }
      } else if (args[0] === '!ticketr' && args.length === 2) {
          // Resolve ticket
          const ticketNumber = parseInt(args[1]);
          const ticketsData = fs.readFileSync(TICKET_FILE_PATH, 'utf8');
          let tickets = [];
          if (ticketsData.trim() !== '') {
              tickets = JSON.parse(ticketsData);
          }
          if (ticketNumber >= 1 && ticketNumber <= tickets.length) {
              tickets[ticketNumber - 1].resolved = true;
              fs.writeFileSync(TICKET_FILE_PATH, JSON.stringify(tickets));
              await message.reply(`El ticket ${ticketNumber} ha sido marcado como resuelto.`);
          } else {
              await message.reply('Número de ticket inválido.');
          }
      } else if (args[0] === '!tickete' && args.length === 2) {
          // Eliminar ticket
          const ticketNumber = parseInt(args[1]);
          const ticketsData = fs.readFileSync(TICKET_FILE_PATH, 'utf8');
          let tickets = [];
          if (ticketsData.trim() !== '') {
              tickets = JSON.parse(ticketsData);
          }
          if (ticketNumber >= 1 && ticketNumber <= tickets.length) {
              tickets.splice(ticketNumber - 1, 1);
              fs.writeFileSync(TICKET_FILE_PATH, JSON.stringify(tickets));
              await message.reply(`El ticket ${ticketNumber} ha sido eliminado.`);
          } else {
              await message.reply('Número de ticket inválido.');
          }
      } else {
          // Save ticket
          args.shift(); // Remove !ticket
          const motivo = args.join(' ');
          const ticketsData = fs.readFileSync(TICKET_FILE_PATH, 'utf8');
          let tickets = [];
          if (ticketsData.trim() !== '') {
              tickets = JSON.parse(ticketsData);
          }
          tickets.push({ text: motivo, resolved: false });
          fs.writeFileSync(TICKET_FILE_PATH, JSON.stringify(tickets));
          await message.reply('Ticket guardado exitosamente ⏳.');
      }
  }
});

/// Gif con audios ///

client.on('message', async (msg) => {
  if (msg.body.startsWith('!pedro')) {
      const file = 'C:\\bots\\AirFryers-bot\\mp3\\gif\\pedro.webp'; // Ruta del sticker
      const chat = await msg.getChat();

      try {
          if (fs.existsSync(file)) {
              const sticker = MessageMedia.fromFilePath(file);
              chat.sendMessage(sticker, { sendMediaAsSticker: true });
          } else {
              console.log('El archivo no existe.');
          }
      } catch (err) {
          console.log('Error al enviar el archivo:', err);
      }
  }
});


/// Luz ///

client.on('message', async msg => {
  if (msg.body.startsWith('!sec')) {
      let region = null;
      if (msg.body === '!secrm') {
          region = 'Metropolitana';
      } else if (msg.body.startsWith('!sec ')) {
          region = msg.body.split(' ')[1];
      }

      try {
          const message = await generateWhatsAppMessage(region);
          msg.reply(message);
      } catch (error) {
          console.error('Error generating WhatsApp message:', error);
          msg.reply('Hubo un error al obtener los datos.');
      }
  }
});


// Base de datos //

// Crear la tabla si no existe
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, body TEXT, timestamp INTEGER, mediaType TEXT, mediaSize INTEGER)", (err) => {
        if (err) {
            console.error("Error al crear la tabla de mensajes:", err);
        }
    });
});

// Función para almacenar mensajes en la base de datos
function storeMessage(id, body, timestamp, mediaType = null, mediaSize = null) {
    db.run("INSERT OR REPLACE INTO messages (id, body, timestamp, mediaType, mediaSize) VALUES (?, ?, ?, ?, ?)", 
        [id, body, timestamp, mediaType, mediaSize], (err) => {
            if (err) {
                console.error("Error al almacenar el mensaje:", err);
            }
        });
}

// Función para obtener un mensaje original por ID usando Promesas
function getOriginalMessage(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT body FROM messages WHERE id = ?", [id], (err, row) => {
            if (err) {
                reject("Error al obtener el mensaje original:", err);
            } else {
                resolve(row ? row.body : null);
            }
        });
    });
}

// Función para eliminar mensajes antiguos
function cleanupOldMessages() {
    const expirationTime = Date.now() - (5 * 60 * 1000); // 5 minutos
    db.run("DELETE FROM messages WHERE timestamp < ?", [expirationTime], function (err) {
        if (err) {
            console.error("Error al eliminar mensajes antiguos:", err);
        } else {
            console.log(`Se eliminaron ${this.changes} mensajes antiguos.`);
        }
    });
}

// Manejo de mensajes eliminados
client.on('message_revoke_everyone', async (after, before) => {
    try {
        if (before && !before.fromMe) {
            const chat = await before.getChat();
            const sender = await before.getContact();
            let message;

            if (before.hasMedia) {
                const mediaType = before.type; // Puede ser 'image', 'video', 'audio', etc.
                switch (mediaType) {
                    case 'image':
                        message = `El usuario @${sender.id.user} eliminó una fotografía.`;
                        break;
                    case 'video':
                        message = `El usuario @${sender.id.user} eliminó un video.`;
                        break;
                    case 'audio':
                        message = `El usuario @${sender.id.user} eliminó un audio.`;
                        break;
                    default:
                        message = `El usuario @${sender.id.user} eliminó un mensaje multimedia.`;
                }
            } else {
                message = `El usuario @${sender.id.user} eliminó el mensaje: "${before.body}"`;
            }

            if (after) {
                message += `\nEl mensaje después de la eliminación fue: "${after.body}"`;
            }

            await chat.sendMessage(message, { mentions: [sender] });
        }
    } catch (error) {
        console.error("Error al procesar el mensaje eliminado:", error);
    }
});

// Manejo de mensajes editados
client.on('message_update', async (message) => {
    try {
        if (!message.fromMe) {
            const originalMessage = await getOriginalMessage(message.id._serialized);
            if (originalMessage && originalMessage !== message.body) {
                const chat = await message.getChat();
                const sender = await message.getContact();

                const notifyMessage = `El usuario @${sender.id.user} editó un mensaje. Original: "${originalMessage}" - Editado: "${message.body}"`;
                await chat.sendMessage(notifyMessage, { mentions: [sender] });

                storeMessage(message.id._serialized, message.body, Date.now());
            }
        }
    } catch (error) {
        console.error("Error al manejar un mensaje editado:", error);
    }
});

// Almacenar los mensajes originales cuando se crean
client.on('message_create', async (message) => {
    if (!message.fromMe) {
        const mediaType = message.hasMedia ? message.type : null;
        const mediaSize = message.hasMedia ? message.size : null;
        storeMessage(message.id._serialized, message.body, Date.now(), mediaType, mediaSize);
    }
});

// Limpiar mensajes antiguos cada 5 minutos
setInterval(cleanupOldMessages, 5 * 60 * 1000);

// Cerrar la base de datos correctamente cuando el proceso termine
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error("Error al cerrar la base de datos:", err);
        } else {
            console.log("Base de datos cerrada.");
        }
        process.exit();
    });
});


// Comparacion celular//

client.on('message', async msg => {
    if (msg.body.startsWith('!compara') || msg.body.startsWith('/compara')) {
        const models = msg.body.split(' ').slice(1);
        if (models.length === 2) {
            const comparison = await compareModels(models[0], models[1]);
            msg.reply(comparison);
        } else {
            msg.reply('Por favor, proporciona dos modelos para comparar. Ejemplo: !compara iPhone13 GalaxyS21');
        }
    }
});

async function compareModels(model1, model2) {
    try {
        // Ejemplo de URL de API ficticia
        const response1 = await axios.get(`https://api.phonesdata.com/v1/models/${model1}`);
        const response2 = await axios.get(`https://api.phonesdata.com/v1/models/${model2}`);

        const phone1 = response1.data;
        const phone2 = response2.data;

        return `
            Comparación entre ${phone1.name} y ${phone2.name}:

            **Cámara**
            - *${phone1.name}*: ${phone1.camera.description}
            - *${phone2.name}*: ${phone2.camera.description}

            **Procesador y rendimiento**
            - *${phone1.name}*: ${phone1.processor.description}
            - *${phone2.name}*: ${phone2.processor.description}

            **Batería y carga**
            - *${phone1.name}*: ${phone1.battery.description}
            - *${phone2.name}*: ${phone2.battery.description}

            **Sistema operativo**
            - *${phone1.name}*: ${phone1.os}
            - *${phone2.name}*: ${phone2.os}

            **Conclusión**
            Ambos teléfonos son excelentes opciones, pero la elección depende de tus necesidades y preferencias personales.
        `;
    } catch (error) {
        return 'Error al obtener la comparación. Por favor, intenta de nuevo más tarde.';
    }
}


client.initialize();

// Función para añadir ceros a la izquierda hasta alcanzar la longitud especificada
function pad(number, length) {
  let str = '' + number;
  while (str.length < length) {
      str = '0' + str;
  }
  return str;
}