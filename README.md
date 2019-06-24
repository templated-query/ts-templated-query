# ts-templated-query
Templated Query for TypeScript

## Usage

```typescript
const where = TemplatedQuery.fragments(" where ", " and ");
if (id) {
    where = where.add `CustomerID = ${id}`;
}
if (name) {
    where = where.add `Name like ${name + '%'}`;
}
const q = TemplatedQuery.create `SELECT * FROM Customers ${where}`;

const tq = q.toQuery();

// tq.command = "SELECT * FROM Customers WHERE CustomerID = @p0 AND Name like @p1";
// tq.arguments["@p0"] = id
// tq.arguments["@p1"] = name + %

```

## Benefits

It is easy to compose larger queries without having to worry about formatting.