require('dotenv').config(); // Carga las variables de entorno desde un archivo .env para usarlas en la aplicación.
const express = require('express'); // Importa el módulo express para crear el servidor web.
const cors = require('cors'); // Importa el middleware CORS para permitir solicitudes de diferentes orígenes.
const app = express(); // Crea una instancia de la aplicación express.
const { MongoClient } = require('mongodb'); // Desestructura MongoClient desde el módulo mongodb para interactuar con la base de datos.
const dns = require('dns'); // Importa el módulo dns para realizar resoluciones de nombres de dominio.
const urlparser = require('url'); // Importa el módulo url, aunque no se usa en el código, parece ser innecesario.
const { url } = require('inspector'); // Importa el objeto `url` de `inspector`, pero no se usa y parece innecesario.
const { error } = require('console'); // Importa el objeto `error` de `console`, pero no se usa y parece innecesario.

const client = new MongoClient(process.env.MONGO_URI); // Crea un cliente de MongoDB utilizando la URI de la base de datos almacenada en las variables de entorno.
const db = client.db("urlshortner"); // Obtiene la base de datos "urlshortner" para interactuar con ella.
const urls = db.collection("urls"); // Obtiene la colección "urls" en la base de datos para interactuar con los documentos.

const port = process.env.PORT || 3000; // Configura el puerto en el que el servidor escuchará, usando la variable de entorno `PORT` o el puerto 3000 por defecto.

app.use(cors()); // Usa el middleware CORS para permitir solicitudes de otros dominios.
app.use(express.json()); // Configura el middleware para procesar los datos JSON en las solicitudes entrantes.
app.use(express.urlencoded({ extended: true })); // Configura el middleware para procesar los datos de formularios URL codificados en solicitudes entrantes.

app.use('/public', express.static(`${process.cwd()}/public`)); // Define la ruta '/public' para servir archivos estáticos desde el directorio 'public'.

app.get('/', function(req, res) { // Define la ruta raíz para manejar solicitudes GET a la página principal.
  res.sendFile(process.cwd() + '/views/index.html'); // Responde enviando el archivo index.html ubicado en la carpeta 'views'.
});

// Primer endpoint de la API que maneja la creación de URLs cortas.
app.post('/api/shorturl', async function(req, res) {
  console.log(req.body); // Imprime en consola los datos del cuerpo de la solicitud.
  const url = req.body.url; // Extrae la URL enviada en el cuerpo de la solicitud.

  try {
    const urlObj = new URL(url); // Usa el constructor URL para validar la URL proporcionada.
    dns.lookup(urlObj.hostname, async (err, address) => { // Realiza una búsqueda DNS para verificar que el dominio de la URL existe.
      if (!address) { // Si no se puede resolver el dominio, responde con un error de URL inválida.
        res.json({ error: "Invalid URL" });
      } else { // Si la URL es válida, cuenta los documentos existentes en la colección de URLs para generar un nuevo short_url.
        const urlCount = await urls.countDocuments({});
        const urlDoc = {
          url, // La URL original.
          short_url: urlCount // Asigna el número de documentos existentes como el short_url.
        };
        const result = await urls.insertOne(urlDoc); // Inserta el nuevo documento en la base de datos.
        console.log(result); // Imprime el resultado de la inserción en consola.
        res.json({ original_url: url, short_url: urlCount }); // Devuelve la URL original y el short_url generado.
      }
    });
  } catch (error) { // Si la URL no es válida (por ejemplo, no tiene el formato correcto), responde con un error.
    res.json({ error: "Invalid URL" });
  }
});

// Segunda definición del mismo endpoint, lo cual es redundante y puede causar un error.
app.post('/api/shorturl', async function (req, res) {
  console.log(req.body); // Imprime en consola los datos del cuerpo de la solicitud.
  const url = req.body.url; // Extrae la URL enviada en el cuerpo de la solicitud.

  try {
    const urlObj = new URL(url); // Usa el constructor URL para validar la URL proporcionada.
    dns.lookup(urlObj.hostname, async (err, address) => { // Realiza una búsqueda DNS para verificar que el dominio de la URL existe.
      if (!address) { // Si no se puede resolver el dominio, responde con un error de URL inválida.
        res.json({ error: "Invalid URL" });
      } else { // Si la URL es válida, cuenta los documentos existentes en la colección de URLs para generar un nuevo short_url.
        const urlCount = await urls.countDocuments({});
        
        const urlDoc = {
          url, // La URL original.
          short_url: urlCount + 1 // Asigna un nuevo short_url incrementando el contador de documentos.
        };
        
        const result = await urls.insertOne(urlDoc); // Inserta el nuevo documento en la base de datos.
        console.log(result); // Imprime el resultado de la inserción en consola.
        
        res.json({ original_url: url, short_url: urlCount + 1 }); // Devuelve la URL original y el short_url generado.
      }
    });
  } catch (error) { // Si la URL no es válida (por ejemplo, no tiene el formato correcto), responde con un error.
    res.json({ error: "Invalid URL" });
  }
});

// Endpoint para manejar la redirección de una URL corta.
app.get("/api/shorturl/:short_url", async (req, res) => {
  const short_url = parseInt(req.params.short_url); // Extrae el short_url de los parámetros de la solicitud y lo convierte a entero.

  const urlDoc = await urls.findOne({ short_url: short_url }); // Busca el documento que corresponde al short_url.
  if (!urlDoc) { // Si no se encuentra el short_url, responde con un error.
    return res.json({ error: "No short URL found for the given input" });
  }

  res.redirect(urlDoc.url); // Si se encuentra, redirige al usuario a la URL original asociada con el short_url.
});

// Inicia el servidor en el puerto configurado.
app.listen(port, function() {
  console.log(`Listening on port ${port}`); // Imprime en consola el puerto en el que el servidor está escuchando.
});
