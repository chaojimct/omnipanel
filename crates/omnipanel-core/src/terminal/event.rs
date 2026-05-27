/// Events emitted by the terminal module.
#[derive(Debug, Clone)]
pub enum TerminalEvent {
    /// New output data available.
    Output(Vec<u8>),
    /// Terminal process exited with the given code.
    Exited(Option<i32>),
    /// Terminal title changed.
    TitleChanged(String),
}
