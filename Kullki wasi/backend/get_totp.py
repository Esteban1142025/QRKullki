import pyotp
import time
import sys

def main():
    if len(sys.argv) < 2:
        print("Uso: python get_totp.py <SECRET_AQUI>")
        print("Por ejemplo, los de las pruebas:")
        print("Admin:   python get_totp.py [admin_totp_impreso_en_consola]")
        print("Común:   python get_totp.py [comun_totp_impreso_en_consola]")
        return
        
    secret = sys.argv[1]
    try:
        totp = pyotp.TOTP(secret)
        code = totp.now()
        print("==================================")
        print(f"SECRETO: {secret}")
        print(f"CÓDIGO TOTP (QR Dinámico): {code}")
        print("==================================")
        print("Este código es válido por 30 segundos.")
    except Exception as e:
        print(f"Error generando el código: {e}")

if __name__ == "__main__":
    main()
