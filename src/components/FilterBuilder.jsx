import { useState, useMemo } from 'react';
import RelationTreePicker from './RelationTreePicker';

// Operators matching the CustomFormGridService buildExpressionQuery
const OPERATOR_GROUPS = [
  {
    label: 'Comparison',
    operators: [
      { value: 'EQ', label: '= Equals', hint: 'Exact match. Prefix value with ~! to negate.' },
      { value: 'NEQ', label: '≠ Not Equals' },
      { value: 'GR', label: '> Greater Than' },
      { value: 'GREQ', label: '≥ Greater or Equal' },
      { value: 'LE', label: '< Less Than' },
      { value: 'LEQ', label: '≤ Less or Equal' },
      { value: 'BETWEENINCL', label: '↔ Between (inclusive)', hint: 'Comma-separated: from,to', needsTwoValues: true },
    ],
  },
  {
    label: 'Text',
    operators: [
      { value: 'CONTAINS', label: '⊃ Contains', hint: 'LIKE %value%. Space-separated terms = AND.' },
      { value: 'NOTCONTAINS', label: '⊅ Not Contains' },
      { value: 'STARTSWITH', label: 'Starts With' },
      { value: 'NOTSTARTSWITH', label: 'Not Starts With' },
      { value: 'ENDSWITH', label: 'Ends With' },
    ],
  },
  {
    label: 'Null / Defined',
    operators: [
      { value: 'DEFINED', label: 'Is Defined', hint: 'NOT NULL and not empty string', noValue: true },
      { value: 'NOTDEFINED', label: 'Not Defined', hint: 'IS NULL or empty string', noValue: true },
      { value: 'NOTDEFINEDORZERO', label: 'Not Defined or Zero', noValue: true },
    ],
  },
  {
    label: 'List',
    operators: [
      { value: 'INCOMMALIST', label: '∈ In (comma-separated)', hint: 'Values separated by commas' },
      { value: 'INLIST', label: '∈ In (line-separated)', hint: 'Values separated by newlines', multiline: true },
      { value: 'NOTINLIST', label: '∉ Not In (line-separated)', hint: 'Values separated by newlines', multiline: true },
    ],
  },
  {
    label: 'Collection Size',
    operators: [
      { value: 'HASEQELEMENTS', label: 'Has = N Elements', hint: 'Count of related items. 0 = empty.' },
      { value: 'HASNEQELEMENTS', label: 'Has ≠ N Elements' },
    ],
  },
  {
    label: 'Numeric',
    operators: [
      { value: 'NUMGR', label: '> Numeric Greater' },
      { value: 'NUMGREQ', label: '≥ Numeric Greater or Equal' },
      { value: 'NUMLE', label: '< Numeric Less' },
      { value: 'NUMLEQ', label: '≤ Numeric Less or Equal' },
    ],
  },
];

const ALL_OPERATORS = OPERATOR_GROUPS.flatMap((g) => g.operators);

function getOperatorMeta(op) {
  return ALL_OPERATORS.find((o) => o.value === op) || {};
}

export default function FilterBuilder({ entity, filters, onFiltersChange }) {
  const [showFieldPicker, setShowFieldPicker] = useState(null); // index of filter being edited

  const addFilter = () => {
    onFiltersChange([...filters, { field: '', operator: 'EQ', value: '', conjunction: 'AND' }]);
  };

  const updateFilter = (index, updates) => {
    const updated = filters.map((f, i) => (i === index ? { ...f, ...updates } : f));
    onFiltersChange(updated);
  };

  const removeFilter = (index) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
  };

  const handleFieldSelected = (index, fieldPath) => {
    updateFilter(index, { field: fieldPath });
    setShowFieldPicker(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Filters
        </label>
        <button
          onClick={addFilter}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Filter
        </button>
      </div>

      {filters.length === 0 && (
        <div className="text-xs text-gray-500 text-center py-3">
          No filters. Click "Add Filter" to add search conditions.
        </div>
      )}

      {filters.map((filter, index) => {
        const meta = getOperatorMeta(filter.operator);
        const needsValue = !meta.noValue;

        return (
          <div key={index} className="relative">
            {/* Conjunction badge between filters */}
            {index > 0 && (
              <div className="flex justify-center -mt-1 mb-1">
                <button
                  onClick={() =>
                    updateFilter(index, {
                      conjunction: filter.conjunction === 'OR' ? 'AND' : 'OR',
                    })
                  }
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full border transition-colors ${
                    filter.conjunction === 'OR'
                      ? 'bg-orange-500/20 border-orange-500/30 text-orange-300 hover:bg-orange-500/30'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                  }`}
                  title="Click to toggle AND/OR conjunction"
                >
                  {filter.conjunction || 'AND'}
                </button>
              </div>
            )}

            <div className="bg-gray-900/50 rounded-lg p-2 border border-gray-800 space-y-2">
              {/* Row 1: Field + Operator */}
              <div className="flex items-start gap-2">
                {/* Field */}
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] text-gray-500 mb-0.5 block">Field</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowFieldPicker(showFieldPicker === index ? null : index)}
                      className="flex-1 text-left px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs hover:border-gray-600 transition-colors truncate"
                    >
                      {filter.field || (
                        <span className="text-gray-500">Select field…</span>
                      )}
                    </button>
                    {filter.field && (
                      <input
                        type="text"
                        value={filter.field}
                        onChange={(e) => updateFilter(index, { field: e.target.value })}
                        className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono placeholder-gray-600"
                        placeholder="or type manually…"
                      />
                    )}
                  </div>
                </div>

                {/* Operator */}
                <div className="w-44 flex-shrink-0">
                  <label className="text-[10px] text-gray-500 mb-0.5 block">Operator</label>
                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(index, { operator: e.target.value })}
                    className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {OPERATOR_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.operators.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFilter(index)}
                  className="mt-4 p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Remove filter"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Row 2: Value */}
              {needsValue && (
                <div>
                  <label className="text-[10px] text-gray-500 mb-0.5 block">
                    Value
                    {meta.hint && (
                      <span className="ml-1 text-gray-600">— {meta.hint}</span>
                    )}
                  </label>
                  {meta.multiline ? (
                    <textarea
                      value={filter.value}
                      onChange={(e) => updateFilter(index, { value: e.target.value })}
                      placeholder="One value per line"
                      rows={3}
                      className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600 resize-y"
                    />
                  ) : (
                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) => updateFilter(index, { value: e.target.value })}
                      placeholder={meta.needsTwoValues ? 'from,to' : 'Value'}
                      className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Field picker dropdown */}
            {showFieldPicker === index && entity && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col">
                <FieldPickerForFilter
                  entity={entity}
                  onSelect={(fieldPath) => handleFieldSelected(index, fieldPath)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldPickerForFilter({ entity, onSelect }) {
  const [selectedFields, setSelectedFields] = useState([]);
  const [search, setSearch] = useState('');

  const handleToggle = (fieldPath) => {
    onSelect(fieldPath);
  };

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 bg-gray-800 p-2 border-b border-gray-700 z-10">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search fields…"
          className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
          autoFocus
        />
      </div>
      <div className="p-2">
        <RelationTreePicker
          entity={entity}
          selectedFields={selectedFields}
          onToggleField={handleToggle}
          searchQuery={search}
        />
      </div>
    </div>
  );
}
