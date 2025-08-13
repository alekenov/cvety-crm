interface CheckboxOptionProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description?: string;
}

export function CheckboxOption({ checked, onChange, title, description }: CheckboxOptionProps) {
  return (
    <div className="flex items-start gap-3">
      <button
        onClick={() => onChange(!checked)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
          checked ? 'border-gray-900' : 'border-gray-300'
        }`}
      >
        {checked && <div className="w-2.5 h-2.5 bg-gray-900 rounded-full" />}
      </button>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
    </div>
  );
}