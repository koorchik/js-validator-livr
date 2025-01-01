## CHANGELOG

v2.8.1

-   Add basic types for typescript

v2.7.1

-   300-500% faster validator construction. Useful when you construct new Validator for each validation.
-   Remove "camelizeRules" option. Now it is always enabled but does not overried existing rules if there is a conflict.

v2.7

-   25% faster validation comparing to v2.5
-   Automatically camelize default rules (both names can be used in schemas)
-   Validator constructor now accepts "options" object. Required for future options extensability
