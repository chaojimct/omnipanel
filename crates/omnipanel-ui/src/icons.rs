use egui::{Color32, Pos2, Rect, Stroke, Vec2};

/// All icons from design/ — Feather-style, viewBox 0 0 24 24, stroke-width 1.8.
/// Each icon is defined as SVG path data strings.


pub struct Icon {
    pub paths: &'static [&'static str],
    pub circles: &'static [(f32, f32, f32)],       // cx, cy, r
    pub rects: &'static [(f32, f32, f32, f32, f32)], // x, y, w, h, rx
    pub polygons: &'static [&'static str],
}

// ─── Navigation icons ──────────────────────────────────────────────────

pub const HOME: Icon = Icon {
    paths: &[
        "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
        "M9 22V12h6v10",
    ],
    circles: &[],
    rects: &[],
    polygons: &[],
};

pub const TERMINAL: Icon = Icon {
    paths: &[
        "M4 17l6-6-6-6",
        "M12 19h8",
    ],
    circles: &[],
    rects: &[],
    polygons: &[],
};

pub const MONITOR: Icon = Icon {
    paths: &[
        "M8 21h8",
        "M12 17v4",
    ],
    circles: &[],
    rects: &[(2.0, 3.0, 20.0, 14.0, 2.0)],
    polygons: &[],
};

pub const DATABASE: Icon = Icon {
    paths: &[
        "M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3",
        "M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5",
    ],
    circles: &[],
    rects: &[],
    polygons: &[],
    // Special: ellipse at top
};

pub const DOCKER: Icon = Icon {
    paths: &[
        "M2 17h20c0 2.76-4.48 5-10 5S2 19.76 2 17z",
    ],
    circles: &[],
    rects: &[
        (2.0, 7.0, 6.0, 5.0, 1.0),
        (10.0, 7.0, 6.0, 5.0, 1.0),
        (18.0, 7.0, 4.0, 5.0, 1.0),
        (6.0, 2.0, 6.0, 5.0, 1.0),
    ],
    polygons: &[],
};

pub const SERVER: Icon = Icon {
    paths: &[],
    circles: &[
        (6.0, 6.0, 1.0),
        (6.0, 18.0, 1.0),
    ],
    rects: &[
        (2.0, 2.0, 20.0, 8.0, 2.0),
        (2.0, 14.0, 20.0, 8.0, 2.0),
    ],
    polygons: &[],
};

pub const HEARTBEAT: Icon = Icon {
    paths: &["M22 12h-4l-3 9L9 3l-3 9H2"],
    circles: &[],
    rects: &[],
    polygons: &[],
};

pub const CROSSHAIR: Icon = Icon {
    paths: &[
        "M12 3v18",
        "M3 12h18",
    ],
    circles: &[(12.0, 12.0, 3.0)],
    rects: &[],
    polygons: &[],
};

pub const BOOK: Icon = Icon {
    paths: &[
        "M4 19.5A2.5 2.5 0 016.5 17H20",
        "M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z",
    ],
    circles: &[],
    rects: &[],
    polygons: &[],
};

pub const CHECK_SQUARE: Icon = Icon {
    paths: &[
        "M9 11l3 3L22 4",
        "M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
    ],
    circles: &[],
    rects: &[],
    polygons: &[],
};

pub const SETTINGS: Icon = Icon {
    paths: &[
        "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
    ],
    circles: &[(12.0, 12.0, 3.0)],
    rects: &[],
    polygons: &[],
};

// ─── Action icons ──────────────────────────────────────────────────────

pub const PLUS: Icon = Icon {
    paths: &["M12 5v14", "M5 12h14"],
    circles: &[],
    rects: &[],
    polygons: &[],
};

pub const CLOSE: Icon = Icon {
    paths: &["M18 6L6 18", "M6 6l12 12"],
    circles: &[],
    rects: &[],
    polygons: &[],
};

pub const SEARCH: Icon = Icon {
    paths: &["m21 21-4.3-4.3"],
    circles: &[(11.0, 11.0, 8.0)],
    rects: &[],
    polygons: &[],
};

pub const BELL: Icon = Icon {
    paths: &[
        "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9",
        "M13.73 21a2 2 0 01-3.46 0",
    ],
    circles: &[],
    rects: &[],
    polygons: &[],
};

pub const SPLIT_H: Icon = Icon {
    paths: &["M3 12h18"],
    circles: &[],
    rects: &[(3.0, 3.0, 18.0, 18.0, 2.0)],
    polygons: &[],
};

pub const SPLIT_V: Icon = Icon {
    paths: &["M12 3v18"],
    circles: &[],
    rects: &[(3.0, 3.0, 18.0, 18.0, 2.0)],
    polygons: &[],
};

pub const AI_BOT: Icon = Icon {
    paths: &[
        "M12 17v4",
        "M8 21h8",
    ],
    circles: &[
        (18.0, 14.0, 0.5),
        (6.0, 14.0, 0.5),
    ],
    rects: &[],
    polygons: &[],
    // The head/body is a special shape
};

