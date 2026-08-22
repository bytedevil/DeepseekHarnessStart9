# DeepSeek Harness — Manual d'ús (català)

Guia ràpida per al servei **DeepSeek Harness** a StartOS.
Autor: **Pau Font Martínez** — contacte: **contacte@pau.fm** — Donacions: [PayPal (paufont@gmail.com)](https://www.paypal.com/paypalme/pfont)

---

## 1. Instal·lació

1. Descarrega `deepseek-harness.s9pk` des de [Releases](https://github.com/bytedevil/DeepseekHarnessStart9/releases)
2. A StartOS: **System → Sideload Service** i selecciona el fitxer
3. Espera que el servei arrenqui (els dos health checks es posen verds en ~1 minut)

## 2. Configuració inicial

1. Obre el servei **DeepSeek Harness**
2. Tab **Actions → Configure**
3. Introdueix:
   - **DeepSeek API Key**: la teva clau `sk-...` de [platform.deepseek.com](https://platform.deepseek.com) (cal saldo; la API és de pagament)
   - **Model**: deixa `deepseek-chat` o tria un altre
4. Desa — el servei es reinicia sol amb la clau nova

## 3. Obrir la interfície web

Tens dues maneres equivalents:

- **Botó blanc** (fletxa obre-pestanya nova) a la capçalera del servei
- Tab **Actions → Open Web UI** → enllaç clicable

S'obre el xat de l'agent DeepSeek. Escriu-hi el que vulguis; l'agent pot executar ordres, llegir fitxers i crear projectes dins del seu espai de treball.

## 4. Crear i organitzar projectes

Tots els projectes viuen a **`/data/projects`** del volum del servei (persistents, inclosos als backups):

1. A la web UI, demana-li per exemple: *"Crea un projecte nou anomenat la-meva-app"*
2. L'agent crea la carpeta amb la seva eina de fitxers
3. També pots usar el selector **"Select Workspace Directory"** per navegar o crear carpetes amb **+ New folder**

## 5. Administrar el servidor StartOS (panell d'ajustos) 🔐

Nova acció que inicia sessió a StartOS amb la contrasenya mestra per administrar **tot el servidor** des d'aquí:

1. Tab **Actions → System Administration**
2. Omple:
   - **Server address**: com arribes al teu StartOS (p. ex. `node.local` o `192.168.1.10`)
   - **StartOS master password**: la contrasenya mestra del teu servidor
3. Clica **Run**

Què fa: executa `start-cli auth login` contra el teu servidor amb la contrasenya que has introduït. La contrasenya **només s'usa en aquesta comanda** — no es desa mai a disc, fitxers de configuració ni registres. La clau de sessió derivada es guarda a `/data/startos-cli` (volum del servei) i sobreviu a reinicis.

Un cop iniciada la sessió, l'agent pot executar ordres administratives de `start-cli` contra el teu servidor: instal·lar/actualitzar paquets, canviar ajustos del sistema, gestionar SSH, hosts, còpies de seguretat, etc. Exemples que pots demanar-li al xat:

- *"Llista els serveis instal·lats al servidor"*
- *"Actualitza el paquet X a l'última versió"*
- *"Mostra l'estat del sistema i l'ús de disc"*

> ⚠️ **Seguretat**: aquesta acció atorga control complet del servidor. Fes-la servir només tu, des de la teva xarxa de confiança. Per revocar la sessió: System → Preferences, o esborra la carpeta `/data/startos-cli` del volum del servei.

## 6. Resolució de problemes

| Símptoma | Solució |
|----------|---------|
| Health check groig/vermell >2 min | Tab **Logs** del servei; busca `[webui]` i `[web-proxy]` |
| `HTTP 402 Insufficient Balance` | Recarrega saldo a platform.deepseek.com — es recupera automàticament |
| La web UI no carrega | Refresca el navegador (Ctrl+F5); el port extern canvia a cada reinstal·lació |
| `Sign-in failed` a System Administration | Revisa adreça i contrasenya mestra; el servidor ha de ser accessible des del contenidor |
| L'agent no troba un fitxer | Treballa dins `/data/projects`; demana-li `pwd` per veure on és |

## 7. Crèdits i suport

- **Autor**: Pau Font Martínez
- **Contacte**: contacte@pau.fm
- **X**: [@pfont_](https://x.com/pfont_)
- **Donacions**: [PayPal](https://www.paypal.com/paypalme/pfont) (compte associat a paufont@gmail.com)
- **Codi**: [github.com/bytedevil/DeepseekHarnessStart9](https://github.com/bytedevil/DeepseekHarnessStart9)
