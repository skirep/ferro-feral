# Textures de l’escenari

Cada món té un PNG de 640 × 128 píxels. Les cinc rajoles de 128 × 128
van d’esquerra a dreta en aquest ordre:

| Columna | Ús |
|---|---|
| 1 | Paret, variant 1 |
| 2 | Paret, variant 2 |
| 3 | Paret, variant 3 |
| 4 | Terra |
| 5 | Sostre |

Edita o substitueix el PNG amb qualsevol editor d’imatges i mantén les
dimensions i l’ordre de les rajoles. El cel, la llum i els colors de reserva
s’editen a `world-materials.js`, on també pots canviar el nom del PNG.
El navegador aplica la il·luminació a les rajoles mentre es juga.

Els fitxers `*-walls.webp` contenen les parets detallades. Cadascun té tres
variants de 256 × 256 píxels i fa 768 × 256 en total. La farga de l’Arena fa
servir `foundry-walls.webp`. Els PNG segueixen aportant el terra, el sostre i
les parets de reserva durant la càrrega.

`ship-deck.webp` és l’atles de la campanya espacial. Té sis rajoles de
256 × 256 en una graella de 3 × 2. La primera fila conté la paret, el terra
i el sostre. La segona conté el contenidor, la consola i el reactor.
`../skies/orbit.webp` és la panoràmica de l’espai que es veu pels finestrals.

Els nivells són a `../levels/`, els enemics i les armes a `../combat.js`
i els motius musicals a `../music.js`.
