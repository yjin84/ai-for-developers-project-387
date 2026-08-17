---
name: typespec
description: Use when writing, editing, or debugging TypeSpec files (.tsp), tspconfig.yaml, or when generating OpenAPI specs / JSON Schemas / client code from TypeSpec. Covers the `tsp` CLI (init, compile, format, install, code), the TypeSpec language (models, operations, decorators, namespaces), and emitters (@typespec/http, @typespec/openapi3, @typespec/json-schema).
---

# TypeSpec

TypeSpec is a Microsoft-built, community-supported language and toolset for defining data models and service APIs. `.tsp` source files are compiled into artifacts such as OpenAPI v3 specifications, JSON Schemas, and client/server code.

## When to use this skill

- The user has `.tsp` files, `tspconfig.yaml`, or `package.json` with `@typespec/*` dependencies.
- The user wants to describe a REST API / data schema in TypeSpec and emit OpenAPI or JSON Schema.
- The user runs or asks about the `tsp` CLI.

## Key facts

- TypeSpec source files use the `.tsp` extension. The default entrypoint is `main.tsp`.
- The CLI binary is `tsp`, installed via the `@typespec/compiler` npm package.
- Requires Node.js >= 22 and npm >= 7.
- Output is controlled by **emitters** (e.g. `@typespec/openapi3` emits `openapi.yaml`; `@typespec/json-schema` emits JSON Schema files).
- Source code is checked by a compiler with diagnostics; `tsp compile` reports warnings/errors.

## Installation

```sh
npm install -g @typespec/compiler   # global CLI
tsp --version                        # verify
```

Standalone (experimental) install without Node:

```sh
curl -fsSL https://typespec.io/install.sh | bash      # macOS/Linux
powershell -c "irm typespec.io/install.ps1|iex"       # Windows
```

In an npm project, install libraries locally:

```sh
npm install @typespec/compiler @typespec/http @typespec/openapi3 @typespec/json-schema
```

## Project structure

A typical TypeSpec project:

```
main.tsp              # entry point with the API definitions
tspconfig.yaml        # compiler + emitter configuration
package.json          # project metadata and @typespec/* dependencies
node_modules/         # installed dependencies
tsp-output/           # generated output
  @typespec/openapi3/openapi.yaml
```

## tspconfig.yaml

The file is a YAML document. Top-level schema (all optional unless noted):

```yaml
kind: project                  # set to "project" to mark the dir as a project root (only valid in a file named tspconfig.yaml)
entrypoint: main.tsp           # main TypeSpec file; default "main.tsp" (requires kind: project)
extends: ../tspconfig.yaml     # inherit another config
parameters:                    # project parameters, each MUST have a default
  base-dir:
    default: "{cwd}"
output-dir: {project-root}/tsp-output   # default output directory
emit:
  - "@typespec/openapi3"       # emitters to run (package name or path)
options:                       # per-emitter options
  "@typespec/openapi3":
    emitter-output-dir: {output-dir}/@typespec/openapi3
linter:
  extends:
    - "@typespec/best-practices/recommended"
```

Rules to remember:

- `output-dir` must be absolute; use `{cwd}` or `{project-root}` to make it relative to something. Default is `{cwd}/tsp-output`.
- Each emitter's default output is `{output-dir}/{emitter-name}`; override with the `emitter-output-dir` option.
- Emitters can be enabled with `emitter-name: true` inside `options`.
- Variable interpolation uses `{...}`: `{cwd}`, `{project-root}`, `{output-dir}`, `{emitter-name}`, `{env.NAME}`, plus project `parameters`.
- `extends` does a shallow merge (deep merge at one level for `options`); the extending file's values win per-emitter.
- `trace`, `warn-as-error`, `imports`, `dry-run` are also supported (see CLI flags below).
- Linter rule IDs follow `<libraryName>/<ruleName>` (short names allowed). Enable with `true` or an options object; disable with a string reason.

## CLI usage

Run `tsp --help` for authoritative, version-specific output. Core commands:

| Command | Description |
|---|---|
| `tsp compile <path>` | Compile TypeSpec source (emits configured output) |
| `tsp compile . --watch` | Recompile automatically on save |
| `tsp format <files...>` | Format a list of `.tsp` files |
| `tsp init [templatesUrl]` | Create a new TypeSpec project (pick a template, e.g. `Generic REST API`) |
| `tsp install` | Install TypeSpec dependencies declared in the project |
| `tsp info` | Show info about the current TypeSpec compiler |
| `tsp code` | Manage the VS Code extension |

Global options: `--help`, `--debug`, `--pretty` (default true), `--version`.

### tsp compile flags

```sh
tsp compile .                                 # compile using tspconfig.yaml
tsp compile . --watch                         # watch mode
tsp compile . --emit @typespec/openapi3       # run a specific emitter (repeatable)
tsp compile . --no-emit                       # validate only, no emitters
tsp compile . --output-dir "{cwd}/build"      # override output dir
tsp compile . --option "@typespec/openapi3.emitter-output-dir={project-root}/spec"
tsp compile . --config ./tspconfig.alt.yaml   # use another config file
tsp compile . --trace import-resolution       # enable tracing (repeatable)
tsp compile . --warn-as-error                 # warnings become errors (recommended for CI)
tsp compile . --dry-run                       # emitters run without writing files
tsp compile . --import "sidecar.tsp"          # extra imports
tsp compile . --arg "base-dir=/path"          # set a project parameter
```

`--config` cannot point to a config with `kind: project`.

### Environment variables

- `TYPESPEC_NPM_REGISTRY=https://registry.example.com` — npm registry used by `tsp init`/`tsp install` (defaults to `https://registry.npmjs.org`).

## Language quick reference

### Imports and namespaces

