# DeepSeek Harness Start9

Agent d'automatització **DeepSeek Harness** (v0.4.0.1) per a StartOS, executant-se amb models gratuïts de **Google AI Studio** (Gemini Flash).

## Característiques

- 🤖 Agent conversacional autònom via terminal
- ⚡ Model gratuït: `gemini-3.6-flash` (Google AI Studio)
- 📁 Operacions amb fitxers i execució de tasques
- 🔧 Modes d'execució: `auto` (interactiu) i `test` (verificació)

## Instal·lació

```bash
# 1. Clona el repositori
git clone https://github.com/bytedevil/DeepseekHarnessStart9.git
cd DeepseekHarnessStart9

# 2. Crea l'entorn virtual i instal·la dependències
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Configura la teva clau API (gratuïta)
cp .env.example .env
# Edita .env i posa-hi la teva clau de https://aistudio.google.com/
```

## Ús

```bash
source .venv/bin/activate

# Mode interactiu (xat amb l'agent)
python3 scripts/deepseek.py --mode auto

# Mode test (verifica la configuració)
python3 scripts/deepseek.py --mode test
```

### Comandes del mode interactiu
| Comanda | Acció |
|---------|-------|
| `exit` | Sortir de l'agent |
| `help` | Mostrar ajuda |
| `<text>` | Enviar prompt al model |

## Configuració

La configuració viu a `configs/config.yaml`:

```yaml
api:
  provider: "google"
  model: "gemini-3.6-flash"   # Model gratuït de Google AI Studio
  api_key: "GOOGLE_API_KEY"   # Nom de la variable d'entorn
```

La clau API es llegeix de (per ordre):
1. Variable d'entorn `GOOGLE_API_KEY`
2. Fitxer `.env` (copia `.env.example`)

## Estructura del projecte

```
DeepseekHarnessStart9/
├── configs/
│   └── config.yaml      # Configuració de l'agent
├── scripts/
│   └── deepseek.py      # Codi principal de l'agent
├── .env.example         # Plantilla per a la clau API
├── requirements.txt     # Dependències Python
└── README.md
```

## Seguretat

- ⚠️ Mai publiquis la teva clau API. El fitxer `.env` està exclòs del repositori via `.gitignore`.
- Obtén claus gratuïtes només a [Google AI Studio](https://aistudio.google.com/).

## Llicència

MIT