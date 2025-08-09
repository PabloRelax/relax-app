// src\lib\checklistkey.ts
export type ChecklistItemType = 'property' | 'special';

/**
 * Creates a consistent progress key for checklist items.
 * Example: "123-property-456"
 */
export const makeProgressKey = (
  taskId: number,
  itemType: ChecklistItemType,
  itemId: string | number
) => `${taskId}-${itemType}-${itemId}`;

/**
 * Parses a progress key back into its parts.
 * Handles UUIDs with dashes for itemId.
 */
export const parseProgressKey = (key: string) => {
  const [taskIdStr, itemType, ...rest] = key.split('-');
  const itemId = rest.join('-'); // supports UUIDs
  return {
    taskId: Number(taskIdStr),
    itemType: itemType as ChecklistItemType,
    itemId,
  };
};
