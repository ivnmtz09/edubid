import os

from rest_framework import serializers

MAX_UPLOAD_BYTES = 15 * 1024 * 1024  # 15 MB

# Extensiones que se ejecutan o se renderizan en el navegador/servidor (XSS almacenado, malware).
BLOCKED_EXTENSIONS = {
    '.html', '.htm', '.xhtml', '.svg', '.js', '.mjs', '.php', '.phtml', '.asp', '.aspx', '.jsp',
    '.exe', '.dll', '.msi', '.bat', '.cmd', '.com', '.scr', '.ps1', '.vbs', '.sh', '.jar', '.apk',
}


def validate_upload(file):
    """Valida tamano y extension de un archivo subido por un usuario."""
    if file is None:
        return file
    if file.size > MAX_UPLOAD_BYTES:
        raise serializers.ValidationError(
            f"El archivo supera el tamaño máximo permitido de {MAX_UPLOAD_BYTES // (1024 * 1024)} MB."
        )
    ext = os.path.splitext(file.name)[1].lower()
    if ext in BLOCKED_EXTENSIONS:
        raise serializers.ValidationError(f"No se permiten archivos {ext}.")
    return file
