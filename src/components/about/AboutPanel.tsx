import React from 'react';
import { APP_NAME, APP_VERSION } from '../../utils/constants';

export function AboutPanel() {
  return (
    <div className="flex-1 flex items-start justify-center p-8 overflow-y-auto">
      <div className="max-w-lg w-full space-y-6 pt-12">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4" style={{ background: 'var(--accent-color)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M9 9h6M9 13h6M9 17h4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--surface-100)' }}>{APP_NAME}</h1>
          <p className="text-sm" style={{ color: 'var(--surface-400)' }}>v{APP_VERSION}</p>
        </div>

        <div className="glass-panel rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--surface-400)' }}>Developer</h2>
            <p className="text-sm font-medium" style={{ color: 'var(--surface-200)' }}>John Booth</p>
            <p className="text-xs" style={{ color: 'var(--surface-400)' }}>JMB-Labs</p>
          </div>

          <div className="w-full h-px" style={{ background: 'var(--glass-border)' }} />

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--surface-400)' }}>License</h2>
            <p className="text-sm" style={{ color: 'var(--surface-300)' }}>MIT &mdash; Open Source</p>
            <p className="text-xs" style={{ color: 'var(--surface-400)' }}>&copy; {new Date().getFullYear()} John Booth (JMB-Labs)</p>
          </div>

          <div className="w-full h-px" style={{ background: 'var(--glass-border)' }} />

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--surface-400)' }}>Website</h2>
            <a className="text-sm hover:underline" style={{ color: 'var(--accent-color)' }} href="#" onClick={(e) => e.preventDefault()}>
              jmblabs.uk
            </a>
          </div>

          <div className="w-full h-px" style={{ background: 'var(--glass-border)' }} />

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--surface-400)' }}>GitHub</h2>
            <a className="text-sm hover:underline" style={{ color: 'var(--accent-color)' }} href="#" onClick={(e) => e.preventDefault()}>
              github.com/JohnMBNet
            </a>
          </div>

          <div className="w-full h-px" style={{ background: 'var(--glass-border)' }} />

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--surface-400)' }}>Personal Website</h2>
            <a className="text-sm hover:underline" style={{ color: 'var(--accent-color)' }} href="#" onClick={(e) => e.preventDefault()}>
              johnbooth.uk
            </a>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--surface-400)' }}>Description</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--surface-300)' }}>
            {APP_NAME} is a local project workspace manager.
            All data is stored on your machine in standard readable formats &mdash; no cloud, no vendor lock-in.
          </p>
        </div>

        <div className="text-center pb-8">
          <p className="text-[10px]" style={{ color: 'var(--surface-600)' }}>
            Built with Electron, React, TypeScript and Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
}
