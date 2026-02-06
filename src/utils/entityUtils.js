/**
 * Normalizes a targetEntity reference from entities.json.
 * Handles three formats:
 *   1. Short name: "Product"
 *   2. FQN without leading backslash: "Aggrosoft\\WAWIBundle\\Entity\\Product"
 *   3. FQN with leading backslash: "\\Aggrosoft\\WAWIBundle\\Entity\\Product"
 *
 * Returns the full key as used in the entities map, or null if not found.
 */
export function resolveTargetEntity(targetEntity, entitiesByClassName) {
  if (!targetEntity) return null;

  // Remove leading backslash
  let normalized = targetEntity.replace(/^\\/, '');

  // If it contains backslashes, it's a FQN - try direct lookup
  if (normalized.includes('\\')) {
    return entitiesByClassName.byFqn?.[normalized] || null;
  }

  // Short name lookup
  return entitiesByClassName.byShortName?.[normalized] || null;
}

/**
 * Builds lookup indexes from the raw entities.json data.
 * Returns { byFqn: { fqn -> entityData }, byShortName: { className -> entityData }, list: [] }
 */
export function buildEntityIndex(rawEntities) {
  const byFqn = {};
  const byShortName = {};
  const list = [];

  for (const [fqn, entity] of Object.entries(rawEntities)) {
    const enriched = { ...entity, _fqn: fqn };
    byFqn[fqn] = enriched;

    // Short name may collide across bundles, store first match
    if (!byShortName[entity.className]) {
      byShortName[entity.className] = enriched;
    }

    list.push(enriched);
  }

  // Sort list alphabetically by className
  list.sort((a, b) => a.className.localeCompare(b.className));

  return { byFqn, byShortName, list };
}

/**
 * Groups entities by bundle name.
 */
export function groupByBundle(entityList) {
  const groups = {};
  for (const entity of entityList) {
    const bundle = entity.bundle || 'Other';
    if (!groups[bundle]) groups[bundle] = [];
    groups[bundle].push(entity);
  }
  return groups;
}

/**
 * Gets the API-compatible entity name (lowercase className).
 * e.g. "Product" -> "product", "VendorProduct" -> "vendorproduct"
 */
export function getEntitySlug(entity) {
  return (entity.className || '').toLowerCase();
}

/**
 * Given a relation and the entity index, resolves the target entity data.
 */
export function getRelationTarget(relation, entityIndex) {
  return resolveTargetEntity(relation.targetEntity, entityIndex);
}

/**
 * Returns a human-readable label for a relation type.
 */
export function getRelationTypeLabel(type) {
  const labels = {
    ManyToOne: '→ Many-to-One',
    OneToMany: '← One-to-Many',
    ManyToMany: '↔ Many-to-Many',
    OneToOne: '⇄ One-to-One',
  };
  return labels[type] || type;
}

/**
 * Returns a short arrow icon for a relation type.
 */
export function getRelationTypeIcon(type) {
  const icons = { ManyToOne: '→', OneToMany: '←', ManyToMany: '↔', OneToOne: '⇄' };
  return icons[type] || '?';
}

/**
 * Column type badge color mapping.
 */
export function getTypeBadgeColor(type) {
  const colors = {
    string: 'bg-blue-500/20 text-blue-300',
    integer: 'bg-green-500/20 text-green-300',
    decimal: 'bg-green-500/20 text-green-300',
    float: 'bg-green-500/20 text-green-300',
    boolean: 'bg-yellow-500/20 text-yellow-300',
    datetime: 'bg-purple-500/20 text-purple-300',
    date: 'bg-purple-500/20 text-purple-300',
    text: 'bg-orange-500/20 text-orange-300',
    json: 'bg-pink-500/20 text-pink-300',
    array: 'bg-pink-500/20 text-pink-300',
    object: 'bg-pink-500/20 text-pink-300',
    blob: 'bg-gray-500/20 text-gray-300',
  };
  return colors[type] || 'bg-gray-500/20 text-gray-300';
}
