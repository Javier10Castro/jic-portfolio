'use client';

import { useState } from 'react';
import type { MissingField } from '@/types/conversation';

interface MissingFieldsProps {
  fields: MissingField[];
  onAnswer: (field: string, value: any, missingField: MissingField) => void;
}

export default function MissingFields({ fields, onAnswer }: MissingFieldsProps) {
  const [textValues, setTextValues] = useState<Record<string, string>>({});

  if (fields.length === 0) {
    return <p className="text-xs text-gray-400 dark:text-gray-500">No missing fields</p>;
  }

  const handleTextChange = (field: MissingField, value: string) => {
    setTextValues((prev) => ({ ...prev, [field.field]: value }));
    onAnswer(field.field, value, field);
  };

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div key={field.field} className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {field.description && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500">{field.description}</p>
          )}
          {renderField(field, textValues[field.field] ?? '', handleTextChange)}
        </div>
      ))}
    </div>
  );
}

function renderField(
  field: MissingField,
  currentValue: string,
  onChange: (field: MissingField, value: any) => void,
) {
  switch (field.type) {
    case 'radio':
      return (
        <div className="space-y-1">
          {field.options?.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
            >
              <input
                type="radio"
                name={field.field}
                value={opt}
                checked={currentValue === opt}
                onChange={() => onChange(field, opt)}
                className="text-blue-600 focus:ring-blue-500"
              />
              {opt}
            </label>
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <div className="space-y-1">
          {field.options?.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
            >
              <input
                type="checkbox"
                value={opt}
                onChange={(e) => onChange(field, e.target.checked ? opt : '')}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              {opt}
            </label>
          ))}
        </div>
      );
    case 'select':
      return (
        <select
          value={currentValue}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    case 'text':
      return (
        <input
          type="text"
          value={currentValue}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={field.description || `Enter ${field.label}`}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      );
    case 'textarea':
      return (
        <textarea
          value={currentValue}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={field.description || `Enter ${field.label}`}
          rows={3}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      );
    case 'number':
      return (
        <input
          type="number"
          value={currentValue}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      );
    case 'color':
      return (
        <input
          type="color"
          value={currentValue || '#000000'}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full h-10 rounded-lg border border-gray-300 bg-white cursor-pointer dark:border-gray-600"
        />
      );
    case 'date':
      return (
        <input
          type="date"
          value={currentValue}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      );
    case 'boolean':
      return (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={currentValue === 'true'}
            onChange={(e) => onChange(field, e.target.checked ? 'true' : 'false')}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 dark:bg-gray-700" />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            {currentValue === 'true' ? 'Yes' : 'No'}
          </span>
        </label>
      );
    case 'file':
      return (
        <input
          type="file"
          onChange={(e) => onChange(field, e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/40 dark:file:text-blue-300"
        />
      );
    default:
      return (
        <input
          type="text"
          value={currentValue}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      );
  }
}
