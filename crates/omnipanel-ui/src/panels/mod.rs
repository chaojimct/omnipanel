pub mod terminal;

use egui::Ui;

/// Trait for all panels in the workspace.
pub trait Panel {
    /// Unique identifier for this panel type.
    fn id(&self) -> &str;

    /// Display name for the tab bar.
    fn label(&self) -> &str;

    /// Render the panel content.
    fn show(&mut self, ui: &mut Ui);
}
