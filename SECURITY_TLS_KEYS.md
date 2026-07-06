# Claves TLS de desarrollo — acción de seguridad requerida (H4)

Los archivos `localhost-key.pem` y `localhost.pem` (certificado + **clave privada**)
estuvieron versionados en el historial de git. Ya se removieron del índice
(`git rm --cached`) y están cubiertos por `.gitignore`, pero **siguen presentes
en el historial de commits**.

## Acciones pendientes (manuales — reescriben historial)

1. **Rotar el par de claves.** La clave comprometida no debe reutilizarse:
   ```bash
   # Con mkcert (recomendado)
   mkcert localhost
   mv localhost.pem localhost.pem && mv localhost-key.pem localhost-key.pem
   # o con openssl
   openssl req -x509 -newkey rsa:2048 -nodes -keyout localhost-key.pem \
     -out localhost.pem -days 365 -subj "/CN=localhost"
   ```
   Regenerar tanto en `señal-front` como en `señal-back` (usan el mismo par).

2. **Purgar del historial** (coordinar con el equipo — reescribe todos los commits):
   ```bash
   # Opción A: git filter-repo
   git filter-repo --path localhost-key.pem --path localhost.pem --invert-paths
   # Opción B: BFG
   bfg --delete-files 'localhost*.pem'
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   git push --force-with-lease --all
   ```

3. Confirmar que la generación local quede documentada en el README y que los
   `.pem` **nunca** se vuelvan a commitear (ya están en `.gitignore`).

## Impacto real

Acotado a entorno de desarrollo local (`https://localhost`). Riesgo: MITM del
servidor de dev en la misma red, o reutilización accidental de esa clave en un
despliegue. No afecta certificados de producción (gestionados por el hosting).
