-- =============================================================================
-- 001 — Una reseña por usuario y por lugar, + columna updated_at
-- =============================================================================
--
-- Por qué: ninguno de los tres modelos de reseña tenía constraint de unicidad,
-- así que una sola persona podía dejar reseñas ilimitadas sobre el mismo lugar,
-- todas contando para el promedio y el total. Favorite ya tenía la constraint
-- equivalente, y las reseñas se la habían salteado.
--
-- Correr contra Postgres (Railway). El código ya asume este esquema:
-- models.py declara las constraints y la columna, y el backend devuelve 409
-- cuando alguien intenta reseñar dos veces.
--
-- IMPORTANTE: el paso 2 BORRA filas. Corré antes el paso 1 para ver qué se va.
--
-- Nota sobre los nombres: no pueden ser "uq_user_spot" porque ese ya lo usa
-- la tabla favorites — en Postgres una constraint UNIQUE crea un índice, y los
-- nombres de índice son únicos por esquema.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- PASO 1 — Ver qué duplicados hay (no modifica nada)
-- -----------------------------------------------------------------------------
-- Si las tres consultas devuelven 0 filas, saltá directo al paso 3.

SELECT 'reviews' AS tabla, user_id, spot_id AS padre_id, COUNT(*) AS cuantas
FROM reviews
GROUP BY user_id, spot_id
HAVING COUNT(*) > 1
ORDER BY cuantas DESC;

SELECT 'surf_reviews' AS tabla, user_id, surf_beach_id AS padre_id, COUNT(*) AS cuantas
FROM surf_reviews
GROUP BY user_id, surf_beach_id
HAVING COUNT(*) > 1
ORDER BY cuantas DESC;

SELECT 'kayak_reviews' AS tabla, user_id, kayak_details_id AS padre_id, COUNT(*) AS cuantas
FROM kayak_reviews
GROUP BY user_id, kayak_details_id
HAVING COUNT(*) > 1
ORDER BY cuantas DESC;


-- -----------------------------------------------------------------------------
-- PASO 2 — Deduplicar: conserva la reseña más reciente de cada usuario
-- -----------------------------------------------------------------------------
-- "Más reciente" = id más alto. Se usa el id y no created_at porque el id es
-- monótono y no empata; created_at puede tener dos filas con el mismo valor.
--
-- Saltear este paso si el paso 1 no devolvió nada.

BEGIN;

DELETE FROM reviews a
USING reviews b
WHERE a.user_id = b.user_id
  AND a.spot_id = b.spot_id
  AND a.id < b.id;

DELETE FROM surf_reviews a
USING surf_reviews b
WHERE a.user_id = b.user_id
  AND a.surf_beach_id = b.surf_beach_id
  AND a.id < b.id;

DELETE FROM kayak_reviews a
USING kayak_reviews b
WHERE a.user_id = b.user_id
  AND a.kayak_details_id = b.kayak_details_id
  AND a.id < b.id;

COMMIT;


-- -----------------------------------------------------------------------------
-- PASO 3 — Constraints y columna nueva
-- -----------------------------------------------------------------------------
-- Si el paso 2 no dejó la base limpia, los ALTER de acá fallan con
-- "could not create unique index" y nombran la fila que sobra.

BEGIN;

ALTER TABLE reviews
  ADD CONSTRAINT uq_review_user_spot UNIQUE (user_id, spot_id);

ALTER TABLE surf_reviews
  ADD CONSTRAINT uq_surfreview_user_beach UNIQUE (user_id, surf_beach_id);

ALTER TABLE kayak_reviews
  ADD CONSTRAINT uq_kayakreview_user_detail UNIQUE (user_id, kayak_details_id);

-- NULL = nunca se editó. La UI muestra "editado" solo cuando tiene valor, así
-- que las reseñas viejas quedan bien sin backfill.
ALTER TABLE reviews       ADD COLUMN updated_at TIMESTAMPTZ NULL;
ALTER TABLE surf_reviews  ADD COLUMN updated_at TIMESTAMPTZ NULL;
ALTER TABLE kayak_reviews ADD COLUMN updated_at TIMESTAMPTZ NULL;

COMMIT;


-- -----------------------------------------------------------------------------
-- PASO 4 — Comprobar
-- -----------------------------------------------------------------------------

SELECT conname, conrelid::regclass AS tabla
FROM pg_constraint
WHERE conname IN ('uq_review_user_spot',
                  'uq_surfreview_user_beach',
                  'uq_kayakreview_user_detail');
-- Esperado: 3 filas.

SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name = 'updated_at'
  AND table_name IN ('reviews', 'surf_reviews', 'kayak_reviews');
-- Esperado: 3 filas.


-- =============================================================================
-- Para revertir (si hiciera falta): las constraints y la columna se pueden
-- borrar, pero las filas duplicadas del paso 2 no vuelven.
--
--   ALTER TABLE reviews       DROP CONSTRAINT uq_review_user_spot;
--   ALTER TABLE surf_reviews  DROP CONSTRAINT uq_surfreview_user_beach;
--   ALTER TABLE kayak_reviews DROP CONSTRAINT uq_kayakreview_user_detail;
--   ALTER TABLE reviews       DROP COLUMN updated_at;
--   ALTER TABLE surf_reviews  DROP COLUMN updated_at;
--   ALTER TABLE kayak_reviews DROP COLUMN updated_at;
-- =============================================================================
