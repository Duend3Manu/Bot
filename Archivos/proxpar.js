const { spawn } = require('child_process');

function llamarProxparPy(client, usuario) {
   const procesoproxparPy = spawn('python', ['\\AirFryers-bot\\Archivos\\proxpar.py']);
   let salidaProxparPy = '';

   procesoproxparPy.stdout.on('data', (data) => {
      salidaProxparPy += data.toString();
   });

   procesoproxparPy.stderr.on('data', (data) => {
      console.error(`Error de proxpar.py: ${data}`);
   });

   procesoproxparPy.on('close', (code) => {
      console.log(`proxpar.py finalizado con código ${code}`);
      if (code === 0) {
         // Enviar el resultado al usuario utilizando el cliente de WhatsApp
         client.sendMessage(usuario, salidaProxparPy);
      } else {
         // Enviar un mensaje de error al usuario
         client.sendMessage(usuario, 'Ocurrió un error al obtener la tabla.');
      }
   });
}

module.exports = { llamarProxparPy };
