use egui::Color32;

/// A single cell in the terminal grid.
#[derive(Debug, Clone)]
pub struct TerminalCell {
    pub ch: char,
    pub fg: Color32,
    pub bg: Color32,
    pub bold: bool,
    pub italic: bool,
    pub underline: bool,
}

impl Default for TerminalCell {
    fn default() -> Self {
        Self {
            ch: ' ',
            fg: Color32::from_rgb(253, 252, 252), // --fg
            bg: Color32::from_rgb(32, 29, 29),     // --bg
            bold: false,
            italic: false,
            underline: false,
        }
    }
}

/// Represents the terminal screen state for rendering.
#[derive(Debug, Clone)]
pub struct TerminalScreen {
    pub cells: Vec<Vec<TerminalCell>>,
    pub cols: usize,
    pub rows: usize,
    pub cursor_col: usize,
    pub cursor_row: usize,
    pub cursor_visible: bool,
}

impl TerminalScreen {
    pub fn new(cols: usize, rows: usize) -> Self {
        let cells = vec![vec![TerminalCell::default(); cols]; rows];
        Self {
            cells,
            cols,
            rows,
            cursor_col: 0,
            cursor_row: 0,
            cursor_visible: true,
        }
    }

    /// Update screen from raw terminal output (simplified VT parser).
    pub fn update_from_bytes(&mut self, data: &[u8]) {
        let text = String::from_utf8_lossy(data);
        for ch in text.chars() {
            match ch {
                '\n' => {
                    self.cursor_row += 1;
                    if self.cursor_row >= self.rows {
                        // Scroll up
                        self.cells.remove(0);
                        self.cells.push(vec![TerminalCell::default(); self.cols]);
                        self.cursor_row = self.rows - 1;
                    }
                    self.cursor_col = 0;
                }
                '\r' => {
                    self.cursor_col = 0;
                }
                '\t' => {
                    let next_tab = ((self.cursor_col / 8) + 1) * 8;
                    self.cursor_col = next_tab.min(self.cols - 1);
                }
                c if c.is_control() => {
                    // Skip other control characters
                }
                c => {
                    if self.cursor_col < self.cols && self.cursor_row < self.rows {
                        self.cells[self.cursor_row][self.cursor_col] = TerminalCell {
                            ch: c,
                            ..TerminalCell::default()
                        };
                        self.cursor_col += 1;
                    }
                    if self.cursor_col >= self.cols {
                        self.cursor_col = 0;
                        self.cursor_row += 1;
                        if self.cursor_row >= self.rows {
                            self.cells.remove(0);
                            self.cells.push(vec![TerminalCell::default(); self.cols]);
                            self.cursor_row = self.rows - 1;
                        }
                    }
                }
            }
        }
    }
}
