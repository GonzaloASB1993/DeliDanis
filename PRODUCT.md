# Product

## Register

brand

## Users

Personas en Chile (principalmente Santiago) organizando un evento con carga emocional: matrimonio, quinceañero, cumpleaños, bautizo o evento corporativo. Llegan **casi siempre desde el celular**, con tráfico "tibio": alguien compartió el link de DeliDanis en un grupo de WhatsApp. No vienen de una búsqueda fría en Google — ya tienen algo de intención, pero también dudas y prisa. Están comparando, mirando fotos, decidiendo si confiar en un negocio artesanal para un día importante. La decisión de compra suele cerrarse por WhatsApp.

## Product Purpose

Sitio público de DeliDanis, pastelería artesanal premium (tortas para eventos, coctelería y catering). Existe para **convertir esa visita mobile tibia en un pedido**: que la persona entienda en segundos qué se ofrece, confíe en la calidad, y dé el siguiente paso — cotizar/agendar en la web **o** escribir por WhatsApp con contexto. Hoy el sitio lleva meses sin generar ventas por la web; el éxito se mide en pedidos y contactos de WhatsApp originados desde el sitio, no en tráfico.

## Brand Personality

Cálido y cercano. Se nota una persona real detrás, no una cadena: artesanal, hecho con cariño, familiar. Voz en español chileno/neutro (nunca voseo argentino). Tono confiable pero sin frialdad corporativa: la calidez la cargan la fotografía de los productos, la tipografía y el detalle, no los emojis. Debe dar seguridad para confiarle un evento importante.

## Anti-references

- Sitio genérico "plantilla de repostería" con emojis (🎂 💍 👑 ✨) salpicados por todos lados: resta profesionalismo y confianza.
- Hero con texto blanco ilegible sobre foto clara sin contraste — el error crítico actual.
- Estética "AI slop": gradientes de texto, eyebrows en mayúsculas sobre cada sección, grillas de cards idénticas, cream/beige de relleno.
- E-commerce impersonal y frío tipo gran retail: rompe la cercanía artesanal.

## Design Principles

1. **Mobile es el escenario principal, no una adaptación.** Cada decisión se diseña primero para el pulgar en una pantalla de ~390px; el desktop se deriva después.
2. **Legible y claro en 2 segundos.** La propuesta de valor y la confianza se leen sin esfuerzo apenas carga; contraste real, jerarquía fuerte.
3. **El siguiente paso siempre a la mano.** Cotizar y WhatsApp visibles y sin fricción, con contexto del producto que la persona miraba.
4. **La calidez viene del oficio, no del emoji.** Foto de producto protagonista, tipografía y espacio; cero decoración barata.
5. **Preservar la identidad.** Se mantiene la paleta actual (terracota rosado, dorado, crema, carbón); se mejora composición, jerarquía y ritmo, no los colores.

## Accessibility & Inclusion

- Contraste WCAG AA: cuerpo ≥4.5:1, texto grande ≥3:1. El hero actual falla y es prioridad corregirlo (scrim/overlay sobre imágenes bajo texto).
- Targets táctiles mínimos ~44px; pensado para uso a una mano en mobile.
- `prefers-reduced-motion` ya respetado en el código; mantener alternativa en toda animación nueva.
- Respetar safe-area (notch / barra inferior) en elementos fijos como la barra de acción y el botón de WhatsApp.
