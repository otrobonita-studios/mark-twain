def process_file(file_path):
    # Kolla storlek först
    file_size = os.path.getsize(file_path) / (1024 * 1024)
    print(f" (Storlek: {file_size:.2f} MB)")
    
    # Läs filen och städa...
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            # Läs in och städa... 
            # Om filen är över 50MB, var beredd på att det tar några sekunder
            content = f.read()
            
            # ... din vanliga städlogik ...
            return content.strip()
    except Exception as e:
        print(f"Kunde inte processa {file_path}: {e}")
        return None