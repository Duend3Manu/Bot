"use strict";

// Importaciones de utilidades y herramientas
const fs = require('fs');
const path = require('path');
const pathToFfmpeg = 'C:\\FFmpeg\\bin\\ffmpeg.exe';
const sanitize = require('sanitize-filename'); // Biblioteca para limpiar nombres de archivo
const streamBuffers = require('stream-buffers');
const { htmlToText } = require('html-to-text');
const { Builder, By, until } = require('selenium-webdriver'); // Importación única de selenium-webdriver
const edge = require('selenium-webdriver/edge');
const yargs = require('yargs');
const { spawn } = require('child_process');
const FormData = require('form-data');
const puppeteer = require('puppeteer');
const chrome = require('selenium-webdriver/chrome');
const { exec } = require('child_process');
const express = require('express');
const app = express();
const { generateWhatsAppMessage } = require('./SECTEST');  // Asegúrate de que la ruta es correcta

// Importaciones de WhatsApp y qrcode
const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Importaciones de bibliotecas de terceros
const axios = require('axios');
const cheerio = require('cheerio');
const ffmpeg = require('fluent-ffmpeg');
const gify = require('gify');
const GoogleIt = require('google-it');
const Jimp = require('jimp');
const moment = require('moment-timezone');
const xvideos = require('@rodrigogs/xvideos');
const InstagramScraper = require('instagram-scraper');
const twitterVideoDownloader = require('twitter-video-downloader');
const unorm = require('unorm');
const iconv = require('iconv-lite');
const { PythonShell } = require('python-shell');
const { JSDOM } = require('jsdom');

// Importaciones de módulos personalizados
const clasi = require('./Archivos/clasi.js');
const metro = require('./Archivos/metro.js');
const proxpar = require('./Archivos/proxpar.js');
const tabla = require('./Archivos/tabla.js');
const tclasi = require('./Archivos/tclasi.js');
const valores = require('./Archivos/valores.js');
const TICKET_FILE_PATH = './ticket.json';
const excelFilePath = 'resultados_copa_america.xlsx';

// Otras importaciones //
const opts = {};
// Objeto para almacenar los tickets
let tickets = {};
// Crear archivo ticket.json si no existe
if (!fs.existsSync(TICKET_FILE_PATH)) {
  fs.writeFileSync(TICKET_FILE_PATH, '[]');
}
// Establecer idioma en español
moment.locale('es');

