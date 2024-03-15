const { spawn } = require('child_process');

function llamarValoresPy(client, usuario) {
   const procesoValoresPy = spawn('python', ['C:\\bots\\AirFryers-bot\\Archivos\\valores.py']);
   let salidaValoresPy = '';

   procesoValoresPy.stdout.on('data', (data) => {
      salidaValoresPy += data.toString();
   });

   procesoValoresPy.stderr.on('data', (data) => {
      console.error(`Error de valores.py: ${data}`);
   });

   procesoValoresPy.on('close', (code) => {
      console.log(`valores.py finalizado con código ${code}`);
      if (code === 0) {
         // Enviar la salida al usuario utilizando el cliente del chatbot
         client.sendMessage(usuario, salidaValoresPy);
      } else {
         // Enviar un mensaje de error al usuario
         client.sendMessage(usuario, 'Ocurrió un error al ejecutar el script.');
      }
   });
}

module.exports = { llamarValoresPy };
