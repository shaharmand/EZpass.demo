# Raw Questions Structure

Questions are organized by:
1. Subject (math, physics, cs)
2. Topic (algebra, geometry, etc)
3. Source (bagrut, mahat)

## Folder Structure
```
rawQuestions/
  math/
    algebra/
      bagrut/
        linear_equations.yaml
        quadratic_equations.yaml
      mahat/
        linear_equations.yaml
    geometry/
      bagrut/
        triangles.yaml
  physics/
    mechanics/
      bagrut/
        motion.yaml
  cs/
    basics/
      bagrut/
        variables.yaml
```

## YAML Format
Each YAML file contains questions in a simple format:

```yaml
- id: bagrut_math_linear_1
  question: |
    פתור את המשוואה:
    $2x + 5 = 13$
  type: multiple_choice
  options:
    - $x = 4$
    - $x = 6$
    - $x = 8$
    - $x = 9$
  correct: 1
  solution: |
    נפתור את המשוואה בשלבים:
    1) $2x + 5 = 13$
    2) $2x = 13 - 5$
    3) $2x = 8$
    4) $x = 4$
  difficulty: 1
``` 