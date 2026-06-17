import { useRef } from "react";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import { useI18n } from "../../i18n";
import { buildCrepeFeatureConfigs } from "./crepeBlockEditI18n";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/classic.css";
import "./knowledgeCrepe.css";

interface KnowledgeCrepeEditorProps {
  entryId: string;
  defaultContent: string;
  placeholder: string;
  onChange: (markdown: string) => void;
}

function CrepeEditorInner({
  entryId,
  defaultContent,
  placeholder,
  onChange,
}: KnowledgeCrepeEditorProps) {
  const { t, locale } = useI18n();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const skipInitialUpdateRef = useRef(true);

  useEditor((root) => {
    skipInitialUpdateRef.current = true;
    const featureConfigs = buildCrepeFeatureConfigs(t);

    const crepe = new Crepe({
      root,
      defaultValue: defaultContent,
      features: {
        [CrepeFeature.TopBar]: false,
        [CrepeFeature.AI]: false,
      },
      featureConfigs: {
        ...featureConfigs,
        [CrepeFeature.Placeholder]: {
          text: placeholder,
          mode: "block",
        },
      },
    });

    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => {
        if (skipInitialUpdateRef.current) {
          skipInitialUpdateRef.current = false;
          return;
        }
        onChangeRef.current(markdown);
      });
    });

    return crepe;
  }, [entryId, locale]);

  return <Milkdown />;
}

export function KnowledgeCrepeEditor(props: KnowledgeCrepeEditorProps) {
  return (
    <div className="knowledge-crepe-shell">
      <MilkdownProvider>
        <CrepeEditorInner {...props} />
      </MilkdownProvider>
    </div>
  );
}
