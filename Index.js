"use strict";

// Importaciones de utilidades y herramientas
const fs = require('fs');
const path = require('path');
const pathToFfmpeg = 'C:\\FFmpeg\\bin\\ffmpeg.exe';
const sanitize = require('sanitize-filename'); // Biblioteca para limpiar nombres de archivo
const streamBuffers = require('stream-buffers');
const { htmlToText } = require('html-to-text');
const puppeteer = require('puppeteer');
const { Builder, By, Key, until } = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge');
const yargs = require('yargs');
const { spawn } = require('child_process');
const FormData = require('form-data');


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


// Importaciones de módulos personalizados
const clasi = require('./Archivos/clasi.js');
const metro = require('./Archivos/metro.js');
const proxpar = require('./Archivos/proxpar.js');
const tabla = require('./Archivos/tabla.js');
const tclasi = require('./Archivos/tclasi.js');
const valores = require('./Archivos/valores.js');

// Otras importaciones
const opts = {};

// Establecer idioma en español
moment.locale('es');

// Crear instancia del cliente de WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
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

    /// Feriados//
  } else if (lowerCaseBody === '!feriados') {
    try {
      const today = moment().format('YYYY-MM-DD');
      const response = await axios.get(apiUrlFeriados);
      const feriados = response.data;

      let replyMessage = '🥳 Próximos feriados:\n\n';
      feriados.forEach((feriado) => {
        if (moment(feriado.fecha).isAfter(today)) {
          const formattedDate = moment(feriado.fecha).format('dddd - DD/MM/YY');
          replyMessage += `- ${formattedDate}: ${feriado.nombre}\n`;
        }
      });

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
  
  //// Funciones ///

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
  
  🔍 **Búsqueda en Google:**
  !G 🔍

  🔎 **Búsqueda en Wikipedia:**
  !Wiki 🔎

  🤖 **Bot repite texto:**
  !re 🤖

  🤖 **Sticker Quietos o Con Movimiento:**
  !s 🤖 (Debes enviar la imagen, video o gif con el comando !s)
  
  🎵 **Audios:**
  🎵 !aweonao 🎵
  🎵 !caballo 🎵
  🎵 !chamba 🎵
  🎵 !doler 🎵
  🎵 !dolor 🎵
  🎵 !himno 🎵
  🎵 !idea 🎵
  🎵 !mataron 🎵
  🎵 !mpenca 🎵
  🎵 !muerte 🎵
  🎵 !muerte2 🎵
  🎵 !muerte3 🎵
  🎵 !muerte4 🎵
  🎵 !neme 🎵
  🎵 !penca 🎵
  🎵 !promo 🎵
  🎵 !rata 🎵
  🎵 !rico 🎵
  🎵 !risa 🎵
  🎵 !romeo 🎵
  🎵 !shesaid🎵
  🎵 !tigre 🎵
  🎵 !viernes🎵
  🎵 !yamete 🎵
  🎵 !where 🎵
  

  👮🏽👮🏽‍♀️🚨🚔🚓
  **Casos Aislados:**
  !caso : Agregas un caso aislado
  !ecaso : Eliminas un caso aislado (el último)
  !icaso : Listado de Casos Aislados
  

  *¡Diviértete* 🤖🚀
  `;

  client.sendMessage(chatId, menuMessage);
}

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


      ///// Frases Bot ///
    const usedPhrases = [];

    function obtenerFraseAleatoria() {
      let randomText = Math.floor(Math.random() * 24);
      while (usedPhrases.includes(randomText)) {
        randomText = Math.floor(Math.random() * 24);
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
      15: 'Voy a sacar mi caja de risa. Dame un momento... cric cric circ ♫ja ja ja ja jaaaa♫',
      16: 'Meruane estaría orgulloso de ti. ¡Sigues haciendo reír! 😄',
      17: 'jajajaja, ya llego el payaso al grupo, avisa para la otra 😄',
      18: '♫♫♫♫ Yo tomo licor, yo tomo cerveza 🍻 Y me gustan las chicas Y la cumbia me divierte y me excita.. ♫♫♫♫♫',
      19: 'A cantar: ♫♫♫ Yoooo tomo vino y cerveza 🍺 (Pisco y ron) para olvidarme de ella (Maraca culia), Tomo y me pongo loco (hasta los cocos), Loco de la cabeza (Esta cabeza) ♫♫♫',
      20: '♫♫♫ Me fui pal baile y me emborraché,miré una chica y me enamoré,era tan bella, era tan bella,la quería comer ♫♫♫',
      21: 'Compa, ¿qué le parece esa morra?, La que anda bailando sola, me gusta pa mí, Bella, ella sabe que está buena , Que todos andan mirándola cómo baila ♫♫♫♫♫♫',
      22: 'jajajaja, ya empezaste con tus amariconadas 🏳️‍🌈',
      23: '♫♫♫ Tú sabes como soy Me gusta ser así, Me gusta la mujer y le cervecita 🍻 No te sientas mal, no te vas a enojar Amigo nada más de la cervecita ♫♫♫♫♫'
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
    


// funcion para llamar a todo el grupo 
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
      const contact = await client.getContactById(participant.id._serialized);

      mentions.push(contact);
      text += `@${participant.id.user} `;
    }

    await chat.sendMessage(text, { mentions });
  }
});

//Audios

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
  } else if (command === '!rico') {
    await sendAudio('rico.mp3', msg);
    await msg.react('😂');  

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

//Caso Aislados Pacos

// Declara una variable para almacenar el contador y los casos, inicializados en 0 y un array vacío respectivamente.
let contador = 0;
let casos = [];

// Cargar casos desde un archivo JSON si existe.
if (fs.existsSync('casos.json')) {
  casos = JSON.parse(fs.readFileSync('casos.json', 'utf8'));
  contador = casos.length;
}

// Evento para recibir mensajes
client.on('message', async (msg) => {
  const command = msg.body.toLowerCase();

  if (command.startsWith('!caso')) {
    // Obtener el mensaje sin el comando.
    const mensajeCaso = msg.body.replace('!caso', '').trim();

    // Incrementa el contador en 1.
    contador++;

    // Crear un objeto de caso con descripción y enlace.
    const nuevoCaso = {
      descripcion: `Caso Aislado Número ${contador}: ${mensajeCaso}`,
      enlace: mensajeCaso,
    };

    // Guarda el caso en el arreglo de casos.
    casos.push(nuevoCaso);

    // Guarda los casos en el archivo JSON.
    fs.writeFileSync('casos.json', JSON.stringify(casos), 'utf8');

    // Envía un mensaje de confirmación.
    await msg.reply(`Caso Aislado Número ${contador} registrado: ${mensajeCaso}`);
  } else if (command === '!ecaso') {
    // Verifica si hay casos para eliminar.
    if (contador > 0) {
      // Elimina el último caso del arreglo de casos.
      casos.pop();

      // Decrementa el contador en 1.
      contador--;

      // Guarda los casos actualizados en el archivo JSON.
      fs.writeFileSync('casos.json', JSON.stringify(casos), 'utf8');

      // Envía un mensaje de confirmación.
      await msg.reply(`Se eliminó un caso, ahora hay ${contador} casos.`);
    } else {
      await msg.reply('No se pueden eliminar más casos, el contador ya está en 0.');
    }
  } else if (command === '!icaso') {
    // Muestra la lista de casos como un índice con enlaces.
    if (casos.length > 0) {
      const listaCasos = casos.map((caso, index) => `${index + 1}. ${caso.descripcion}`);
      const respuesta = `Lista de Casos Aislados:\n${listaCasos.join('\n')}`;
      await msg.reply(respuesta);
    } else {
      await msg.reply('No hay casos registrados.');
    }
  }
});


///////////////////Sticker//////////////////////

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


//Chistes

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


//ping///
client.on('message', handlePingCommand);

async function handlePingCommand(message) {
  try {
    // Verifica si el mensaje comienza con '!ping'
    if (message.body.startsWith('!ping')) {
      // Mide el tiempo de inicio
      const startTime = Date.now();

      // Envía un mensaje de respuesta al mismo número para medir el lag
      await sendPingResponse(message);

      // Calcula el tiempo total y el lag
      const { pingTime, lag } = calculateTimes(startTime);

      // Envía un mensaje con los resultados y reacciona con un emoticon de rana o sapo
      await sendResultsAndReact(message, pingTime, lag);
    }
  } catch (error) {
    console.error('Error al manejar el comando !ping:', error.message);
  }
}

async function sendPingResponse(message) {
  // Envía un mensaje al mismo número para medir el lag
  await client.sendMessage(message.from, 'Pong!');
}

function calculateTimes(startTime) {
  // Calcula el tiempo total y el lag
  const endTime = Date.now();
  const pingTime = endTime - startTime;
  const lag = endTime - startTime - pingTime;

  return { pingTime, lag };
}

async function sendResultsAndReact(message, pingTime, lag) {
  // Envía un mensaje con los resultados
  await message.reply(`Mi ping es de: ${pingTime} ms, y mi Lag es de: ${lag} ms`);

  // Reacciona con un emoticon de rana o sapo
  await message.react('🐸');
}

/// Videos +18 ////

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

//Clima

async function obtenerClima(ciudad) {
  try {
    const response = await axios.get(`https://wttr.in/${ciudad}?format=%t+%C+%h+%w+%P`);
    return response.data.trim();
  } catch (error) {
    console.error('Error al obtener el clima:', error);
    throw error;
  }
}

