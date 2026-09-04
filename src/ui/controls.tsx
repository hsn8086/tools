import {
  useId,
  type CompositionEventHandler,
  type FocusEventHandler,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type ReactNode,
  type Ref,
} from 'react';

export function Button({
  variant = 'tonal',
  size,
  icon,
  className,
  children,
  ...rest
}: {
  variant?: 'filled' | 'tonal' | 'text' | 'outlined';
  size?: 'sm';
  icon?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={className ? `btn ${className}` : 'btn'} data-variant={variant} data-size={size} type="button" {...rest}>
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  variant = 'standard',
  children,
  ref,
  ...rest
}: {
  label: string;
  variant?: 'standard' | 'tonal';
  ref?: Ref<HTMLButtonElement>;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="icon-btn" data-variant={variant} type="button" aria-label={label} title={label} ref={ref} {...rest}>
      {children}
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  size,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  size?: 'sm';
}) {
  return (
    <div className="seg" data-size={size} role="group">
      {options.map((o) => (
        <button key={String(o.value)} type="button" data-on={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * MD3E 直线进度条：轨道和已完成段之间留一道缺口，末端一个停止点。
 * 缺口是这版规格的识别特征，也让「还剩多少」在窄条上更看得出来。
 */
export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <span className="progress-active" style={{ width: `${pct}%` }} />
      <span className="progress-track" style={{ left: `calc(${pct}% + 4px)` }} />
      <span className="progress-stop" />
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track">
        <span className="thumb" />
      </span>
      <span className="switch-label">{label}</span>
    </label>
  );
}

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  label: string;
}) {
  // 传 0..1 的纯数字：CSS 里要拿它去乘百分比算位置，带单位就没法算了
  const t = (value - min) / (max - min);
  return (
    <div className="slider" style={{ ['--v' as string]: t }}>
      <span className="rail" />
      <span className="fill" />
      <span className="handle" />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        aria-label={label}
      />
    </div>
  );
}

/**
 * MD3 描边输入框。缺口是真的缺口：用 fieldset + legend，
 * legend 的宽度从 0 过渡到内容宽度，标签浮上去时描边正好让开。
 */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  multiline,
  rows,
  ref,
  onKeyDown,
  onKeyUp,
  onClick,
  onBlur,
  onCompositionStart,
  onCompositionEnd,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: 'text' | 'numeric';
  multiline?: boolean;
  rows?: number;
  ref?: Ref<HTMLTextAreaElement>;
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
  onKeyUp?: KeyboardEventHandler<HTMLTextAreaElement>;
  onClick?: MouseEventHandler<HTMLTextAreaElement>;
  onBlur?: FocusEventHandler<HTMLTextAreaElement>;
  onCompositionStart?: CompositionEventHandler<HTMLTextAreaElement>;
  onCompositionEnd?: CompositionEventHandler<HTMLTextAreaElement>;
}) {
  const id = useId();
  const floated = value.length > 0 || !!placeholder;

  return (
    <div className="tf" data-floated={floated || undefined} data-multiline={multiline || undefined}>
      {multiline ? (
        <textarea
          id={id}
          ref={ref}
          rows={rows ?? 3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onClick={onClick}
          onBlur={onBlur}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
        />
      ) : (
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      <label htmlFor={id}>{label}</label>
      <fieldset aria-hidden="true">
        <legend>
          <span>{label}</span>
        </legend>
      </fieldset>
    </div>
  );
}
