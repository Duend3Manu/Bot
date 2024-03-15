const { spawn } = require('child_process');

function llamarLibertadoresPy(client, usuario) {
   const procesoLibertadoresPy = spawn('python', ['C:\\bots\\AirFryers-bot\\Archivos\\libertadores.py']);
   let salidaLibertadoresPy = '';

   procesoLibertadoresPy.stdout.on('data', (data) => {
      salidaLibertadoresPy += data.toString();
   });

   procesoLibertadoresPy.stderr.on('data', (data) => {
      console.error(`Error de libertadores.py: ${data}`);
   });

   procesoLibertadoresPy.on('close', (code) => {
      console.log(`libertadores.py finalizado con código ${code}`);
      if (code === 0) {
         // Enviar el resultado al usuario utilizando el cliente de WhatsApp
         client.sendMessage(usuario, salidaLibertadoresPy);
      } else {
         // Enviar un mensaje de error al usuario
         client.sendMessage(usuario, 'Ocurrió un error al obtener los resultados de la Copa Libertadores.');
      }
   });
}

module.exports = { llamarLibertadoresPy };
