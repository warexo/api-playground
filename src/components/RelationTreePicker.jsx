import { useState, useCallback, useMemo } from 'react';
import { useEntities } from '../contexts/EntityContext';
import { resolveTargetEntity, getRelationTypeIcon, getTypeBadgeColor } from '../utils/entityUtils';

const MAX_DEPTH = 4;

/**
 * A tree-based field picker that allows navigating through entity columns and relations.
 * Clicking a relation expands the target entity's columns underneath,
 * building dot-notation paths like "categories.title".
 */
export default function RelationTreePicker({ entity, selectedFields, onToggleField, prefix = '', searchQuery = '' }) {
  if (!entity) return null;

  const query = searchQuery.toLowerCase().trim();

  // Filter columns by search query
  const filteredColumns = useMemo(() => {
    const cols = entity.columns || [];
    if (!query) return cols;
    return cols.filter((col) => col.property.toLowerCase().includes(query));
  }, [entity.columns, query]);

  // Filter relations by search query (show relation if its name or target entity matches)
  const filteredRelations = useMemo(() => {
    const rels = entity.relations || [];
    if (!query) return rels;
    return rels.filter(
      (rel) =>
        rel.property.toLowerCase().includes(query) ||
        (rel.targetEntity && rel.targetEntity.toLowerCase().includes(query))
    );
  }, [entity.relations, query]);

  return (
    <div className="text-sm">
      {/* Columns */}
      <ColumnList
        columns={filteredColumns}
        selectedFields={selectedFields}
        onToggleField={onToggleField}
        prefix={prefix}
      />

      {/* Relations */}
      {filteredRelations.length > 0 && (
        <RelationNodes
          relations={filteredRelations}
          selectedFields={selectedFields}
          onToggleField={onToggleField}
          prefix={prefix}
          depth={0}
          parentChain={[]}
        />
      )}

      {/* No results */}
      {query && filteredColumns.length === 0 && filteredRelations.length === 0 && (
        <div className="text-xs text-gray-500 text-center py-2">No fields matching "{searchQuery}"</div>
      )}
    </div>
  );
}

function ColumnList({ columns, selectedFields, onToggleField, prefix }) {
  return (
    <div className="space-y-0.5">
      {columns.map((col) => {
        const fieldPath = prefix ? `${prefix}.${col.property}` : col.property;
        const isSelected = selectedFields.includes(fieldPath);

        return (
          <button
            key={col.property}
            onClick={() => onToggleField(fieldPath)}
            className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left hover:bg-gray-800 transition-colors ${
              isSelected ? 'bg-indigo-600/20' : ''
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                isSelected
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'border-gray-600'
              }`}
            >
              {isSelected && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            <span className={`flex-1 ${isSelected ? 'text-indigo-300' : 'text-gray-300'}`}>
              {col.property}
            </span>

            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getTypeBadgeColor(col.type)}`}>
              {col.type}
              {col.length ? `(${col.length})` : ''}
            </span>

            {col.isPrimaryKey && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">
                PK
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function RelationNodes({ relations, selectedFields, onToggleField, prefix, depth, parentChain }) {
  const { entityIndex } = useEntities();

  if (depth >= MAX_DEPTH || !entityIndex) return null;

  return (
    <div className="mt-1 space-y-0.5">
      {relations.map((rel) => (
        <RelationNode
          key={rel.property}
          relation={rel}
          selectedFields={selectedFields}
          onToggleField={onToggleField}
          prefix={prefix}
          depth={depth}
          parentChain={parentChain}
          entityIndex={entityIndex}
        />
      ))}
    </div>
  );
}

function RelationNode({ relation, selectedFields, onToggleField, prefix, depth, parentChain, entityIndex }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const targetEntity = useMemo(
    () => resolveTargetEntity(relation.targetEntity, entityIndex),
    [relation.targetEntity, entityIndex]
  );

  const fieldPath = prefix ? `${prefix}.${relation.property}` : relation.property;
  const icon = getRelationTypeIcon(relation.type);

  // Only block if this exact entity already appeared twice in the parent chain
  // This allows self-references like parent/children (Category→Category) at least once,
  // while still preventing truly infinite loops. MAX_DEPTH provides the hard limit.
  const targetFqn = targetEntity?._fqn;
  const appearsInChain = targetFqn ? parentChain.filter((fqn) => fqn === targetFqn).length : 0;
  const isBlocked = appearsInChain >= 2 || !targetEntity;

  const handleToggle = useCallback(() => {
    if (!isBlocked && targetEntity) {
      setIsExpanded((prev) => !prev);
    }
  }, [isBlocked, targetEntity]);

  // Count how many selected fields are in this subtree
  const childSelectedCount = selectedFields.filter((f) => f.startsWith(fieldPath + '.')).length;

  return (
    <div>
      <button
        onClick={handleToggle}
        disabled={isBlocked}
        className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors ${
          isBlocked
            ? 'text-gray-600 cursor-not-allowed'
            : 'hover:bg-gray-800 text-gray-300'
        }`}
        style={{ paddingLeft: `${(depth + 1) * 8 + 8}px` }}
      >
        {/* Expand arrow */}
        <svg
          className={`w-3 h-3 flex-shrink-0 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          } ${isBlocked ? 'text-gray-700' : 'text-gray-500'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        {/* Relation icon */}
        <span className="text-xs text-gray-500 w-4 text-center flex-shrink-0">{icon}</span>

        {/* Property name */}
        <span className="flex-1 font-medium">{relation.property}</span>

        {/* Child selection badge */}
        {childSelectedCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
            {childSelectedCount} selected
          </span>
        )}

        {/* Target entity name */}
        <span className="text-xs text-gray-500">
          {targetEntity?.className || relation.targetEntity}
        </span>

        {/* Self-reference indicator */}
        {appearsInChain >= 1 && !isBlocked && (
          <span className="text-[10px] text-indigo-500" title="Self-referencing relation">
            ↻
          </span>
        )}
      </button>

      {/* Expanded children */}
      {isExpanded && targetEntity && !isBlocked && (
        <div className="ml-2 border-l border-gray-800 ml-4">
          <ColumnList
            columns={targetEntity.columns || []}
            selectedFields={selectedFields}
            onToggleField={onToggleField}
            prefix={fieldPath}
          />
          {targetEntity.relations?.length > 0 && (
            <RelationNodes
              relations={targetEntity.relations}
              selectedFields={selectedFields}
              onToggleField={onToggleField}
              prefix={fieldPath}
              depth={depth + 1}
              parentChain={[...parentChain, targetFqn]}
            />
          )}
        </div>
      )}
    </div>
  );
}