// Manejar los mensajes entrantes
client.on('message', async (message) => {
  const commandRegex = /^!clima (.+)/;
  const match = message.body.match(commandRegex);

  if (match) {
    const ciudad = match[1];

    try {
      const clima = await obtenerClima(ciudad);
      const respuesta = `El clima en ${ciudad.charAt(0).toUpperCase() + ciudad.slice(1)} es: ${clima}`;
      await message.reply(respuesta);
    } catch (error) {
      console.error('Error al procesar el comando !clima:', error);
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


// Generador de rut//

client.on('message', async (msg) => {
  if (msg.body === '!rut') {
      generarRUTsMaximoSeis().then(ruts => {
          const reply = ruts.join('\n');
          msg.reply(reply);
      }).catch(error => {
          console.error('Error generando RUTs:', error);
          msg.reply('Ocurrió un error al generar los RUTs.');
      });
  }
});

// Esta función genera 6 RUTs aleatorios
async function generarRUTsMaximoSeis() {
  const ruts = [];
  const minValue = 1000000;
  const maxValue = 40000000;

  for (let i = 0; i < 6; i++) {
      const randomNumber = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
      const mod = getMod(randomNumber);
      ruts.push(`${formatNumber(randomNumber)}-${mod}`);
  }

  return ruts;
}

// Esta función formatea el número de RUT
function formatNumber(number) {
  return number.toLocaleString('cl-ES');
}

// Esta función calcula el dígito verificador de un RUT
function getMod(number) {
  let total = 0;
  let multiplier = 2;

  while (number > 0) {
      total += (number % 10) * multiplier;
      number = Math.floor(number / 10);
      multiplier = multiplier % 7 + 2;
  }

  const mod = 11 - (total % 11);
  return mod === 11 ? '0' : mod === 10 ? 'K' : mod.toString();
}


// Conecta el cliente a WhatsApp
client.initialize();
