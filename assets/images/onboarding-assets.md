The onboarding screens share a background drawn by React Native. Headlines,
descriptions and pagination are rendered by the app, outside the image assets.

Illustrations were extracted with the built-in imagegen tool from the original
splash assets, then resized to 640 x 640 transparent PNGs with Jimp. Original
assets remain available as references.

| Original | Active asset | Bytes |
| --- | --- | --- |
| splash-record.png | onboarding-record.png | 298289 |
| splash-notes.png | onboarding-notes.png | 200667 |
| splash-forms.png | onboarding-forms.png | 218457 |

The original images total 4915366 bytes. Active illustrations total 717413
bytes, a reduction of 85.4%. This measures asset size, not startup time.

Prompt shared by each extraction:

> Use case: background-extraction. Asset type: optimized mobile onboarding
> illustration. Extract ONLY the lower illustration into a tightly framed square
> image with a genuinely transparent alpha background. Keep the original subject
> design, colours, identities, details and composition. Remove surrounding pale
> blue background circles, page background, headline, body copy and pagination
> dots. Keep text that is part of the smartphone/card UI itself. No new text or
> elements. Transparent outside the subject, no baked background or extra
> decorative shadows.

Subjects for the three prompts:

- Record: smartphone recording UI, doctor and elderly patient portraits,
  speech-wave bubbles and dashed connecting line.
- Notes: smartphone transcript UI and floating Clinical Note card.
- Forms: smartphone forms checklist UI and floating Forms Completed card.
