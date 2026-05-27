use std::collections::HashMap;

/// A cached glyph with its bitmap and metrics.
#[derive(Debug, Clone)]
pub struct CachedGlyph {
    pub bitmap: Vec<u8>,
    pub width: u32,
    pub height: u32,
    pub advance_x: f32,
    pub offset_y: f32,
}

/// Glyph cache that rasterizes and caches character bitmaps.
pub struct GlyphCache {
    cache: HashMap<char, CachedGlyph>,
    font_size: f32,
}

impl GlyphCache {
    pub fn new(font_size: f32) -> Self {
        Self {
            cache: HashMap::new(),
            font_size,
        }
    }

    /// Get or rasterize a glyph. Uses a simple built-in bitmap for ASCII fallback.
    pub fn get_or_rasterize(&mut self, ch: char) -> &CachedGlyph {
        if !self.cache.contains_key(&ch) {
            let glyph = self.rasterize(ch);
            self.cache.insert(ch, glyph);
        }
        &self.cache[&ch]
    }

    fn rasterize(&self, ch: char) -> CachedGlyph {
        // Simple fallback: monospace character cell
        // In production, this would use fontdue or ab_glyph
        let w = (self.font_size * 0.6) as u32;
        let h = self.font_size as u32;
        let bitmap_size = (w * h) as usize;

        // Create a simple bitmap representation
        let mut bitmap = vec![0u8; bitmap_size];

        // For printable ASCII, create a simple pattern
        if ch.is_ascii_graphic() || ch == ' ' {
            // Fill with a basic pattern for now
            for y in 0..h {
                for x in 0..w {
                    let idx = (y * w + x) as usize;
                    if idx < bitmap.len() {
                        bitmap[idx] = 255; // White pixel
                    }
                }
            }
        }

        CachedGlyph {
            bitmap,
            width: w,
            height: h,
            advance_x: w as f32,
            offset_y: 0.0,
        }
    }

    pub fn font_size(&self) -> f32 {
        self.font_size
    }

    pub fn set_font_size(&mut self, size: f32) {
        if (self.font_size - size).abs() > f32::EPSILON {
            self.font_size = size;
            self.cache.clear();
        }
    }
}
