import { useCallback } from "react";
import { useI18n } from "../../i18n";
import {
  CONTROLLABLE_PROTOCOL_TABS,
  DEV_LOCKED_PROTOCOL_TABS,
  type ControllableProtocolTabKey,
} from "../../lib/protocolLabConfig";
import { useSettingsStore } from "../../stores/settingsStore";

export function ProtocolLabSettingsSection() {
  const { t } = useI18n();
  const protocolLabTabs = useSettingsStore((s) => s.protocolLabTabs);
  const setProtocolLabSettings = useSettingsStore((s) => s.setProtocolLabSettings);

  const handleToggle = useCallback(
    (key: ControllableProtocolTabKey, open: boolean) => {
      setProtocolLabSettings({
        protocolLabTabs: {
          ...protocolLabTabs,
          [key]: open ? "open" : "closed",
        },
      });
    },
    [protocolLabTabs, setProtocolLabSettings],
  );

  return (
    <div className="protocol-lab-settings">
      <div className="protocol-lab-settings__list" role="group" aria-label={t("settings.protocolLab.label")}>
        {CONTROLLABLE_PROTOCOL_TABS.map((key) => {
          const open = protocolLabTabs[key] === "open";
          return (
            <label key={key} className="protocol-lab-settings__item">
              <input
                type="checkbox"
                className="protocol-lab-settings__checkbox"
                checked={open}
                onChange={(event) => handleToggle(key, event.target.checked)}
              />
              <span className="protocol-lab-settings__label">{t(`protocol.tabs.${key}`)}</span>
              <span className="protocol-lab-settings__status">
                {t(`settings.protocolLab.status.${open ? "open" : "closed"}`)}
              </span>
            </label>
          );
        })}

        {DEV_LOCKED_PROTOCOL_TABS.map((key) => (
          <label key={key} className="protocol-lab-settings__item protocol-lab-settings__item--locked">
            <input
              type="checkbox"
              className="protocol-lab-settings__checkbox"
              checked={false}
              disabled
              aria-disabled
            />
            <span className="protocol-lab-settings__label">{t(`protocol.tabs.${key}`)}</span>
            <span className="module-status-badge module-status-badge--disabled">
              {t("settings.protocolLab.status.disabled")}
            </span>
          </label>
        ))}
      </div>

      <p className="setting-hint protocol-lab-settings__hint">{t("settings.protocolLab.snifferHint")}</p>
    </div>
  );
}
