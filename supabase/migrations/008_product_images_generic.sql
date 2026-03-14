-- =============================================
-- Migración: Tabla de Imágenes Genérica para TODOS los productos
-- Reemplaza cake_images por product_images
-- =============================================

-- 1. Eliminar tabla específica de cake_images si existe
DROP TABLE IF EXISTS cake_images CASCADE;

-- 2. Crear tabla genérica de imágenes de productos
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tipo de producto y referencia
  product_type VARCHAR(20) NOT NULL, -- 'cake', 'cocktail', 'pastry'
  product_id UUID NOT NULL, -- ID del producto (cake_products, cocktail_products, pastry_products)

  -- Datos de la imagen
  url TEXT NOT NULL,
  alt_text VARCHAR(200),

  -- Configuración
  is_primary BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint para asegurar que solo hay una imagen primaria por producto
  CONSTRAINT unique_primary_per_product UNIQUE (product_type, product_id, is_primary)
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_type ON product_images(product_type);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_product_images_composite ON product_images(product_type, product_id);

-- Row Level Security
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Política pública de lectura
CREATE POLICY "Public can read product images"
  ON product_images FOR SELECT
  USING (true);

-- Comentarios
COMMENT ON TABLE product_images IS 'Imágenes para todos los tipos de productos (tortas, coctelería, pastelería)';
COMMENT ON COLUMN product_images.product_type IS 'Tipo de producto: cake, cocktail, pastry';
COMMENT ON COLUMN product_images.product_id IS 'ID del producto en su tabla correspondiente';
COMMENT ON COLUMN product_images.is_primary IS 'Indica si es la imagen principal del producto';
