"use strict";

// Importaciones de utilidades y herramientas
const fs = require('fs');
const path = require('path');

// Importaciones relacionadas con WhatsApp y qrcode
const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Importaciones de bibliotecas de terceros
const axios = require('axios');
const moment = require('moment-timezone');
const cheerio = require('cheerio');
const GoogleIt = require('google-it');
const Jimp = require('jimp');

// Importaciones de módulos personalizados
const tabla = require('./Archivos/tabla.js');
const proxpar = require('./Archivos/proxpar.js');
const metro = require('./Archivos/metro.js');
const clasi = require('./Archivos/clasi.js');
const tclasi = require('./Archivos/tclasi.js');

// Otras importaciones
const opts = {};

// Establecer idioma en español
moment.locale('es');

// Crear instancia del cliente de WhatsApp
const client = new Client();

client.setMaxListeners(15); // Aumenta el límite a 15 (ajusta según sea necesario)

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
  } else if (lowerCaseBody === '!18') {
    const countdownStr = countdown();
    client.sendMessage(msg.from, `Cuenta regresiva para el 18 de septiembre de 2024: ${countdownStr}`);
  } else if (lowerCaseBody === '!hola') {
    const responses = JSON.parse(fs.readFileSync('saludos.json', 'utf8'));
    const randomResponse = getRandomResponse(responses);
    client.sendMessage(msg.from, `👋🏻 ${randomResponse}`);
  } else if (lowerCaseBody === '!valores') {
    try {
      const response = await axios.get(apiUrlMindicador);
      const { uf, dolar, euro, utm } = response.data;

      const replyMessage = `💰 Valores actuales:
      
      ╔════AirFryers Bot═════╗
      ║  - Dólar: $${dolar.valor}║
      ║                          ║
      ║  - Euro: $${euro.valor}  ║
      ║                          ║
      ║  - UF: $${uf.valor}      ║
      ║                          ║
      ║  - UTM: $${utm.valor}    ║
      ╚════AirFryers Bot═════╝`;

      client.sendMessage(msg.from, replyMessage);
    } catch (error) {
      console.log('Error al obtener los valores:', error.message);
      client.sendMessage(msg.from, 'Ocurrió un error al obtener los valores.');
    }
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
  } else if (lowerCaseBody.startsWith('!far')) {
    const city = lowerCaseBody.substring(5)?.trim();
    if (city) {
      try {
        const response = await axios.get(apiUrlFarmacias);
        const farmacias = response.data;
  
        let filteredFarmacias = farmacias.filter((farmacia) =>
          farmacia.comuna_nombre.toLowerCase().includes(city)
        );
  
        if (filteredFarmacias.length > 0) {
          let replyMessage = `🏥 Farmacias de turno en ${city}:\n\n`;
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
  
            // Formatear el horario
            const horarioApertura = funcionamiento_hora_apertura.substring(0, 5);
            const horarioCierre = funcionamiento_hora_cierre.substring(0, 5);
  
            const mapLink = `https://www.google.com/maps?q=${local_lat},${local_lng}`;
            replyMessage += `Farmacia: ${local_nombre}\nDirección: ${local_direccion}\nHora de apertura: ${horarioApertura}\nHora de cierre: ${horarioCierre}\nTeléfono: ${local_telefono}\n${mapLink}\n\n`;
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
  }
});
// Función para enviar el menú de comandos
function sendMenu(chatId) {
  const menuMessage = `
  📜 *Comandos disponibles* 📜
  
  💰 Finanzas:
  💵 !Valores 💵
  
  🥳 Feriados:
  🎉 !Feriados 🎉
  🎆 !18 🎆

  🏥 Farmacias de Turno:
  🏥 !Far [ciudad] 🏥
  
  ⚽ Fútbol Chileno:
  ⚽ !Tabla ⚽
  ⚽ !prox ⚽

  ⚽ Selección Chilena:
  ⚽ !clasi ⚽
  ⚽ !tclasi ⚽
  
  🚇 Metro de Santiago:
  🚇 !Metro 🚇
  
  🎰 Juego:
  !ccp ✊🖐️✌️(Cachipún) (Advertencia con los premios +18 👀👀)
  
  🔍 Busqueda en Google
  !G 🔍

  🔎 Busqueda Wikipedia
  !Wiki 🔎

  🤖 Bot repite texto
  !re 🤖

  🎵 Audios🎵

  !mataron
  !muerte
  !muerte2
  !muerte3
  !neme
  !risa
  !penca
  !mpenca
  !aweonao
  !yamete
  !doler
  !dolor
  !tigre
  !rata

  👮🏽👮🏽‍♀️🚨🚔🚓

  !caso : Agregas un caso aislado
  !ecaso : Eliminas un caso aislado (el ultimo)
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

//18
function countdown() {
  const targetDate = moment.tz('2024-09-18', 'America/Santiago');
  const currentDate = moment().tz('America/Santiago');

  const remainingTime = targetDate.diff(currentDate);
  const duration = moment.duration(remainingTime);

  const days = Math.ceil(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();

  const countdownStr = `Quedan ${days} días, ${hours} horas y ${minutes} minutos 🍻🍺`;

  return countdownStr;
}

const remainingTime = countdown();
console.log('Mensaje final: ' + remainingTime);


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



// Mencionar contacto
const usedPhrases = []; // Arreglo para almacenar las frases utilizadas

client.on('message', async (msg) => {
  const chat = await msg.getChat();
  const contact = await msg.getContact();
  const command = msg.body.toLowerCase();
  let texto = '';

  // Use a regular expression with word boundaries to match multiple variants of "bot"
  if (/\b(bot|boot|bott|bbot|bboot|bboott)\b/.test(command)) {
    await msg.react('🤡');

    // Elige una frase aleatoria que no haya sido utilizada antes
    let randomText = Math.floor(Math.random() * 7);
    while (usedPhrases.includes(randomText)) {
      randomText = Math.floor(Math.random() * 7);
    }

    // Almacena la frase utilizada en el arreglo
    usedPhrases.push(randomText);

    // Si todas las frases han sido utilizadas, reinicia el arreglo
    if (usedPhrases.length === 5) {
      usedPhrases.length = 0;
    }

    switch (randomText) {
      case 0:
        texto = 'Dejame piola';
        break;
      case 1:
        texto = '¿Qué weá querí?';
        break;
      case 2:
        texto = 'Callao';
        break;
      case 3:
        texto = '¿Que onda compadre? ¿como estai? ¿te vine a molestar yo a ti? dejame piola, tranquilo ¿Que wea queri? ';
        break;   
      case 4:
        texto = 'Jajaja, ya te cache, puro picarte a choro no mas, anda a webiar al paloma pulgón qliao ';
        break;

      case 5:
      texto = 'Lo siento, pero mis circuitos de humor están sobrecargados en este momento. ¡Beep boop! 😄';
        break;
      case 6:
      texto = '¿Programación? Eso es fácil. Solo necesitas café, paciencia y un poco de magia de código. ✨💻☕';
        break;
      case 7:
      texto = '¡Error 404: Sentido del humor no encontrado! 😅';
        break;
      case 8:
      texto = 'No soy un bot, soy una IA con estilo. 😎';
       break;
      case 9:
     texto = '¡Atención, soy un bot de respuesta automática! Pero no puedo hacer café... aún. ☕';
       break;
     case 10:
     texto = 'Eso es lo que un bot diría. 🤖';
     break;
      case 11:
      texto = '¡Oh no, me has descubierto! Soy un bot maestro del disfraz. 😁';
      break;
}
    await chat.sendMessage(`${texto} @${contact.id.user}`, {
      mentions: [contact]
    });
  }
});


// funcion para llamar a todo el grupo 

client.on('message', async (msg) => {
  if (msg.body.toLowerCase() === '!todos') {
    const chat = await msg.getChat();
    
    let text = "";
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
  } else if (command === '!doler') { // Add the "!doler" command here
    await sendAudio('doler.mp3', msg); // Replace 'doler.mp3' with the actual filename
    await msg.react('😂'); // Reacción con emoji de risa.
  } else if (command === '!dolor') { // Add the "!dolor" command here
    await sendAudio('doler.mp3', msg); // Replace 'dolor.mp3' with the actual filename
    await msg.react('😂'); // Reacción con emoji de risa.
  } else if (command === '!tigre') {
    await sendAudio('Tigre.mp3', msg);
    await msg.react('😂'); // Reacción con emoji de risa.
  } else if (command === '!rata') {
    await sendAudio('Rata.mp3', msg);
    await msg.react('😂'); // Reacción con emoji de risa.
}

});

  async function sendAudio(audioFileName, msg) {
  const audioPath = path.join('C:', 'Users', 'manue', 'OneDrive', 'Escritorio', 'AirFryers-bot', 'mp3', audioFileName);

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

//Telegram

client.on('message', async (message) => {
  // Verifica si el mensaje comienza con el comando "!telegram" o "!Telegram"
  if (message.body.toLowerCase().startsWith('!telegram')) {
    const links = [
      "1- URSS Ciberseg, Air's fryers NSFW: https://t.me/+bPut6KUDraJiNGUx",
      "2- The Dark Side 🔞: https://t.me/+xozsv0b3LdBjOTYx"
    ];
    
    // Envía los enlaces como respuestas individuales
    for (const link of links) {
      await message.reply(link);
    }
  }
});

// Inicia sesión en WhatsApp
client.initialize();
