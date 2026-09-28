# Demo del asistente de WhatsApp

Grabaciones de la conversación que corre en
`/productos/asistente-ia-whatsapp` — un pedido a domicilio completo: el
cliente pide, comparte su ubicación con el clip de adjuntar, el asistente
la lee sin que nadie escriba una dirección, cobra con un mensaje
interactivo que abre el pago dentro de WhatsApp, y pasa el pedido a
cocina.

| archivo | para qué sirve |
| --- | --- |
| `novieri-demo-whatsapp-domicilio.gif` | presentaciones, WhatsApp, redes. Se reproduce solo y en cualquier parte. |
| `novieri-demo-whatsapp-domicilio.webm` | la sección completa con su título, en video. Mejor calidad; no todas las apps lo aceptan. |
| `ubicacion-compartida.png` | el momento en que llega el pin. |
| `pago-en-whatsapp.png` | el botón de pago dentro del chat. |

La conversación es ilustrativa y el restaurante es inventado; el producto
y las integraciones que muestra son reales. Ese mismo aviso va impreso en
la propia demostración, y debe quedarse donde se use.

## Volver a grabarlas

    node scripts/record-chat-demo.mjs --url=<página> --out=<carpeta>

Vuelve a grabar desde el sitio publicado, así que hay que desplegar
primero. Oculta lo que esté fijo en pantalla — banner de cookies, burbuja
de chat — para que no se cuele en el cuadro.