pub const LIGHTNING: Icon = Icon {
    paths: &["M13 2L3 14h9l-1 8 10-12h-9l1-8z"],
    circles: &[],
    rects: &[],
    polygons: &[],
};

// ─── Helper: parse SVG path data to egui points ────────────────────────

fn parse_svg_path(data: &str) -> Vec<Vec<Pos2>> {
    let mut subpaths: Vec<Vec<Pos2>> = Vec::new();
    let mut current = Vec::new();
    let mut cursor = Pos2::ZERO;
    let mut start = Pos2::ZERO;
    let chars: Vec<char> = data.chars().collect();
    let mut i = 0;

    fn skip_ws(chars: &[char], i: &mut usize) {
        while *i < chars.len() && chars[*i].is_ascii_whitespace() {
            *i += 1;
        }
    }

    fn parse_number(chars: &[char], i: &mut usize) -> Option<f32> {
        skip_ws(chars, i);
        let start = *i;
        if *i < chars.len() && (chars[*i] == '-' || chars[*i] == '+') {
            *i += 1;
        }
        while *i < chars.len() && (chars[*i].is_ascii_digit() || chars[*i] == '.') {
            *i += 1;
        }
        if start == *i {
            return None;
        }
        let s: String = chars[start..*i].iter().collect();
        s.parse().ok()
    }

    fn parse_pair(chars: &[char], i: &mut usize) -> Option<(f32, f32)> {
        let x = parse_number(chars, i)?;
        // Skip optional comma
        if *i < chars.len() && chars[*i] == ',' {
            *i += 1;
        }
        let y = parse_number(chars, i)?;
        Some((x, y))
    }

    while i < chars.len() {
        skip_ws(&chars, &mut i);
        if i >= chars.len() {
            break;
        }
        let cmd = chars[i];
        i += 1;

        match cmd {
            'M' => {
                if !current.is_empty() {
                    subpaths.push(current);
                    current = Vec::new();
                }
                if let Some((x, y)) = parse_pair(&chars, &mut i) {
                    cursor = Pos2::new(x, y);
                    start = cursor;
                    current.push(cursor);
                }
                // Handle implicit lineto for multiple coordinates
                while let Some((x, y)) = parse_pair(&chars, &mut i) {
                    cursor = Pos2::new(x, y);
                    current.push(cursor);
                }
            }
            'm' => {
                if !current.is_empty() {
                    subpaths.push(current);
                    current = Vec::new();
                }
                if let Some((dx, dy)) = parse_pair(&chars, &mut i) {
                    cursor += Vec2::new(dx, dy);
                    start = cursor;
                    current.push(cursor);
                }
                while let Some((dx, dy)) = parse_pair(&chars, &mut i) {
                    cursor += Vec2::new(dx, dy);
                    current.push(cursor);
                }
            }
            'L' => {
                while let Some((x, y)) = parse_pair(&chars, &mut i) {
                    cursor = Pos2::new(x, y);
                    current.push(cursor);
                }
            }
            'l' => {
                while let Some((dx, dy)) = parse_pair(&chars, &mut i) {
                    cursor += Vec2::new(dx, dy);
                    current.push(cursor);
                }
            }
            'H' => {
                while let Some(x) = parse_number(&chars, &mut i) {
                    cursor.x = x;
                    current.push(cursor);
                }
            }
            'h' => {
                while let Some(dx) = parse_number(&chars, &mut i) {
                    cursor.x += dx;
                    current.push(cursor);
                }
            }
            'V' => {
                while let Some(y) = parse_number(&chars, &mut i) {
                    cursor.y = y;
                    current.push(cursor);
                }
            }
            'v' => {
                while let Some(dy) = parse_number(&chars, &mut i) {
                    cursor.y += dy;
                    current.push(cursor);
                }
            }
            'C' => {
                while let Some((x1, y1)) = parse_pair(&chars, &mut i) {
                    if let Some((x2, y2)) = parse_pair(&chars, &mut i) {
                        if let Some((x, y)) = parse_pair(&chars, &mut i) {
                            // Approximate cubic bezier with line segments
                            let p1 = Pos2::new(x1, y1);
                            let p2 = Pos2::new(x2, y2);
                            let p3 = Pos2::new(x, y);
                            let steps = 8;
                            for t in 1..=steps {
                                let t = t as f32 / steps as f32;
                                let t2 = t * t;
                                let t3 = t2 * t;
                                let mt = 1.0 - t;
                                let mt2 = mt * mt;
                                let mt3 = mt2 * mt;
                                let v = cursor.to_vec2() * mt3
                                    + p1.to_vec2() * 3.0 * mt2 * t
                                    + p2.to_vec2() * 3.0 * mt * t2
                                    + p3.to_vec2() * t3;
                                let p = Pos2::new(v.x, v.y);
                                current.push(p);
                            }
                            cursor = p3;
                        }
                    }
                }
            }
            'c' => {
                while let Some((dx1, dy1)) = parse_pair(&chars, &mut i) {
                    if let Some((dx2, dy2)) = parse_pair(&chars, &mut i) {
                        if let Some((dx, dy)) = parse_pair(&chars, &mut i) {
                            let p1 = cursor + Vec2::new(dx1, dy1);
                            let p2 = cursor + Vec2::new(dx2, dy2);
                            let p3 = cursor + Vec2::new(dx, dy);
                            let steps = 8;
                            for t in 1..=steps {
                                let t = t as f32 / steps as f32;
                                let t2 = t * t;
                                let t3 = t2 * t;
                                let mt = 1.0 - t;
                                let mt2 = mt * mt;
                                let mt3 = mt2 * mt;
                                let v = cursor.to_vec2() * mt3
                                    + p1.to_vec2() * 3.0 * mt2 * t
                                    + p2.to_vec2() * 3.0 * mt * t2
                                    + p3.to_vec2() * t3;
                                let p = Pos2::new(v.x, v.y);
                                current.push(p);
                            }
                            cursor = p3;
                        }
                    }
                }
            }
            'S' => {
                // Smooth cubic - approximate with just the end point
                while let Some((_x2, _y2)) = parse_pair(&chars, &mut i) {
                    if let Some((x, y)) = parse_pair(&chars, &mut i) {
                        cursor = Pos2::new(x, y);
                        current.push(cursor);
                    }
                }
            }
            'Q' => {
                while let Some((x1, y1)) = parse_pair(&chars, &mut i) {
                    if let Some((x, y)) = parse_pair(&chars, &mut i) {
                        let p1 = Pos2::new(x1, y1);
                        let p3 = Pos2::new(x, y);
                        let steps = 6;
                        for t in 1..=steps {
                            let t = t as f32 / steps as f32;
                            let mt = 1.0 - t;
                            let v = cursor.to_vec2() * mt * mt + p1.to_vec2() * 2.0 * mt * t + p3.to_vec2() * t * t;
                            let p = Pos2::new(v.x, v.y);
                            current.push(p);
                        }
                        cursor = p3;
                    }
                }
            }
            'q' => {
                while let Some((dx1, dy1)) = parse_pair(&chars, &mut i) {
                    if let Some((dx, dy)) = parse_pair(&chars, &mut i) {
                        let p1 = cursor + Vec2::new(dx1, dy1);
                        let p3 = cursor + Vec2::new(dx, dy);
                        let steps = 6;
                        for t in 1..=steps {
                            let t = t as f32 / steps as f32;
                            let mt = 1.0 - t;
                            let v = cursor.to_vec2() * mt * mt + p1.to_vec2() * 2.0 * mt * t + p3.to_vec2() * t * t;
                            let p = Pos2::new(v.x, v.y);
                            current.push(p);
                        }
                        cursor = p3;
                    }
                }
            }
            'Z' | 'z' => {
                if !current.is_empty() && current.last() != Some(&start) {
                    current.push(start);
                }
                cursor = start;
                if !current.is_empty() {
                    subpaths.push(current);
                    current = Vec::new();
                }
            }
            _ => {
                // Skip unknown commands
            }
        }
    }

    if !current.is_empty() {
        subpaths.push(current);
    }

    subpaths
}

