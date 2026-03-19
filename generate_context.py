import os

def generate_context():
    output_file = 'csvteam_full_codebase.md'
    
    # Cartelle e file da includere
    include_dirs = ['src', 'supabase_migrations']
    include_files = ['index.html', 'package.json', 'vite.config.js', 'capacitor.config.json']
    
    # Estensioni permesse
    allowed_extensions = ['.js', '.jsx', '.css', '.html', '.json', '.sql']
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.write("# CSV Team App - Full Codebase Context\n\n")
        outfile.write("Questo documento contiene il codice sorgente completo dell'app CSV Team frontend (React/Vite) e backend (Supabase SQL).\n\n")
        
        # Scrivi i file singoli nella root
        for file in include_files:
            if os.path.exists(file):
                outfile.write(f"## File: `{file}`\n")
                outfile.write(f"```{file.split('.')[-1]}\n")
                with open(file, 'r', encoding='utf-8') as infile:
                    outfile.write(infile.read())
                outfile.write("\n```\n\n")
                
        # Scrivi il contenuto delle directory
        for dir_name in include_dirs:
            if os.path.exists(dir_name):
                for root, dirs, files in os.walk(dir_name):
                    for file in files:
                        ext = os.path.splitext(file)[1]
                        if ext in allowed_extensions:
                            file_path = os.path.join(root, file)
                            outfile.write(f"## File: `{file_path}`\n")
                            # Usa 'js' o 'jsx' come tag markdown, o 'sql'
                            lang = ext[1:] if ext != '.jsx' else 'jsx'
                            outfile.write(f"```{lang}\n")
                            try:
                                with open(file_path, 'r', encoding='utf-8') as infile:
                                    outfile.write(infile.read())
                            except Exception as e:
                                outfile.write(f"// Errore lettura file: {e}")
                            outfile.write("\n```\n\n")
                            
    print(f"File generato con successo: {output_file}")

if __name__ == "__main__":
    generate_context()
