const { spawn } = require('child_process');

function llamarMetroPy(client, usuario) {
   const procesometroPy = spawn('python', ['\\AirFryers-bot\\Archivos\\metro.py']);
   let salidaMetroPy = '';

   procesometroPy.stdout.on('data', (data) => {
      salidaMetroPy += data.toString();
   });

   procesometroPy.stderr.on('data', (data) => {
      console.error(`Error de metro.py: ${data}`);
   });

   procesometroPy.on('close', (code) => {
      console.log(`metro.py finalizado con código ${code}`);
      if (code === 0) {
         // Enviar el resultado al usuario utilizando el cliente de WhatsApp
         client.sendMessage(usuario, salidaMetroPy);
      } else {
         // Enviar un mensaje de error al usuario
         client.sendMessage(usuario, 'Ocurrió un error al obtener la tabla.');
      }
   });
}

module.exports = { llamarMetroPy };
