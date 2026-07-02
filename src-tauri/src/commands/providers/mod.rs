//! 统一对话提供者注册表：`~/.omnipd/ai/providers.json`（HTTP + CLI）。

pub mod registry;

pub use registry::{
    cli_provider_list, cli_provider_patch, cli_provider_remove, cli_provider_upsert,
    load_providers_file, provider_list_models, save_providers_file, CliProviderPatchInput,
    CliProviderRecord, CliProviderUpsertInput, HttpProviderRecord, ProvidersFile,
};
