import type { FieldCondition } from "./types.js";

function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((v, i) => deepEqual(v, b[i]));
	}
	return false;
}

/** Whether a field with this condition is shown, given the current values keyed by `action_id`. */
export function evaluateCondition(
	condition: FieldCondition,
	values: Record<string, unknown>,
): boolean {
	const fieldValue = values[condition.field];
	if ("eq" in condition && condition.eq !== undefined) {
		return deepEqual(fieldValue, condition.eq);
	}
	if ("neq" in condition && condition.neq !== undefined) {
		return !deepEqual(fieldValue, condition.neq);
	}
	return true;
}