// Configuración del cliente de WhatsApp
const webVersion = '2.2412.54';
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { 
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Ruta a Chrome en Windows
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ]
  },
  webVersionCache: {
    type: 'remote',
    remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${webVersion}.html`,
  },
});

console.log("El bot se está conectando, por favor espere...");

client.setMaxListeners(Infinity);

// URL de la API de feriados
const apiUrlFeriados = 'https://apis.digital.gob.cl/fl/feriados';

// URL de la API de Mindicador
const apiUrlMindicador = 'https://mindicador.cl/api';

// URL de la API de farmacias de turno
const apiUrlFarmacias = 'https://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php';

// Evento que se activa cuando se necesita escanear el código QR para iniciar sesión
client.on('qr', (qrCode) => {
  qrcode.generate(qrCode, { small: true });
});

// Evento que se activa cuando el cliente está listo para ser utilizado
client.on('ready', () => {
  console.log('AirFryers bot está listo');
});


// Evento que se activa cuando se recibe un mensaje
client.on('message', async (msg) => {
  console.log('Mensaje recibido:', msg.body);

  const lowerCaseBody = msg.body.toLowerCase();

  // Obtener información del remitente
  const senderInfo = await msg.getContact();

  // Resto del código para otros comandos y funciones
  
  if (lowerCaseBody === '!menu' || lowerCaseBody === '!comandos') {
    sendMenu(msg.from);
  }
   else if (lowerCaseBody === '!hola') {
    const responses = JSON.parse(fs.readFileSync('saludos.json', 'utf8'));
    const randomResponse = getRandomResponse(responses);
    client.sendMessage(msg.from, `👋🏻 ${randomResponse}`);
  } else if (lowerCaseBody === '!d') {
    try {
      const response = await axios.get(apiUrlMindicador);
      const { uf, dolar, euro, utm } = response.data;

      const replyMessage = `💰 Valores actuales:
      
      ╔══════AirFryers Bot═══════╗
      ║  - Dólar: $${dolar.valor}║
      ║                          ║
      ║  - Euro: $${euro.valor}  ║
      ║                          ║
      ║  - UF: $${uf.valor}      ║
      ║                          ║
      ║  - UTM: $${utm.valor}    ║
      ╚═════AirFryers Bot════════╝`;

      client.sendMessage(msg.from, replyMessage);
    } catch (error) {
      console.log('Error al obtener los valores:', error.message);
      client.sendMessage(msg.from, 'Ocurrió un error al obtener los valores.');
    }
  }
    /// Feriados//
    else if (lowerCaseBody === '!feriados') {
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
  
          // Si no hay más feriados en la lista, se informa al usuario.
          if (nextFeriados === 0) {
              replyMessage = 'No se encontraron próximos feriados.';
          }
  
          client.sendMessage(msg.from, replyMessage);
      } catch (error) {
          console.log('Error al obtener los feriados:', error.message);
          client.sendMessage(msg.from, 'Ocurrió un error al obtener los feriados.');
      }
  
    /// Farmacias//

} else if (lowerCaseBody.startsWith('!far')) {
  const city = lowerCaseBody.substring(5)?.trim();
  if (city) {
    try {

      const waitMessage = 'Un momento por favor, solicitando la información ⏳';
      const waitMessageObj = await client.sendMessage(msg.from, waitMessage);

      const response = await axios.get(apiUrlFarmacias);
      const farmacias = response.data;

      let filteredFarmacias = farmacias.filter((farmacia) =>
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
            local_lng
          } = farmacia;

          // Obtener la fecha y hora de apertura y cierre
          const apertura = moment(`${funcionamiento_hora_apertura} ${currentDateTime.format('YYYY-MM-DD')}`, 'HH:mm YYYY-MM-DD');
          const cierre = moment(`${funcionamiento_hora_cierre} ${currentDateTime.format('YYYY-MM-DD')}`, 'HH:mm YYYY-MM-DD');

          // Formatear el horario
          const horarioApertura = apertura.format('HH:mm');
          const horarioCierre = cierre.format('HH:mm');

          // Verificar si la farmacia está abierta en el momento actual
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
      console.log('Error al obtener las farmacias:', error.message);
      client.sendMessage(msg.from, 'Ocurrió un error al obtener las farmacias.');
    }
  } else {
    client.sendMessage(msg.from, 'Debes especificar una ciudad. Por ejemplo: `!far Santiago`');
  }
}
  
  /// Funciones ///

  else if (lowerCaseBody === '!tabla') {
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

// Función para enviar el menú de comandos
function sendMenu(chatId) {
  const menuMessage = `
  📜 *Comandos disponibles* 📜

  🌤️ **Clima**
  🌤️ !clima 🌤️
  
  💰 **Finanzas:**
  💵 !Valores 💵
  💱 !cripto  💱 (debes agregar la moneda, ejemplo !cripto bnb)
  
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
  
  🎰 **Juego:**
  !ccp ✊🖐️✌️(Cachipún) (Advertencia con los premios +18 👀👀)
  
  🔍 **Búsquedas:**
  !G 🔎
  !Wiki 🔎
  !yt 🔎  - (Realiza una búsqueda en Youtube)
  
  🤖 **Bot repite texto:**
  !re 🤖
  
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
  🚗🏍️!restriccion: Restriccion vehicular en santiago 

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
  🎵 !aweonao
  🎵 !caballo
  🎵 !callate
  🎵 !callense
  🎵 !cell
  🎵 !chamba
  🎵 !chaoctm
  🎵 !chipi
  🎵 !chistoso
  🎵 !doler
  🎵 !dolor
  🎵 !falso  
  🎵 !frio
  🎵 !grillo
  🎵 !himno
  🎵 !himnoe
  🎵 !idea
  🎵 !idea2
  🎵 !manualdeuso
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
  🎵 !pedro
  🎵 !penca
  🎵 !precio
  🎵 !protegeme
  🎵 !promo
  🎵 !queeseso
  🎵 !quepaso
  🎵 !rata
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
  const targetDate = moment.tz('2024-12-25T00:00:00', 'America/Santiago');
  return getCountdownMessage(targetDate, '🎅🎄🦌🎁✨');
}