```typespec
import "@typespec/http";
using Http;

@service(#{ title: "Pet Store" })
@server("https://example.com", "Single server endpoint")
namespace PetStore;
```

- `import` pulls in a `.tsp` file, `.js` file, or library. `using` brings a namespace into scope.
- The first (top-level) `namespace` uses a semicolon; nested namespaces use braces.
- Declaration names must be unique within a scope.

### Models, enums, scalars

```typespec
model Pet {
  id: int32;

  @minLength(1)
  name: string;

  @minValue(0)
  @maxValue(100)
  age: int32;

  kind: petType;
}

enum petType {
  dog: "dog",
  cat: "cat",
  fish: "fish",
  bird: "bird",
  reptile: "reptile",
}
```

- Inheritance: `model Dog extends Pet {}`; composition: `model Dog {...Animal}`; reuse a model: `model Dog is Another;`.
- Optional property: `owner?: string`; optional with default: `name?: string = "Rex"`.
- Scalars: `scalar Password extends string`; templated: `@doc(T) scalar Password<T extends string>`.
- Validation decorators: `@minLength`, `@maxLength`, `@minValue`, `@maxValue`, `@minItems`, `@maxItems`, `@pattern`.
- Templates: `model Response<T> { value: T }`, with defaults `T = string` and constraints `T extends {id: string}`.

### Operations and HTTP (REST)

The `@typespec/http` library provides the HTTP decorators. Routes, HTTP verbs, path params, bodies, and status codes:

```typespec
@route("/pets")
namespace Pets {
  @get
  op listPets(): {
    @statusCode statusCode: 200;
    @body pets: Pet[];
  };

  @get
  op getPet(@path petId: int32): {
    @statusCode statusCode: 200;
    @body pet: Pet;
  };

  @post
  op createPet(@body pet: Pet): {
    @statusCode statusCode: 201;
    @body newPet: Pet;
  };

  @put
  op updatePet(@path petId: int32, @body pet: Pet): {
    @statusCode statusCode: 200;
    @body updatedPet: Pet;
  };

  @delete
  op deletePet(@path petId: int32): {
    @statusCode statusCode: 204;
  };
}
```

Mapping:

- `@route("/pets")` sets the base path (on an operation or namespace).
- `@get`/`@post`/`@put`/`@delete` (also `@patch`, `@head`) set the HTTP verb.
- `@path` marks a parameter as a path segment; `@query` marks a query parameter; `@body` marks the request/response body; `@header` marks a header.
- `@statusCode` declares the response status code inside an anonymous response model.
- Multiple possible responses use the `|` union operator:
  `op getPet(@path petId: int32): { @statusCode statusCode: 200; @body pet: Pet; } | { @statusCode statusCode: 404; }`.
- Nested namespaces append to the OpenAPI `operationId` (e.g. `Pets_listPets`).
- Resulting URLs: `GET /pets`, `GET /pets/{petId}`, `POST /pets`, `PUT /pets/{petId}`, `DELETE /pets/{petId}`.

### Other language features

- Interfaces group operations: `interface PetStore { list(): Pet[] }`; can `extends` other interfaces and be templated.
- Operations: `op getPet is getter<Pet>;` reuses a template. Return types may be unions: `op health(): HealthStatus | ErrorResponse`.
- Unions: inline `"cat" | "dog"` or named `union Pet { cat: Cat, dog: Dog }`. Intersections: `Pet & Animal`.
- Enums can carry string/int/float values and compose: `enum Direction2D {...Direction, Left, Right}`.
- Aliases: `alias Options = "one" | "two";`. Type literals: strings, multiline `"""..."""`, int, float, boolean.
- Documentation decorators: `@doc("...")`, `@summary("...")`; `@tag("...")` for grouping; `@error` marks an error model.

## Emitters

- `@typespec/openapi3` — emits `openapi.yaml` (OpenAPI v3) from a `@service` namespace. Default output: `{output-dir}/@typespec/openapi3/openapi.yaml`.
- `@typespec/json-schema` — emits JSON Schema documents from models (useful for data validation and tool/function schemas).
- `@typespec/openapi` — legacy OpenAPI v2/v3 (openapi.v2) emitter.
- `@typespec/protobuf`, `@typespec/azure`, and language emitters (C#, Java, TS) exist via `@typespec/*` packages.

Enable emitters in `tspconfig.yaml`:

```yaml
emit:
  - "@typespec/openapi3"
  - "@typespec/json-schema"
options:
  "@typespec/json-schema":
    emitSchemaFile: "{output-dir}/schemas"
```

## Common workflows

### New project

```sh
tsp init            # select the "Generic REST API" template
tsp install         # install dependencies
tsp compile .       # generate tsp-output/@typespec/openapi3/openapi.yaml
tsp compile . --watch
```

### Validate-only (CI)

```sh
tsp compile . --no-emit --warn-as-error
```

### Format

```sh
tsp format main.tsp             # format specific files
tsp format . --check            # (if available) fail on unformatted files
```

## Troubleshooting

- "no emitters" warnings: add an `emit:` entry or pass `--emit`; suppress with `--no-emit`.
- Unexpected output path: emitters write to `{output-dir}/{emitter-name}` by default; check `output-dir` is absolute and `emitter-output-dir` overrides.
- Config not applied: run `tsp compile` from the directory that contains (or is below) `tspconfig.yaml`; the compiler searches the nearest config in the current dir or parents.
- Decorators like `@get` not found: ensure `import "@typespec/http"; using Http;` is present.
- Watch mode ignores JS files that are only imported indirectly.

## Verification

After writing `.tsp` files, always run `tsp compile .` (or `tsp compile <file>`) and fix diagnostics. For formatting checks run `tsp format <files>`.