/// Draw an icon into a given rect using the egui painter.
pub fn paint_icon(ui: &mut egui::Ui, icon: &Icon, rect: Rect, color: Color32) {
    let painter = ui.painter();
    let stroke = Stroke::new(1.8, color);

    // ViewBox is 0 0 24 24, map to rect
    let scale_x = rect.width() / 24.0;
    let scale_y = rect.height() / 24.0;
    let offset = rect.min.to_vec2();

    let map_point = |x: f32, y: f32| -> Pos2 {
        Pos2::new(x * scale_x + offset.x, y * scale_y + offset.y)
    };

    // Draw rounded rects
    for &(x, y, w, h, rx) in icon.rects {
        let r = map_point(x, y);
        let size = Vec2::new(w * scale_x, h * scale_y);
        let corner_radius = egui::CornerRadius::same((rx * scale_x).round() as u8);
        painter.rect(
            Rect::from_min_size(r, size),
            corner_radius,
            Color32::TRANSPARENT,
            stroke,
            egui::StrokeKind::Inside,
        );
    }

    // Draw filled circles (for server dots, etc.)
    for &(cx, cy, r) in icon.circles {
        let center = map_point(cx, cy);
        let radius = r * scale_x.min(scale_y);
        // Check if this is a filled circle (small radius like 1.0 for dots)
        if r <= 1.5 {
            painter.circle_filled(center, radius, color);
        } else {
            painter.circle_stroke(center, radius, stroke);
        }
    }

    // Draw SVG paths
    for path_data in icon.paths {
        let subpaths = parse_svg_path(path_data);
        for points in &subpaths {
            if points.len() < 2 {
                continue;
            }
            let mapped: Vec<Pos2> = points.iter().map(|p| map_point(p.x, p.y)).collect();
            let shape = egui::epaint::PathShape::line(mapped, stroke);
            painter.add(shape);
        }
    }
}

/// Get icon dimensions (24x24 viewBox)
pub fn icon_size(size: f32) -> Vec2 {
    Vec2::splat(size)
}
