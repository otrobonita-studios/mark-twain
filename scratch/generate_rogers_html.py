import os

script_dir = os.path.dirname(os.path.abspath(__file__))
txt_path = os.path.join(script_dir, "rogers_extracted.txt")
out_html_path = os.path.join(script_dir, "../src/data/books/Rogers.html")

with open(txt_path, "r", encoding="utf-8") as f:
    text = f.read()

# Let's clean up paragraphs
paragraphs = text.split("\n\n")

# The first paragraph is the title "ROGERS", skip it
if paragraphs[0].strip() == "ROGERS":
    paragraphs = paragraphs[1:]

html_paras = []
for p in paragraphs:
    p_text = p.strip().replace("\n", " ")
    if not p_text:
        continue
    
    # Check if it starts with a quote, indicating dialogue
    is_dialogue = p_text.startswith("“") or p_text.startswith('"')
    
    # Replace standard quotes with HTML entities for smart quotes
    # Let's do basic replacement: first quote is open, second is close, etc.
    # We can do this simply by scanning characters or doing regex replacement
    # For a simple replacement:
    formatted_p = p_text
    # Replace double quotes to smart quotes
    parts = formatted_p.split('“')
    parts = [part.split('”') for part in parts]
    # Reassemble or just replace "
    # Since the text uses explicit unicode “ and ”, let's map them to entities:
    formatted_p = formatted_p.replace("“", "&ldquo;").replace("”", "&rdquo;")
    formatted_p = formatted_p.replace('"', "&ldquo;") # Fallback if any plain quotes
    formatted_p = formatted_p.replace("--", "&mdash;")
    
    if is_dialogue:
        html_paras.append(f'    <p class="conversation-line">\n      {formatted_p}\n    </p>')
    else:
        html_paras.append(f'    <p>\n      {formatted_p}\n    </p>')

html_content = "\n".join(html_paras)

full_html = f"""<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rogers, by Mark Twain</title>
  <script type="application/ld+json">
{{
    "@context": "https://schema.org",
    "name": "Rogers, by Mark Twain",
    "author": {{
        "name": "Mark Twain",
        "@type": "Person"
    }},
    "@type": "Book",
    "inLanguage": "en"
}}
</script>
  <style>
    :root {{
      --bg: #15110d;
      --surface: #1d1611;
      --text: rgba(255, 244, 223, 0.95);
      --accent: #d9a34a;
      --spacing: 1.5rem;
    }}

    * {{
      box-sizing: border-box;
    }}

    body {{
      background: var(--bg);
      color: var(--text);
      font-family: Georgia, serif;
      margin: 0;
      padding: 2rem;
      line-height: 1.8;
    }}

    .book-text-content {{
      max-width: 900px;
      margin: 0 auto;
    }}

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {{
      font-family: 'Courier Prime', 'Playfair Display', serif;
      color: var(--accent);
      margin-top: 2.5em;
      margin-bottom: 1em;
      text-align: center;
    }}

    h1 {{
      font-size: 2.5em;
    }}

    h2 {{
      font-size: 2em;
    }}

    h3 {{
      font-size: 1.5em;
    }}

    p {{
      margin: 0.8em 0;
    }}

    hr {{
      border: none;
      border-top: 2px solid var(--accent);
      margin: 2em 0;
    }}

    img {{
      max-width: 100%;
      height: auto;
      display: block;
    }}

    .paragraph-with-image {{
      display: flex;
      gap: 2rem;
      margin: 2.5em 0;
      align-items: flex-start;
    }}

    .layout-right {{
      flex-direction: row-reverse;
    }}

    .layout-left {{
      flex-direction: row;
    }}

    .circle-img-wrapper {{
      flex-shrink: 0;
      width: 250px;
      height: 250px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid var(--accent);
      position: relative;
    }}

    .circle-img-wrapper img {{
      width: 100%;
      height: 100%;
      object-fit: cover;
    }}

    .image-paragraph-text {{
      flex: 1;
    }}

    @media (max-width: 768px) {{
      .paragraph-with-image {{
        flex-direction: column !important;
      }}

      .circle-img-wrapper {{
        width: 200px;
        height: 200px;
      }}
    }}
  </style>
</head>

<body>
  <div class="book-title-block">
    <h1>ROGERS</h1>
    <h2>BY MARK TWAIN</h2>
  </div>
  <hr />
  <div class="book-text-content">
{html_content}
  </div>
</body>

</html>
"""

with open(out_html_path, "w", encoding="utf-8") as f:
    f.write(full_html)
print(f"Successfully generated standalone {out_html_path}")
