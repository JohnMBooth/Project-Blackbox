import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useTerminalStore } from '../../stores/terminalStore';
import { useUIStore } from '../../stores/uiStore';
import { registry, parseCommand, getAutocompleteSuggestions } from '../../services/commands';

export function BottomTerminal() {
  const terminalOpen = useUIStore((s) => s.terminalOpen);
  const toggleTerminal = useUIStore((s) => s.toggleTerminal);
  const lines = useTerminalStore((s) => s.lines);
  const addInput = useTerminalStore((s) => s.addInput);
  const addOutput = useTerminalStore((s) => s.addOutput);
  const addError = useTerminalStore((s) => s.addError);
  const addSystem = useTerminalStore((s) => s.addSystem);
  const clear = useTerminalStore((s) => s.clear);
  const history = useTerminalStore((s) => s.history);
  const historyIndex = useTerminalStore((s) => s.historyIndex);
  const pushHistory = useTerminalStore((s) => s.pushHistory);
  const setHistoryIndex = useTerminalStore((s) => s.setHistoryIndex);
  const setCurrentInput = useTerminalStore((s) => s.setCurrentInput);
  const currentInput = useTerminalStore((s) => s.currentInput);

  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    if (terminalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [terminalOpen]);

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    addInput(cmd);
    pushHistory(cmd);

    const parsed = parseCommand(cmd);
    if (!parsed.name) return;

    const command = registry.get(parsed.name);
    if (!command) {
      addError(`Unknown command: "${parsed.name}". Type "help" for available commands.`);
      return;
    }

    // Map positional args to named args
    const args: Record<string, string | number | boolean> = {};
    for (let i = 0; i < command.args.length; i++) {
      const argDef = command.args[i];
      const value = parsed.args[i];
      if (value !== undefined) {
        if (argDef.type === 'number') {
          args[argDef.name] = Number(value);
        } else if (argDef.type === 'boolean') {
          args[argDef.name] = value === 'true' || value === '1';
        } else {
          args[argDef.name] = value;
        }
      } else if (argDef.required) {
        addError(`Missing required argument: ${argDef.name}`);
        return;
      }
    }

    const result = await registry.execute(parsed.name, args);
    if (result.output) {
      addOutput(result.output);
    }
    if (result.error) {
      addError(result.error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const commands = registry.getAll();

    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(input);
      setInput('');
      setSuggestions([]);
      setSuggestionIndex(-1);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        const idx = suggestionIndex >= 0 ? suggestionIndex : 0;
        setInput(suggestions[idx] + ' ');
        setSuggestions([]);
        setSuggestionIndex(-1);
      } else {
        const auto = getAutocompleteSuggestions(input, commands);
        if (auto.length === 1) {
          setInput(auto[0] + ' ');
          setSuggestions([]);
        } else if (auto.length > 1) {
          setSuggestions(auto);
          setSuggestionIndex(0);
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0 && suggestionIndex > 0) {
        setSuggestionIndex(suggestionIndex - 1);
      } else if (history.length > 0) {
        const newIdx = historyIndex + 1 < history.length ? historyIndex + 1 : history.length - 1;
        setHistoryIndex(newIdx);
        setInput(history[newIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0 && suggestionIndex < suggestions.length - 1) {
        setSuggestionIndex(suggestionIndex + 1);
      } else if (historyIndex > 0) {
        const newIdx = historyIndex - 1;
        setHistoryIndex(newIdx);
        setInput(history[newIdx] || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setSuggestionIndex(-1);
    }
  };

  if (!terminalOpen) {
    return (
      <div className="h-8 flex items-center px-4 border-t shrink-0 cursor-pointer" style={{ borderColor: 'var(--glass-border)', background: 'var(--surface-950)' }} onClick={toggleTerminal}>
        <span className="text-[10px] font-mono" style={{ color: 'var(--surface-500)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1">
            <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          Terminal (click to expand)
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col border-t shrink-0" style={{ borderColor: 'var(--glass-border)', height: '220px', background: 'var(--terminal-bg)' }}>
      <div className="flex items-center justify-between px-3 py-1 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <span className="text-[10px] font-mono" style={{ color: 'var(--terminal-green)' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1">
            <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          terminal
        </span>
        <div className="flex gap-1">
          <button className="btn btn-ghost text-[10px] p-1" onClick={clear}>clear</button>
          <button className="btn btn-ghost text-[10px] p-1" onClick={toggleTerminal}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 font-mono text-xs leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {lines.map((line) => (
          <div key={line.id} style={{
            color: line.type === 'input' ? 'var(--terminal-green)' :
                   line.type === 'error' ? 'var(--terminal-red)' :
                   line.type === 'system' ? 'var(--terminal-blue)' :
                   'var(--surface-400)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            {line.content}
          </div>
        ))}
      </div>

      <div className="relative px-2 pb-2">
        {suggestions.length > 0 && (
          <div
            className="absolute bottom-full left-2 mb-1 rounded overflow-hidden"
            style={{ background: 'var(--surface-900)', border: '1px solid var(--surface-700)', maxHeight: '150px', overflowY: 'auto' }}
          >
            {suggestions.map((s, i) => (
              <div
                key={s}
                className="px-3 py-1 text-xs cursor-pointer"
                style={{
                  background: i === suggestionIndex ? 'rgba(var(--accent-color-rgb), 0.1)' : 'transparent',
                  color: i === suggestionIndex ? 'var(--accent-color)' : 'var(--surface-400)',
                }}
                onMouseDown={() => {
                  setInput(s + ' ');
                  setSuggestions([]);
                  setSuggestionIndex(-1);
                  inputRef.current?.focus();
                }}
              >
                {s}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--terminal-green)' }}>$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setCurrentInput(e.target.value);
              const auto = getAutocompleteSuggestions(e.target.value, registry.getAll());
              setSuggestions(auto.length > 0 && e.target.value ? auto : []);
              setSuggestionIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-xs font-mono"
            style={{ color: 'var(--surface-200)', fontFamily: "'JetBrains Mono', monospace" }}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
