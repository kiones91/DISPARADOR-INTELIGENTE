import subprocess
import sys
import os
import time

def run():
    print("=" * 70)
    print("          INICIANDO DISPARADOR INTELIGENTE DE PROSPECÇÃO          ")
    print("=" * 70)
    
    print("[SISTEMA] Iniciando painel do Streamlit...")
    
    # Run Streamlit on port 8501
    cmd = [sys.executable, "-m", "streamlit", "run", "app.py"]
    
    try:
        # Launch process and forward stdout/stderr to parent terminal
        proc = subprocess.Popen(cmd)
        
        print("\n" + "=" * 70)
        # Streamlit output will naturally guide the user to http://localhost:8501
        print("🚀 APLICATIVO INICIALIZADO!")
        print("  👉 Painel de Controle: http://localhost:8501")
        print("  👉 Pressione Ctrl+C para encerra o servidor.")
        print("=" * 70 + "\n")
        
        proc.wait()
    except KeyboardInterrupt:
        print("\n[SISTEMA] Capturado Ctrl+C. Finalizando painel...")
    except Exception as e:
        print(f"[ERRO] Falha ao iniciar aplicativo: {str(e)}")
        
    print("[SISTEMA] Servidor encerrado. Obrigado por usar!")

if __name__ == "__main__":
    run()
