import type { CompletionCandidate } from "./types";

interface Props {
  candidates: CompletionCandidate[];
  activeIndex: number;
  onSelect: (candidate: CompletionCandidate) => void;
  visible: boolean;
}

const SOURCE_LABELS: Record<CompletionCandidate["source"], string> = {
  history: "历史",
  command: "命令",
  path: "路径",
  resource: "资源",
  template: "模板",
  ai: "AI",
};

export function CommandCompletionPopover({ candidates, activeIndex, onSelect, visible }: Props) {
  if (!visible || candidates.length === 0) return null;

  return (
    <div className="term-cmd-completion" role="listbox">
      {candidates.map((candidate, index) => (
        <button
          key={candidate.id}
          type="button"
          role="option"
          aria-selected={index === activeIndex}
          className={`term-cmd-completion-item${index === activeIndex ? " is-active" : ""}`}
          onMouseDown={(event) => {
            event.preventDefault();
            onSelect(candidate);
          }}
        >
          <span className="term-cmd-completion-label">{candidate.label}</span>
          {candidate.description ? (
            <span className="term-cmd-completion-desc">{candidate.description}</span>
          ) : null}
          <span className="term-cmd-completion-source">{SOURCE_LABELS[candidate.source]}</span>
        </button>
      ))}
    </div>
  );
}
