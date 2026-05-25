import os
import re
from bs4 import BeautifulSoup

def clean_gutenberg(text):
    # Rensa bort boilerplate
    text = re.sub(r'\*\*\* START OF THIS PROJECT GUTENBERG EBOOK.*?\*\*\*', '', text, flags=re.DOTALL)
    text = re.sub(r'\*\*\* END OF THIS PROJECT GUTENBERG EBOOK.*', '', text, flags=re.DOTALL)
    return text

def clean_wikisource(text):
    # Wikisource har ofta metadata-boxar i toppen, de kan vi rensa
    # Vi fokuserar på att extrahera innehåll som inte är navigering
    soup = BeautifulSoup(text, 'html.parser')
    for tag in soup(["nav", "table", "div.noprint", "header"]):
        tag.decompose()
    return soup.get_text(separator=' ')

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Välj städmetod baserat på mapp
    if "project-gutenberg" in str(file_path):
        return clean_gutenberg(content)
    elif "wikisource" in str(file_path):
        return clean_wikisource(content)
    return content

# Exempel på användning:
# cleaned_text = process_file("TwainCorpus/project-gutenberg/1601.html")