function countdown18() {
  const targetDate = moment.tz('2024-09-18T00:00:00', 'America/Santiago');
  return getCountdownMessage(targetDate, '🍻🍺');
}

function countdownAnoNuevo() {
  const targetDate = moment.tz('2025-01-01T00:00:00', 'America/Santiago');
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

//repetir
client.on('message', async (msg) => {
  const command = msg.body.toLowerCase();
  try {
    if (command.startsWith('!re ')) {
      const text = msg.body.slice(4).trim();
      await msg.reply(text);
    }
  } catch (error) {
    console.error('Error al procesar el mensaje:', error);
  }
});


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


//cachipun

    client.on('message', (msg) => {
      const command = msg.body.toLowerCase();
      if (command.startsWith('!ccp')) {
        const jugador = msg.body.split(' ')[1].toLowerCase();
        if (['piedra', 'papel', 'tijera'].includes(jugador)) {
          const computadora = obtenerJugadaComputadora();
          const resultado = determinarGanador(jugador, computadora);
          const jugadorEmoji = obtenerEmoji(jugador);
          const computadoraEmoji = obtenerEmoji(computadora);
          let response = `Tu jugada: ${jugadorEmoji}\nJugada de la computadora: ${computadoraEmoji}\n${resultado}`;
    
          if (resultado === 'Ganaste') {
            const premio = obtenerPremio();
            response += `\n¡Tu premio: ${premio}!`;
          }
    
          msg.reply(response);
        } else {
          msg.reply('Opción inválida. Por favor, elige piedra, papel o tijera.');
        }
      }
    });
    
    // Función para generar la jugada aleatoria de la computadora
    function obtenerJugadaComputadora() {
      const jugadas = ['piedra', 'papel', 'tijera'];
      const indice = Math.floor(Math.random() * 3);
      return jugadas[indice];
    }
    
    // Función para determinar el resultado del juego
    function determinarGanador(jugador, computadora) {
      if (jugador === computadora) {
        return 'Empate';
      } else if (
        (jugador === 'piedra' && computadora === 'tijera') ||
        (jugador === 'papel' && computadora === 'piedra') ||
        (jugador === 'tijera' && computadora === 'papel')
      ) {
        return 'Ganaste';
      } else {
        return 'Perdiste. Inténtalo de nuevo.';
      }
    }
    
    // Función para obtener el emoticón correspondiente a la jugada
    function obtenerEmoji(jugada) {
      switch (jugada) {
        case 'piedra':
          return '✊';
        case 'papel':
          return '🖐️';
        case 'tijera':
          return '✌️';
        default:
          return '';
      }
    }
    
    // Función para obtener un premio aleatorio del archivo premios.json
    function obtenerPremio() {
      const premiosJSON = fs.readFileSync('premios.json');
      const premios = JSON.parse(premiosJSON).premios;
      const indice = Math.floor(Math.random() * premios.length);
      return premios[indice];
    }


      /// Frases Bot ///

      const usedPhrases = [];

      function obtenerFraseAleatoria() {
        let randomText = Math.floor(Math.random() * 25);
        while (usedPhrases.includes(randomText)) {
          randomText = Math.floor(Math.random() * 25);
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
        3: '¿Que onda compadre? ¿como estai? ¿te vine a molestar yo a ti? dejame piola, tranquilo ¿Que wea queri? ',
        4: 'Jajaja, ya te cache, puro picarte a choro no mas, anda a webiar al paloma pulgón qliao ',
        5: 'Lo siento, pero mis circuitos de humor están sobrecargados en este momento. ¡Beep boop! 😄',
        6: 'te dire lo que el profesor rossa dijo una vez, Por que no te vay a webiar a otro lado',
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
        17: 'jajajaja, ya llego el payaso al grupo, avisa para la otra 😄',
        18: '♫♫♫♫ Yo tomo licor, yo tomo cerveza 🍻 Y me gustan las chicas Y la cumbia me divierte y me excita.. ♫♫♫♫♫',
        19: 'A cantar: ♫♫♫ Yoooo tomo vino y cerveza 🍺 (Pisco y ron) para olvidarme de ella (Maraca culia), Tomo y me pongo loco (hasta los cocos), Loco de la cabeza (Esta cabeza) ♫♫♫',
        20: '♫♫♫ Me fui pal baile y me emborraché,miré una chica y me enamoré,era tan bella, era tan bella,la quería comer ♫♫♫',
        21: 'Compa, ¿qué le parece esa morra?, La que anda bailando sola, me gusta pa mí, Bella, ella sabe que está buena , Que todos andan mirándola cómo baila ♫♫♫♫♫♫',
        22: 'jajajaja, ya empezaste con tus amariconadas 🏳️‍🌈',
        23: '♫♫♫ Tú sabes como soy Me gusta ser así, Me gusta la mujer y le cervecita 🍻 No te sientas mal, no te vas a enojar Amigo nada más de la cervecita ♫♫♫♫♫',
        24: '♫♫♫ Y dice.... No me quiero ir a dormir, quiero seguir bailando, quiero seguir tomando, 🍷 vino hasta morir, No me quiero ir a dormir, quiero seguir tomando 🍷 , Quiero seguir bailando, cumbia hasta morir♫♫♫',
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


   /// Todos ///

    client.on('message', async (msg) => {
      const commandPrefix = '!todos';
    
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
    
/// Audios ///

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
    await msg.react('🐁'); // Reacción con emoji de risa.
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
  } else if (command === '!precio') {
      await sendAudio('precio.mp3', msg);
      await msg.react('😂');
  } else if (command === '!manualdeuso') {
      await sendAudio('manualdeuso.mp3', msg);
      await msg.react('😂');      
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


/// Sticker ///

client.on('message', async (message) => {
  const isStickerCommand = message.body.toLowerCase() === '!s';

  if (isStickerCommand && message.hasMedia && (message.type === 'video' || message.type === 'gif' || message.type === 'image')) {
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
  } else if (isStickerCommand) {
    await message.reply('Por favor, envíe un video, gif o imagen con el comando !s');
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
                  url: 'https://celuzador.online/celuzadorApi.php',
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
        'https://celuzador.online/fappello.php',
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



/// Criptomonedas ///


// Función para buscar el ID de una criptomoneda a partir de su nombre
async function getCoinId(coinName) {
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/coins/list`);
        const coins = response.data;
        const coin = coins.find(c => c.name.toLowerCase() === coinName.toLowerCase());
        return coin ? coin.id : null;
    } catch (error) {
        console.error('Error al obtener la lista de criptomonedas:', error);
        return null;
    }
}

client.on('message', async (message) => {
    if (message.body === '!cripto') {
        client.sendMessage(message.from, 'Ingresa el nombre de la criptomoneda pajaron qliao.');
        return;
    }

    if (message.body.startsWith('!cripto')) {
        const coinName = message.body.slice(8).trim();
        const coinId = await getCoinId(coinName);
        if (!coinId) {
            client.sendMessage(message.from, 'La criptomoneda especificada no se encontró aweonao.');
            return;
        }

        try {
            const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=clp`);
            const data = response.data;
            const price = parseFloat(data[coinId].clp).toLocaleString('es-CL');
            client.sendMessage(message.from, `El precio de ${coinName} es: $${price} CLP`);
        } catch (error) {
            client.sendMessage(message.from, 'Ocurrió un error al obtener la información de la criptomoneda, Jodiste.');
            console.error('Error al obtener información de la criptomoneda, nada que hacer papeto:', error);
        }
    }
});

/// Restriccion ///

client.on('message', async (msg) => {
  if (msg.body.startsWith('!restriccion')) {
      const response = `
Jueves:  0️⃣ y 1️⃣
Viernes:  2️⃣ y 3️⃣
Lunes:  4️⃣ y 5️⃣
Martes:  6️⃣ y 7️⃣
Miércoles:  8️⃣ y 9️⃣
🚗🚙🛵
      `;
      await msg.reply(response);
  }
});

/// Horoscopo ///

client.on('message', async (msg) => {
  const command = msg.body.toLowerCase().trim();
  
  if (command.startsWith('!horoscopo')) {
      const signo = command.split(' ')[1];
      if (!signo) {
          msg.reply('Por favor, proporciona un signo válido.');
          return;
      }

      const signoLimpio = limpiarSigno(signo);

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
  exec(`python ${script} ${signo}`, { encoding: 'latin1' }, (error, stdout, stderr) => {
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
          const imagePath = findImage(signo);
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
      await client.sendMessage(chatId, media, { caption: 'Imagen del signo zodiacal.' });
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

/// Busqueda Youtube ///

client.on('message', async message => {
  if (message.body.startsWith('!yt ')) {
      const query = message.body.slice(4); // Obtener el texto de búsqueda después de "!yt "
      buscarVideos(query, message);
  }
});

function buscarVideos(query, message) {
  const python = spawn('python', ['yt.py', query]);

  let respuesta = "Resultados de búsqueda:\n";

  python.stdout.on('data', function(data) {
      respuesta += data.toString();
  });

  python.stderr.on('data', function(data) {
      console.error(data.toString());
      // Enviar mensaje de error al usuario
      message.reply('Ocurrió un error al buscar videos.');
  });

  python.on('close', function(code) {
      if (respuesta === "Resultados de búsqueda:\n") {
          // Si no hay resultados
          message.reply('No se encontraron resultados para la búsqueda.');
      } else {
          // Enviar la respuesta al usuario
          message.reply(respuesta);
      }
  });
}

/// Patente y Tag ///

// Lista de espera para los comandos
let commandQueue = {};

// Variable para controlar el tiempo de espera
let lastCommandTime = {};

// Función para ejecutar los scripts Python y enviar la información al usuario
function obtenerInformacion(chatId, command, csvFile, message) {
    const currentTime = new Date().getTime();

    // Verificar si han pasado 30 segundos desde el último comando
    if (lastCommandTime[message.author.id] && currentTime - lastCommandTime[message.author.id] < 30000) {
        message.channel.send("⏰ Espera al menos 30 segundos antes de usar este comando de nuevo!");
        return;
    }

    // Verificar si el comando está en la lista de espera
    if (commandQueue[message.author.id]) {
        message.channel.send("⏳ Tu comando está en espera. Por favor, espera tu turno.");
        return;
    }

    // Agregar el usuario a la lista de espera
    commandQueue[chatId] = true;

    // Enviar mensaje de espera
    message.channel.send("⏳⏳ Espera un poco, estoy buscando la información...");

    exec(command, (error, stdout, stderr) => {
        // Eliminar al usuario de la lista de espera después de 30 segundos
        setTimeout(() => {
            delete commandQueue[chatId];
        }, 30000);

        if (error) {
            console.error(`Error al ejecutar el script: ${error}`);
            message.reply('Ocurrió un error al obtener la información.');
            return;
        }

        // Esperar un momento para que se genere el archivo .csv
        setTimeout(() => {
            // Leer el archivo .csv generado por el script
            fs.readFile(csvFile, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error al leer el archivo CSV: ${err}`);
                    message.reply('Ocurrió un error al obtener la información.');
                    return;
                }
                // Enviar la información del archivo .csv al remitente
                message.reply('```' + data + '```');
            });
        }, 5000); // Esperar 5 segundos antes de leer el archivo .csv
    });

    // Actualizar el tiempo del último comando
    lastCommandTime[chatId] = currentTime;
}

// Escucha los mensajes recibidos
client.on('message', async (msg) => {
    if (msg.body.startsWith('!nn')) {
        console.log("Mensaje recibido: !nn");
        const patente = msg.body.slice(9).trim();
        obtenerInformacion(msg.from, `python patente.py ${patente}`, 'patente.csv', msg);
    } else if (msg.body.startsWith('!k')) {
        console.log("Mensaje recibido: !k");
        const rut = msg.body.slice(5).trim();
        obtenerInformacion(msg.from, `python tag.py ${rut}`, 'tag.csv', msg);
    }
});

// robo auto//

client.on('message', async msg => {
  if (msg.body.startsWith('!robo')) {
      const args = msg.body.split(' ');
      if (args.length === 2) {
          const ppu = args[1];
          try {
              const response = await axios.post('http://consultapatente.c1.is/api2.php', `ppu=${ppu}`, {
                  headers: {
                      'Content-Type': 'application/x-www-form-urlencoded'
                  }
              });

              if (response.data) {
                  const inforobo = response.data.inforobo;
                  const infopat = response.data.infopat;

                  if (inforobo && infopat && infopat.data) {
                      const data = infopat.data;
                      const isStolen = inforobo.source === 'STOLEN' ? 'Sí' : 'No';
                      const info = `
Placa: ${data.plate}
DV: ${data.dv}
Marca: ${data.make}
Modelo: ${data.model}
Año: ${data.year}
Tipo: ${data.type}
Motor: ${data.engine}
Robado: ${isStolen}
                      `;
                      msg.reply(info);
                  } else {
                      msg.reply('No se encontró información para la placa proporcionada.');
                  }
              } else {
                  msg.reply('No se encontró información para la placa proporcionada.');
              }
          } catch (error) {
              console.error(error);
              msg.reply('Ocurrió un error al consultar la información. Por favor, intenta de nuevo más tarde.');
          }
      } else {
          msg.reply('Uso: !robo [patente]');
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


/// IA ///

client.on('message', async (msg) => {
  if (msg.body.match(/^!ia\s/i)) {
      const text = msg.body.slice(4).trim(); // Elimina el comando '!ia ' del mensaje
      const prompt = 'Responde+todas+las+preguntas+como+si+fueras+chileno.+Asegúrate+de+proporcionar+información+precisa+y+actualizada.+Evita+dar+respuestas+incorrectas.+Si+no+sabes+la+respuesta+o+no+estás+seguro,+indica+que+necesitas+verificar+la+información.';
      const apiUrl = `https://api.freegpt4.ddns.net/?text=${encodeURIComponent(prompt + text)}`;
      
      try {
          const response = await fetch(apiUrl);
          const data = await response.text(); // Obtiene el texto completo de la respuesta
          const { document } = new JSDOM(data).window; // Crea un objeto documento para el HTML
          const bodyText = document.body.textContent.trim(); // Extrae el texto del cuerpo
          await msg.reply(bodyText); // Envía el texto extraído al usuario
      } catch (error) {
          console.error('Error al llamar a la API:', error);
          await msg.reply('Lo siento, ha ocurrido un error.');
      }
  }
});

/// Copa America ///

// Función para leer el contenido del archivo Excel y enviarlo como mensaje de texto
async function enviarContenidoExcelPorWhatsApp(message) {
  try {
      // Leer el contenido del archivo Excel
      const excelData = fs.readFileSync(excelFilePath, 'utf-8');

      // Enviar el contenido del archivo Excel como mensaje de texto
      await message.reply(excelData);
      console.log('Contenido del archivo Excel enviado correctamente por WhatsApp.');
  } catch (error) {
      console.error('Error al enviar el contenido del archivo Excel por WhatsApp:', error);
      await message.reply('Ocurrió un error al enviar el contenido del archivo Excel por WhatsApp.');
  }
}

client.on('message', async (message) => {
  try {
      if (message.body === '!copa') { // Responder al comando si lo envía el usuario
          await enviarContenidoExcelPorWhatsApp(message);
      }
  } catch (error) {
      console.error('Error al ejecutar el comando !copa:', error);
      await message.reply('Ocurrió un error al ejecutar el comando !copa.');
  }
});

client.initialize();

// Función para añadir ceros a la izquierda hasta alcanzar la longitud especificada
function pad(number, length) {
  let str = '' + number;
  while (str.length < length) {
      str = '0' + str;
  }
  return str;
}