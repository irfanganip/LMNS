import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { IconWarning } from './Icons';

type Common = {
  id: string;
  label: string;
  help?: ReactNode;
  error?: string | null;
  required?: boolean;
  counter?: string;
  counterTone?: 'default' | 'warn' | 'danger';
};

function FieldShell({
  id,
  label,
  help,
  error,
  required,
  counter,
  counterTone = 'default',
  children,
}: Common & { children: ReactNode }) {
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required && <span className="field__required"> (wajib)</span>}
      </label>
      {children}
      <div className="field__foot">
        {error ? (
          <p className="field__error" id={`${id}-error`} role="alert">
            <IconWarning size={14} />
            {error}
          </p>
        ) : help ? (
          <p className="field__help" id={`${id}-help`}>
            {help}
          </p>
        ) : (
          <span />
        )}
        {counter && (
          <p className={`field__counter field__counter--${counterTone}`} aria-live="polite">
            {counter}
          </p>
        )}
      </div>
    </div>
  );
}

type TextFieldProps = Common &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> & { mono?: boolean };

export function TextField({
  id,
  label,
  help,
  error,
  required,
  counter,
  counterTone,
  mono,
  ...rest
}: TextFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      help={help}
      error={error}
      required={required}
      counter={counter}
      counterTone={counterTone}
    >
      <input
        id={id}
        className={`input${mono ? ' input--mono' : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
        {...rest}
      />
    </FieldShell>
  );
}

type TextAreaProps = Common & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'>;

export function TextArea({
  id,
  label,
  help,
  error,
  required,
  counter,
  counterTone,
  rows = 4,
  ...rest
}: TextAreaProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      help={help}
      error={error}
      required={required}
      counter={counter}
      counterTone={counterTone}
    >
      <textarea
        id={id}
        className="input input--area"
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
        {...rest}
      />
    </FieldShell>
  );
}

type SelectProps = Common &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className'> & {
    options?: { value: string; label: string; disabled?: boolean }[];
    placeholder?: string;
  };

export function SelectField({
  id,
  label,
  help,
  error,
  required,
  options,
  placeholder,
  children,
  ...rest
}: SelectProps) {
  return (
    <FieldShell id={id} label={label} help={help} error={error} required={required}>
      <select
        id={id}
        className="input input--select"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options?.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
    </FieldShell>
  );
}

type RadioGroupProps = {
  id: string;
  label: string;
  help?: ReactNode;
  error?: string | null;
  required?: boolean;
  value: string;
  options: { value: string; label: string; disabled?: boolean; hint?: string }[];
  onChange: (value: string) => void;
  legendAs?: 'label' | 'legend';
};

export function RadioGroup({
  id,
  label,
  help,
  error,
  required,
  value,
  options,
  onChange,
  legendAs = 'legend',
}: RadioGroupProps) {
  return (
    <fieldset className={`field field--group${error ? ' field--error' : ''}`} id={id}>
      {legendAs === 'legend' ? (
        <legend className="field__label">
          {label}
          {required && <span className="field__required"> (wajib)</span>}
        </legend>
      ) : (
        <p className="field__label">
          {label}
          {required && <span className="field__required"> (wajib)</span>}
        </p>
      )}
      <div className="radio-grid">
        {options.map((option) => (
          <label
            key={option.value}
            className={`radio-card${value === option.value ? ' radio-card--selected' : ''}${
              option.disabled ? ' radio-card--disabled' : ''
            }`}
          >
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              onChange={() => onChange(option.value)}
            />
            <span className="radio-card__label">{option.label}</span>
            {option.hint && <span className="radio-card__hint">{option.hint}</span>}
          </label>
        ))}
      </div>
      {error ? (
        <p className="field__error" role="alert">
          <IconWarning size={14} />
          {error}
        </p>
      ) : help ? (
        <p className="field__help">{help}</p>
      ) : null}
    </fieldset>
  );
}
