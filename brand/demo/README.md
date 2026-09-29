# Demo del asistente de WhatsApp

Grabaciones de la conversación que corre en
`/productos/asistente-ia-whatsapp`: un pedido a domicilio completo, de
principio a fin, sin que nadie del restaurante escriba una palabra.
Autorización de datos, registro, una pregunta que el asistente se niega a
responder, la ubicación compartida que lee solo, la carta dentro de
WhatsApp, el pedido, la elección entre pagar ahora o contra entrega, el
pago y el enlace de seguimiento.

Todo es un celular con WhatsApp abierto: sin titulares ni textos de
mercadeo alrededor, para que sirva tal cual donde se publique.

| archivo | para qué sirve |
| --- | --- |
| `…-reel-1080x1920.mp4` | Reels, Stories, TikTok. 9:16, H.264, pista de audio en silencio. |
| `…-feed-1080x1350.mp4` | publicación de feed en Instagram. 4:5. |
| `…-domicilio.gif` | presentaciones y WhatsApp. Se reproduce solo y en cualquier parte. |
| `…-domicilio.webm` | el original de la grabación, sin recortar a formato. |
| `ubicacion-compartida.png` | el momento en que llega el pin y el asistente lo lee. |
| `pago-en-whatsapp.png` | el botón de pago dentro del chat. |

Los mp4 llevan pista de audio en silencio a propósito: Instagram rechaza
algunos videos sin ella. Los píxeles son cuadrados (SAR 1:1) y el `moov`
va al principio, que es lo que pide la plataforma para reproducir sin
descargar todo primero.

El restaurante, la clienta y el enlace de seguimiento son inventados; el
producto y las integraciones que muestra son reales. El aviso de
"Demostración ilustrativa" va impreso dentro de la pantalla, así que viaja
con cada copia del archivo y no hay que acordarse de ponerlo en el pie.

## Volver a grabarlas

    pip install Pillow imageio-ffmpeg
    node scripts/record-chat-demo.mjs --url=<página> --out=<carpeta> --seconds=23

Graba desde el sitio publicado, así que hay que desplegar primero. El
teléfono se monta solo sobre un fondo limpio, centrado; se oculta todo lo
que esté fijo en pantalla — banner de cookies, burbuja de chat — y se
recorta el arranque para que el clip abra en el celular y no en la página
cargando.

`ffmpeg` viene del paquete `imageio-ffmpeg`, no del sistema. Sin él se
generan el GIF y el webm, y se avisa que faltan los mp4.
