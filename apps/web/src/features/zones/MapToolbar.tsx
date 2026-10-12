/** Herramienta que actúa sobre el mapa al hacer clic. */
export type MapTool = 'add' | 'erase' | 'depot'

export interface MapToolbarProps {
  tool: MapTool
  /** Dibujando un hueco: la herramienta de exclusión queda marcada. */
  holeActive: boolean
  canUndo: boolean
  canClear: boolean
  canFit: boolean
  onTool: (tool: MapTool) => void
  onHole: () => void
  onUndo: () => void
  onClear: () => void
  onFit: () => void
}

/**
 * Barra flotante sobre el mapa para trazar la zona sin depender solo de clics y atajos: agregar vértices,
 * quitarlos, dibujar exclusiones, fijar la bodega y encuadrar la figura. Cada botón explica su acción al pasar el cursor.
 */
export function MapToolbar({
  tool,
  holeActive,
  canUndo,
  canClear,
  canFit,
  onTool,
  onHole,
  onUndo,
  onClear,
  onFit,
}: MapToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Herramientas del mapa"
      className="absolute left-3 top-3 z-[1000] flex flex-col gap-1 rounded-xl border border-surface-container-high bg-surface-container-lowest/95 p-1.5 shadow-lg backdrop-blur"
    >
      <ToolButton label="Agregar vértice (1): clic en el mapa" icon="polyline" pressed={tool === 'add' && !holeActive} onClick={() => { onTool('add'); }} />
      <ToolButton label="Dibujar exclusión (2)" icon="radio_button_unchecked" pressed={holeActive} tone="rose" onClick={onHole} />
      <ToolButton label="Quitar vértice (3): clic sobre el vértice" icon="remove_circle" pressed={tool === 'erase'} tone="rose" onClick={() => { onTool(tool === 'erase' ? 'add' : 'erase'); }} />
      <ToolButton label="Fijar bodega de salida (4): clic en el mapa" icon="warehouse" pressed={tool === 'depot'} tone="amber" onClick={() => { onTool(tool === 'depot' ? 'add' : 'depot'); }} />
      <Divider />
      <ToolButton label="Deshacer (Ctrl+Z)" icon="undo" disabled={!canUndo} onClick={onUndo} />
      <ToolButton label="Borrar trazo actual (Esc)" icon="delete" disabled={!canClear} tone="rose" onClick={onClear} />
      <Divider />
      <ToolButton label="Centrar en la figura (F)" icon="center_focus_strong" disabled={!canFit} onClick={onFit} />
    </div>
  )
}

function Divider() {
  return <div aria-hidden="true" className="my-0.5 h-px bg-surface-container-high" />
}

interface ToolButtonProps {
  label: string
  icon: string
  pressed?: boolean
  disabled?: boolean
  tone?: 'rose' | 'amber'
  onClick: () => void
}

function ToolButton({ label, icon, pressed = false, disabled = false, tone, onClick }: ToolButtonProps) {
  const toneClass = tone === 'rose' ? 'text-error' : tone === 'amber' ? 'text-amber-700' : 'text-on-surface'
  return (
    <button
      aria-label={label}
      aria-pressed={pressed}
      className={`group relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
        pressed ? 'bg-primary text-on-primary shadow-sm' : `${toneClass} hover:bg-surface-container`
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[19px]">{icon}</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-inverse-surface px-2 py-1 text-[10px] font-medium text-inverse-on-surface opacity-0 shadow-md transition-opacity group-hover:opacity-100"
      >
        {label}
      </span>
    </button>
  )
}
