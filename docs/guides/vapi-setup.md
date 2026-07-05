# Going live with the real phone call (Flow B)

The app runs fully offline with the scripted call, and also supports an in-browser
web call out of the box. To ring a **real phone** on stage, add a Vapi account, a
French voice assistant, an ngrok tunnel, and a teammate's number. This is a one-time
setup, best done the day before.

Everything below requires accounts that must be yours; the app is already wired for
all of it and switches to the real call automatically once the keys are present.

---

## 1. Vapi account + assistant (~15 min)

1. Sign up at **vapi.ai** and grab your **API key** (Dashboard → API Keys) → `VAPI_API_KEY`.
2. **Buy or import a phone number** (Dashboard → Phone Numbers). Copy its ID → `VAPI_PHONE_NUMBER_ID`.
3. **Create an assistant** with a French voice (ElevenLabs or Azure FR). Paste this
   as its **system prompt** (verbatim from the spec):

   > Tu es l'assistante vocale automatisée de TripAssist. Dès le bonjour, annonce
   > que tu es automatisée et que l'appel est enregistré. Sois brève, polie,
   > professionnelle. Obtiens trois choses : la confirmation demandée, le nom de
   > ton interlocuteur, une référence. Si c'est indisponible, demande calmement les
   > alternatives accessibles et préviens qu'un conseiller rappellera. Reformule
   > toujours ce qui a été dit avant de raccrocher.
   >
   > {{callContext}}

   The `{{callContext}}` line is required: the app fills it per call
   (`server/agents/caller.ts` for phone, `web/src/lib/vapiCall.ts` for the web
   call) with the provider, the specific ask, and the traveler's details, so one
   assistant handles both the airport and the hotel.

   Copy the assistant ID → `VAPI_ASSISTANT_ID`.

4. Set the **teammate's real phone number** (E.164, e.g. `+336XXXXXXXX`) → `RECEPTIONIST_PHONE`.

## 2. ngrok tunnel (so Vapi can reach the webhook)

```bash
brew install ngrok           # if not installed
ngrok config add-authtoken <token from ngrok.com dashboard>
ngrok http 3000              # keep this running during the demo
```

Copy the `https://xxxx.ngrok-free.app` URL → `PUBLIC_URL`. The server exposes the
webhook at `${PUBLIC_URL}/webhooks/vapi` and passes it to Vapi automatically on
each call.

> Also set this same URL as the assistant's **Server URL** in the Vapi dashboard,
> as a fallback in case the per-call override doesn't apply.

## 3. Fill `.env` and restart

Put the five `VAPI_*` values + `PUBLIC_URL` into `TripAssist/.env`, then:

```bash
pnpm build && pnpm start        # or pnpm dev
```

On boot, `hasVapi()` becomes true and `POST /api/call/start` places a real call
instead of the simulation.

## 4. Rehearse the receptionist (3 branches)

The teammate answering the phone rehearses all three, per the spec:

- **B1 happy:** confirms room 104, gives the name "Mme Laurent".
- **B2 stage branch (play this on stage):** "Ah… la 104 a été réattribuée, nous
  n'avons plus de chambre accessible ce soir-là." Polite, slightly embarrassed,
  offers nothing → triggers the failure + Hôtel Aston recovery.
- **B3 evasive:** "il faudrait voir avec ma collègue demain" → tests the red-flag path.

## 5. The invisible insurance

If the live call fails on stage (network, Vapi, ngrok drop), the `/demo` panel's
**"Lancer l'appel IA — scénario scène"** button plays the identical scripted call
over the same pipeline, and **Contrôles de secours** can force any step's status
by hand. Nothing on stage can hard-break.

---

**To verify the live call end-to-end you need three things:** the `VAPI_*` keys,
the teammate's number, and a running ngrok tunnel. With those in `.env` and the
steps above complete, `POST /api/call/start` places a real, streamed call.
