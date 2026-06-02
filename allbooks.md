# Mark Twain Reappears - Book Modernization Rules

This document outlines the rules used to clean, structure, and style the converted HTML books in the Mark Twain Reappears collection.

---

## 1. Dialogue & Conversation Lines
To distinguish dialogue from body paragraphs, any paragraph (`<p>`) that contains dialogue is styled with `.conversation-line`.
- **Matching Rule**: A paragraph is tagged as dialogue if the first character (ignoring whitespace and HTML tags) is an opening quotation mark (`“`, `&ldquo;`, `&#8220;`, or `"`) and the last character is a closing quotation mark (`”`, `&rdquo;`, `&#8221;`, or `"`, optionally followed by trailing punctuation inside/outside).
- **Target Markup**: `<p class="conversation-line">“...”</p>`

---

## 2. Gutenberg Boilerplate Clean-up
All administrative, legal, and transcriber notices inserted by Project Gutenberg are removed.
- **Header Preamble**: Remove any preformatted (`<pre>`) text blocks or `<div>` blocks near the start of the body containing:
  - `*** START OF THE PROJECT GUTENBERG EBOOK... ***`
  - `*** START OF THIS PROJECT GUTENBERG EBOOK... ***`
  - Project Gutenberg license overview and ebook metadata.
- **Footer Postamble**: Remove any preformatted (`<pre>`) text blocks or `<div>` blocks at the end containing:
  - `*** END OF THE PROJECT GUTENBERG EBOOK... ***`
  - `*** END OF THIS PROJECT GUTENBERG EBOOK... ***`
  - `End of Project Gutenberg's...`
  - Full Project Gutenberg license text.

---

## 3. Title Page & Header
Each book starts with a standardized title card matching the aesthetic style of *Eve's Diary*.
- **Location**: Prepend directly at the top of the body content.
- **Format**:
  ```html
  <div class="book-title-block">
    <h1>[BOOK TITLE]</h1>
    <h2>BY MARK TWAIN</h2>
    <h2>(Samuel Langhorne Clemens)</h2>
  </div>
  <hr />
  ```
- **Old Title Clean-up**: Remove any redundant `<h1>`/`<h2>` tags and Gutenberg metadata from the original document body.

---

## 4. Collapsible Table of Contents
Table of Contents sections within the text are limited in height to keep them clean, using a fade overlay and a toggle button.
- **Identification**: Locate the `<h2>CONTENTS</h2>` or `<h2>Contents</h2>` heading and the adjacent list/table of links.
- **Format**:
  ```html
  <div class="book-toc-collapsed-wrapper">
    <div class="book-toc-content-inside">
      <!-- original chapter links table or list -->
    </div>
    <div class="book-toc-fade-overlay"></div>
    <button class="book-toc-expand-btn">Expand Table of Contents</button>
  </div>
  ```
- **Styling**: Center all links in the wrapper. Limit max-height to 180px (showing about 3 chapters). Overlay a bottom linear gradient that fades to the background color.

---

## 5. Illustration Gallery Grid
If a book contains a list of illustrations, all inline illustrations are pulled to the bottom of the document to clean up text layout.
- **Trigger**: Checked if the book body contains a "LIST OF ILLUSTRATIONS" or "ILLUSTRATIONS" table/section near the top.
- **Action**:
  - Remove all `<div class="fig">` blocks from the body text.
  - Delete the original text-based List of Illustrations table/section.
  - Append a responsive 3-column grid gallery at the very bottom of the document:
    ```html
    <hr />
    <h2 id="illustrations-gallery-header">ILLUSTRATIONS</h2>
    <div class="illustrations-gallery-grid">
      <!-- Gathers all figures here -->
    </div>
    ```
