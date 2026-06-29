import { useI18n } from "../../../../i18n";
import type { LaunchPreset } from "../types";

type Props = {
  presets: LaunchPreset[];
  onRunPreset: (preset: LaunchPreset) => void;
  variant?: "inline" | "cards";
};

export function HostLaunchPresets({ presets, onRunPreset, variant = "inline" }: Props) {
  const { t } = useI18n();

  if (presets.length === 0) return null;

  if (variant === "inline") {
    return (
      <div className="ssh-host-presets ssh-host-presets--inline">
        <span className="ssh-host-presets__inline-label">{t("ssh.presets.title")}</span>
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`ssh-host-presets__chip ssh-host-presets__chip--${preset.tone}`}
            onClick={() => onRunPreset(preset)}
            title={preset.desc}
          >
            {preset.title}
          </button>
        ))}
      </div>
    );
  }

  return (
    <section className="ssh-host-presets">
      <div className="ssh-host-presets__grid">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`ssh-host-presets__card ssh-host-presets__card--${preset.tone}`}
            onClick={() => onRunPreset(preset)}
          >
            <div className="ssh-host-presets__card-title">{preset.title}</div>
            <div className="ssh-host-presets__card-desc">{preset.desc}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
