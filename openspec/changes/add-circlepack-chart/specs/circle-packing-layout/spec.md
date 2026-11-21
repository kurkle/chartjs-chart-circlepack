## Purpose

How a `circlepack` dataset turns values into circles: their sizes, their arrangement, and how the arrangement is fitted to the area the dataset draws in.

## ADDED Requirements

### Requirement: Area proportional to value

Each row SHALL be drawn as a circle whose area is proportional to its value, with one scale for the whole dataset.

#### Scenario: Plain numbers

- **WHEN** the data is `[4, 1]`
- **THEN** the first circle's radius is twice the second's

#### Scenario: Objects

- **WHEN** the rows are objects and `key` is `'population'`
- **THEN** each circle is sized by that property

### Requirement: Non-overlapping connected cluster

Circles MUST NOT overlap and SHALL form one connected cluster.

#### Scenario: Touching circles

- **WHEN** `spacing` is 0
- **THEN** every circle touches at least one other circle and no two overlap

#### Scenario: Positive spacing

- **WHEN** `spacing` is 2
- **THEN** neighbouring circles are 4 px apart

#### Scenario: Negative spacing

- **WHEN** `spacing` is -1
- **THEN** neighbouring circles overlap by 2 px and the cluster may reach outside its area

### Requirement: Centred and fitted to the dataset area

The cluster SHALL be centred in the dataset's area and, in whichever of its two orientations fits better, scaled until it touches two opposite sides. With a `spacing` of 0 or more no circle reaches outside the area.

#### Scenario: Single value

- **WHEN** the data is `[1]` in a 512×256 chart area
- **THEN** one circle of diameter 256 is drawn at the centre

#### Scenario: Orientation follows the area

- **WHEN** the data is `[1, 1]` in a wide area
- **THEN** the two circles sit side by side
- **WHEN** the same data is drawn in a tall area
- **THEN** one circle sits above the other

#### Scenario: Wide area

- **WHEN** many values are drawn in an area twice as wide as it is tall
- **THEN** the cluster is wider than it is tall and its circles are larger than they would be in a round cluster

#### Scenario: Region

- **WHEN** a dataset has `region: { left: 0.5, width: 0.5 }`
- **THEN** its cluster is centred in, and confined to, the right half of the chart area

#### Scenario: Region outside the area

- **WHEN** a region reaches outside the chart area
- **THEN** it is clipped to the chart area

#### Scenario: Resize

- **WHEN** the chart is resized
- **THEN** the cluster is fitted to the new area

### Requirement: Deterministic layout

The layout SHALL be deterministic and independent of the order of the rows.

#### Scenario: Same input twice

- **WHEN** the same data is charted twice
- **THEN** every circle has the same position and size in both charts

#### Scenario: Permuted rows

- **WHEN** the rows are given in a different order
- **THEN** each value keeps the same position and size

### Requirement: Undrawable values

Values that cannot be drawn MUST NOT break the chart.

#### Scenario: Zero, negative or non-numeric value

- **WHEN** a value is 0, negative, `null`, NaN, infinite or not a number
- **THEN** no circle is drawn for it and it cannot be hovered
- **THEN** the other circles are laid out as if it were absent

#### Scenario: Nothing to draw

- **WHEN** no value can be drawn, or the data is empty
- **THEN** nothing is drawn and no error is raised
