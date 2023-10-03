const { spawn } = require('child_process');

function llamarClasiPy(client, usuario) {
   const procesoclasiPy = spawn('python', ['\\AirFryers-bot\\Archivos\\clasi.py']);
   let salidaClasiPy = '';

   procesoclasiPy.stdout.on('data', (data) => {
      salidaClasiPy += data.toString();
   });

   procesoclasiPy.stderr.on('data', (data) => {
      console.error(`Error de clasi.py: ${data}`);
   });

   procesoclasiPy.on('close', (code) => {
      console.log(`clasi.py finalizado con código ${code}`);
      if (code === 0) {
         // Enviar el resultado al usuario utilizando el cliente de WhatsApp
         client.sendMessage(usuario, salidaClasiPy);
      } else {
         // Enviar un mensaje de error al usuario
         client.sendMessage(usuario, 'Ocurrió un error al obtener la tabla.');
      }
   });
}

module.exports = { llamarClasiPy };
