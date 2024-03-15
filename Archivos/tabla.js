const { spawn } = require('child_process');

function llamarTablaPy(client, usuario) {
   const procesoTablaPy = spawn('python', ['C:\\bots\\AirFryers-bot\\Archivos\\tabla.py']);
   let salidaTablaPy = '';

   procesoTablaPy.stdout.on('data', (data) => {
      salidaTablaPy += data.toString();
   });

   procesoTablaPy.stderr.on('data', (data) => {
      console.error(`Error de tabla.py: ${data}`);
   });

   procesoTablaPy.on('close', (code) => {
      console.log(`tabla.py finalizado con código ${code}`);
      if (code === 0) {
         // Enviar el resultado al usuario utilizando el cliente de WhatsApp
         client.sendMessage(usuario, salidaTablaPy);
      } else {
         // Enviar un mensaje de error al usuario
         client.sendMessage(usuario, 'Ocurrió un error al obtener la tabla.');
      }
   });
}

module.exports = { llamarTablaPy };
