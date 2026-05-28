# OmniPanel Shell Integration for Fish
# Emits OSC 133 sequences for command boundary detection (Blocks)

function __omnipanel_prompt_start --on-event fish_prompt
    printf "\033]133;A\007"
    printf "\033]1337;CurrentDir=%s\007" "$PWD"
end

function __omnipanel_cmd_start --on-event fish_preexec
    printf "\033]133;C\007"
end

function __omnipanel_cmd_end --on-event fish_postexec
    printf "\033]133;D;%s\007" "$status"
end
