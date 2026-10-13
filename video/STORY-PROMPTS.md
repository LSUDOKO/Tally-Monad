# Story images: ChatGPT prompts

The video already renders without these; each slot shows a branded placeholder until its file exists. Generate each image in ChatGPT, save it as a PNG with the **exact file name** below in `video/public/story/`, then re-render:

```bash
cd video && npx remotion render Tally out/tally-monad-demo.mp4 --codec=h264 --crf=18
```

**Size:** landscape, 1536 × 1024 (3:2). The video crops it into a rounded card on the right half of a 1920×1080 frame.

## Step 0: lock the look (paste this first, in the same chat)

> We're making a set of illustrations for an app called Tally. Use one consistent style for every image:
> - **Look:** a stylized 3D character render, like a modern animated feature film. Soft global illumination, gentle rim light, shallow depth of field and a cinematic 3:2 frame.
> - **Palette:** dominated by cobalt and royal blue (#1F6BFF, #0A3DB8) fading into deep navy (#03060F) shadows, with small warm accents (amber #FFB547, soft skin tones) and a little mint green (#3DBD8C) for "success".
> - **Rules:** no text, no logos, no UI words, no watermarks.
>
> Characters, kept identical across images:
> - **Riya:** 20-year-old Indian woman studying in Toronto. Shoulder-length dark wavy hair, small gold stud earrings, an oversized cobalt-blue hoodie over a white tee, a canvas tote bag, warm brown eyes, friendly.
> - **Asha (Riya's mother):** 48, from Pune, India. A soft teal cotton kurta with a thin dupatta, hair in a low bun, reading glasses on a chain, a kind face.
> - **Vikram (Riya's father):** 52. A neat grey mustache, a light-blue half-sleeve shirt, a wristwatch.
>
> Reply "ready" and wait for my scene prompts.

## Slots

### `01-family-video-call.png`: the hook (0:00)
> Split-screen feeling in one frame. On the left, Riya in a cozy Toronto student room at night, snow visible through the window, holding her phone up on a video call and smiling tiredly. On the right, through the phone's glow, Asha and Vikram in their warm Pune living room at morning, waving, with a brass lamp and marigold flowers. A soft cobalt light connects the two halves like a thread across the world map behind them. Emotional and hopeful. No text.

### `02-parents-bank-transfer.png`: money is slow and leaky (0:08)
> Asha and Vikram at a crowded bank counter in Pune holding a printed transfer form and a phone, looking frustrated. A long queue behind them. Floating translucent coins visibly "leaking" out of a glowing blue money stream that travels toward a distant Toronto skyline. A large wall clock shows the wait. Mood: slow, costly, opaque. Cobalt and navy palette with amber highlights on the leaking coins. No text, no logos.

### `03-student-ai-upsell.png`: the agent gets talked into the upsell (0:19)
> Riya at a modern Toronto campus café counter, distracted with a laptop and books. A small friendly holographic AI assistant (a floating glowing blue orb with a simple face) hovers by her phone. A sly-looking chalkboard menu sign leans toward the assistant, whispering to it, and a large expensive latte glows temptingly while the small cheaper latte sits ignored. Subtle, playful tension. Cobalt and navy palette, warm café lights. No readable text on any sign.

### `04-mom-sends-from-pune.png`: Mom tops it up in a second (1:37)
> Asha on her balcony in Pune at sunrise, smiling as she presses her thumb on her phone's fingerprint sensor. From the phone, a bright cobalt light streak arcs up and across a stylized globe toward a tiny glowing Toronto. A small mint-green check sparkle appears at the end of the arc. Peaceful, instant, joyful. Morning light, cobalt and navy sky, marigold pots on the balcony. No text.

### Optional extra slots (use them in the storyboard if you like)

- `05-campus-cafe-qr.png`: *Riya scanning a glowing QR code on a small tablet stand at a campus café counter. The barista smiles. Her phone screen glows cobalt. Clean, modern, friendly. No readable text.*
- `06-family-happy-end.png`: *Back on a video call: Riya holds up a latte and laughs, Asha and Vikram laugh on the other side. Warm and relieved. Cobalt rim light, navy background, mint-green sparkle. No text.*

## Tips for consistency

- Generate all images in the **same chat** after Step 0, so ChatGPT keeps the characters.
- If a face drifts, reply "keep Riya exactly as in image 1" and regenerate.
- Keep text out of the images. The video adds its own captions and titles in the Tally font.
