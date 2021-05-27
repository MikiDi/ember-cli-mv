# ember-cli-mv

An addon that brings the `mv` command to ember-cli. Moves/renames file and automatically adapts references to them.

### Usage

```
ember mv <type> <source> <destination>
```
The arguments interface aims to be similar to that of [`ember generate`](https://cli.emberjs.com/release/basic-use/cli-commands/#generatemorefiles). Use `<source>` and `<destination>` in the same way as you would specify the path/name argument for `ember generate` 


```
$ ember mv --help
Requested ember-cli commands:

ember move <module-type> <source> <destination> <options...>
  Moves files in an ember-cli project and updates path references.
  aliases: mv
  --dry-run (Boolean) (Default: false)
    aliases: -d
  --verbose (Boolean) (Default: false)
    aliases: -v
  --force (Boolean) (Default: false)
    aliases: -f
  --component-structure (String) (Default: flat)
```

#### Options
| name | description |
| ---- | ----------- |
| dry-run | run and log output without actually executing |
| verbose | log all actions |
| force | overwrite any existing destination files |
| component-structure | the supposed component structure when using `ember mv component` |

#### Example

Given the following app structure:

```
app
├── components
│   └── person.js
│   └── person.hbs
...
```
running
```
ember mv component person people/employee
```
results in

```
app
├── components
│   └── people
│       └── employee.js
│       └── employee.hbs
...
```

### Known limitations

- The pods project-structure should be supported but is currently untested.
- Only `ember mv component` is currently supported. PR's supporting other types welcome!
- Only the 'flat' component-structure (see `ember generate component --help`) is currently supported.
- Imports in test don't get adapted
- Relative imports don't get adapted


### Acknowledgement

Although the scope and API of the addon has changed a bit since, this work is heavily inspired by/based upon [trabus/ember-cli-mv](https://github.com/trabus/ember-cli-mv).
