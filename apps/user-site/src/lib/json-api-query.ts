type FilterExpr = string;

export function quote(value: string | number): string {
  return typeof value === "string" ? `'${value}'` : value.toString();
}

export function eq(field: string, value: string | number): FilterExpr {
  return `equals(${field},${quote(value)})`;
}

export function contains(field: string, value: string | number): FilterExpr {
  return `contains(${field},${quote(value)})`;
}

export function and(...exprs: FilterExpr[]): FilterExpr {
  return `and(${exprs.join(",")})`;
}

export function or(...exprs: FilterExpr[]): FilterExpr {
  return `or(${exprs.join(",")})`;
}

export function not(expr: FilterExpr): FilterExpr {
  return `not(${expr})`;
}

export function buildFilterExpr(
  filters: (FilterExpr | undefined | null | false)[],
): string | undefined {
  const valid = filters.filter((f): f is string => typeof f === "string" && f.length > 0);
  if (valid.length === 0) return undefined;
  if (valid.length === 1) return valid[0];
  return and(...valid);
}
