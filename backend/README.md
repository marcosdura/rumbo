# Backend de Rumbo

API en FastAPI + SQLAlchemy sobre Postgres (Railway). El esquema de la base
se maneja con migraciones de Alembic.

## Variables de entorno

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a Postgres. La usan la app y Alembic. |
| `GOOGLE_CLIENT_ID` | Validar los tokens de Google. Sin esto la app no arranca. |
| `ADMIN_EMAIL` | La cuenta que tiene acceso al panel admin. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Borrar fotos en Cloudinary. |
| `FRONTEND_URL` | Origen extra permitido por CORS (opcional). |

Localmente se pueden poner en un `.env` dentro de `backend/` (está en el
`.gitignore`).

## Levantar el server

```bash
pip install -r requirements.txt
python -m alembic upgrade head
uvicorn main:app --reload
```

En Railway, el comando de arranque es:

```
alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT
```

Cada deploy aplica solo las migraciones pendientes antes de levantar el
server. Si una migración falla, el server de ese deploy no arranca: el
error queda en los logs del deploy en Railway. Cada migración corre en una
transacción, así que la base no queda a medio migrar.

## Migraciones (Alembic)

La app **no** crea tablas sola: no hay `create_all`. `create_all` solo crea
tablas que no existen; nunca agrega columnas ni índices a una tabla que ya
existe, y por eso antes cada cambio de esquema era un SQL a mano.

### Cambiar el esquema

1. Editar `models.py`.
2. Generar la migración, desde `backend/` y con `DATABASE_URL` apuntando a
   una base que esté al día (`alembic current` tiene que decir `(head)`):

   ```bash
   python -m alembic revision --autogenerate -m "que cambia"
   ```

3. **Revisar el archivo generado en `alembic/versions/` antes de commitear.**
   Autogenerate compara los modelos con la base y a veces se equivoca:
   - Un renombre de columna o tabla lo toma como borrar + crear (se pierden
     los datos). Hay que reemplazarlo a mano por `op.alter_column(...,
     new_column_name=...)` o `op.rename_table(...)`.
   - Agregar una columna `nullable=False` a una tabla con filas falla si no
     tiene `server_default`.
   - Escribir a mano el `downgrade()` si autogenerate no lo pudo deducir.
4. Probarla: `python -m alembic upgrade head`, y `python -m alembic
   downgrade -1` para ver que vuelve atrás.
5. Commitear junto con el cambio de `models.py`. El próximo deploy la
   aplica.

Para ver el SQL que va a correr sin conectarse a ninguna base:

```bash
python -m alembic upgrade head --sql
```

### Comandos útiles

| Comando | Qué hace |
|---|---|
| `python -m alembic current` | En qué versión está la base. |
| `python -m alembic history` | Lista de migraciones. |
| `python -m alembic check` | Dice si los modelos y la base difieren (no escribe nada). |
| `python -m alembic upgrade head` | Aplica las migraciones pendientes. |
| `python -m alembic downgrade -1` | Deshace la última. |

### Las primeras migraciones

- `0001_esquema_inicial`: el esquema de producción tal como estaba al
  adoptar Alembic (octubre 2026). Producción **no** la corrió: se marcó con
  `alembic stamp 0001` porque ya tenía todo. En una base vacía, `upgrade
  head` la crea desde cero.
- `0002_pedidos_de_cambio`: tabla `spot_change_requests` y dos índices de
  slug que los modelos declaraban pero nunca se habían creado.

Los modelos se ajustaron a la base real al adoptar Alembic: las FK tienen
`ON DELETE CASCADE` en Postgres, así que `models.py` lo declara. Si se
borrara de un modelo, autogenerate propondría sacarlo también de la base.

`migrations/001_reviews_unicas.sql` es el último cambio que se hizo a mano,
antes de Alembic. Ya está aplicado en producción y queda como registro.
