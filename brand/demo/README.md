# Demo del asistente de WhatsApp

Grabaciones de la conversación que corre en
`/productos/asistente-ia-whatsapp`: un pedido a domicilio completo, de
principio a fin, sin que nadie del restaurante escriba una palabra.
Autorización de datos, registro, una pregunta que el asistente se niega a
responder, la ubicación compartida que lee solo, la carta dentro de
WhatsApp, el pedido, la elección entre pagar ahora o contra entrega, el
pago y el enlace de seguimiento.

Todo es un celular con WhatsApp abierto. Sin textos de mercadeo alrededor,
para que sirva tal cual en una presentación o en redes.

| archivo | para qué sirve |
| --- | --- |
| `novieri-demo-whatsapp-domicilio.gif` | presentaciones, WhatsApp, redes. Se reproduce solo y en cualquier parte. |
| `novieri-demo-whatsapp-domicilio.webm` | mejor calidad; no todas las apps lo aceptan. |
| `ubicacion-compartida.png` | el momento en que llega el pin y el asistente lo lee. |
| `pago-en-whatsapp.png` | el botón de pago dentro del chat. |

El restaurante, la clienta y el enlace de seguimiento son inventados; el
producto y las integraciones que muestra son reales. El aviso de
"Demostración ilustrativa" va impreso dentro de la pantalla, así que viaja
con cada copia del archivo y no hay que acordarse de ponerlo en el pie.

## Volver a grabarlas

    node scripts/record-chat-demo.mjs --url=<página> --out=<carpeta> --seconds=23

Graba desde el sitio publicado, así que hay que desplegar primero. Recorta
al teléfono y oculta lo que esté fijo en pantalla — banner de cookies,
burbuja de chat — para que no se cuele en el cuadro.
