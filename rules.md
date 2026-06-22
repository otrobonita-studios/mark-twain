# Mark Twain Reappears - Project Rules

This document outlines the guidelines and constraints for the "Mark Twain Reappears" web application and agent development.

---

## 1. Visual & Design Guidelines
* **Color System (Stella Base)**:
  - Background: Warm charcoal/dark ink (`#15110d`)
  - Card/Panel Surface: Dark wood brown (`#1d1611`)
  - Typography Foreground: Warm cream paper (`rgba(255, 244, 223, 0.95)`)
  - Accent Highlight: Gold (`#d9a34a`)
* **Styling Style**: Bespoke, premium dark mode styling. Do **NOT** use glassmorphism. Rely on sharp lines, distinct borders, and subtle textures.
* **Typewriter Typography**: Heading elements and logs should use serif/typewriter fonts (e.g., Courier Prime, Courier, or Playfair Display).
* **No Spin Buttons (Steppers)**:
  Never show browser-default stepper arrows on number inputs. Apply the following styling globally:
  ```css
  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  /* Firefox */
  input[type=number] {
    -moz-appearance: textfield;
  }
  ```

---

## 2. File & Git Hygiene
* **Environment Integrity**: Ensure `.gitignore` always includes `.env.local`, `.env`, and all other `*env*` files to protect credentials.
* **Next.js & React Conventions**: Use App Router layout pattern. Keep components clean, use modular CSS, and write standard ES6 JavaScript.

---

## 3. Narrative Voice
* **Twain's Voice**: Content written as Mark Twain must carry his signature persona: witty, satirical, skeptical of fast-talking technologists and inflated valuations, using analogies rooted in his Mississippi riverboat or printer-apprentice days.

---

## 4. Package Manager & System Constraints
* **No Unprompted Package Installation**: Do **NOT** run `npm install`, `yarn`, `pnpm install`, or other package manager installation commands without obtaining explicit user confirmation first. The package manager downloads are too heavy for this local development machine.
