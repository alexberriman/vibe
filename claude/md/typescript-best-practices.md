## TypeScript Guidelines

- Use explicit, precise types — avoid `any`; prefer `unknown` if necessary
- Model data with `interface` or `type`, and use `readonly` where applicable
- Prefer `import type { X } from "pkg"` to keep value/runtime scope clean
- Use **union types**, **generics**, and **discriminated unions** for expressive modeling
- Create **branded types** for domain primitives (e.g. `UserId`, `Currency`)
- Use **template literal types** to validate structured strings
- Implement **conditional types** for flexible, reusable APIs
- Define **polymorphic components** using `as` prop and generic `ElementType`
- Enforce **strict mode** in `tsconfig.json`
- Keep types close to usage — extract only when reused or complex

### Additional Practices

- Use `Omit`, `Pick`, `Partial`, `Required`, and mapped types for clean composition
- Prefer utility types over manual duplication
- Flatten deep type nesting — keep type shapes maintainable
- Use `Record<K, V>` for well-defined key-value maps
- Avoid overly clever or deeply recursive types — prioritize readability
- Use **primitive types** (`string`, `number`, `boolean`) over object types (`String`, `Number`, etc.)
- Always specify **explicit return types** for functions
- Use `void` as return type for callbacks that don't return anything
- Avoid optional parameters in callbacks unless necessary
- Place more specific overloads **before** more general ones
- Use union types instead of overloads when only parameter types vary
- Avoid declaring generics if the type parameter isn’t used
