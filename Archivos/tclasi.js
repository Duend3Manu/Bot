const { spawn } = require('child_process');

function llamarTclasiPy(client, usuario) {
   const procesoTclasiPy = spawn('python', ['C:\\bots\\AirFryers-bot\\Archivos\\tclasi.py']);
   let salidaTclasiPy = '';

   procesoTclasiPy.stdout.on('data', (data) => {
      salidaTclasiPy += data.toString();
   });

   procesoTclasiPy.stderr.on('data', (data) => {
      console.error(`Error de tclasi.py: ${data}`);
   });

   procesoTclasiPy.on('close', (code) => {
      console.log(`tclasi.py finalizado con código ${code}`);
      if (code === 0) {
         // Enviar el resultado al usuario utilizando el cliente de WhatsApp
         client.sendMessage(usuario, salidaTclasiPy);
      } else {
         // Enviar un mensaje de error al usuario
         client.sendMessage(usuario, 'Ocurrió un error al obtener la tabla.');
      }
   });
}

module.exports = { llamarTclasiPy };
