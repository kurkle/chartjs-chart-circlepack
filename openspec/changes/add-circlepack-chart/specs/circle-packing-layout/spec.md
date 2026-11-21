## Purpose

How a `circlepack` dataset turns values into circles: their sizes, their arrangement, and how the arrangement is fitted to the area the dataset draws in.

## ADDED Requirements

### Requirement: Area proportional to value

Each row SHALL be laid out as a circle whose area is proportional to its value, with one scale for the whole dataset. `spacing` then reduces every drawn radius by the same amount.

#### Scenario: Plain numbers

- **WHEN** the data is `[4, 1]`
- **THEN** the first circle's radius is twice the second's

#### Scenario: With spacing

- **WHEN** the data is `[4, 1]` and `spacing` is 2
- **THEN** each drawn radius is 2 px smaller than it is with `spacing` 0

#### Scenario: Objects

- **WHEN** the rows are objects and `key` is `'population'`
- **THEN** each circle is sized by that property

#### Scenario: Default key

- **WHEN** the rows are objects and no `key` is given
- **THEN** each circle is sized by the row's `value` property

#### Scenario: Missing property

- **WHEN** a row has no such property
- **THEN** it is treated as a value that cannot be drawn

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
- **THEN** neighbouring circles overlap by 2 px and the cluster may reach outside its area, but nothing is drawn outside the chart area

### Requirement: Centred and fitted to the dataset area

The cluster SHALL be centred in the dataset's area and, in whichever of its two orientations fits better, scaled until, before the spacing inset, it touches two opposite sides. The dataset's area is the chart area unless a `region` is given. With a `spacing` of 0 or more no circle reaches outside the area.

#### Scenario: Single value

- **WHEN** the data is `[1]` in a 512×256 chart area with `spacing` 0
- **THEN** one circle of diameter 256 is drawn at the centre

#### Scenario: Orientation follows the area

- **WHEN** the data is `[1, 1]` in a wide area
- **THEN** the two circles sit side by side
- **WHEN** the same data is drawn in a tall area
- **THEN** one circle sits above the other

#### Scenario: Region

- **WHEN** a dataset has `region: { left: 0.5, width: 0.5 }` and a `spacing` of 0 or more
- **THEN** its cluster is centred in, and confined to, the right half of the chart area

#### Scenario: Region fractions

- **WHEN** a region gives only some of `left`, `top`, `width` and `height`
- **THEN** they are fractions of the chart area, `left` and `top` default to 0, and `width` and `height` default to the rest

#### Scenario: Two datasets without regions

- **WHEN** a chart has two datasets and neither has a region
- **THEN** both clusters fill the chart area and the second is drawn over the first

#### Scenario: Region outside the area

- **WHEN** a region reaches outside the chart area
- **THEN** the cluster is fitted to the part of the region inside the chart area

#### Scenario: Resize

- **WHEN** the chart is resized
- **THEN** the cluster is fitted to the new area

### Requirement: Cluster follows the shape of the area

The cluster SHALL be shaped toward the proportions of the area it is drawn in. This shows with enough values; a dataset of a few values stays round or nearly round.

#### Scenario: Wide area

- **WHEN** 200 values are drawn in an area twice as wide as it is tall
- **THEN** the cluster is wider than it is tall, and the circles cover more of the area than the same circles arranged as a round cluster would

#### Scenario: Tall area

- **WHEN** the same 200 values are drawn in an area twice as tall as it is wide
- **THEN** the cluster is taller than it is wide, and the circles cover more of the area than a round cluster would

#### Scenario: Few values

- **WHEN** a dataset of a few values is drawn
- **THEN** its cluster is round or nearly round, whatever the proportions of the area

#### Scenario: Square area

- **WHEN** the values are drawn in an exactly square area
- **THEN** the cluster is the round cluster

#### Scenario: Nearly square area

- **WHEN** the values are drawn in an area that is nearly square
- **THEN** the cluster is nearly round

### Requirement: Deterministic layout

The layout SHALL be deterministic and independent of the order of the rows.

#### Scenario: Same input twice

- **WHEN** the same data is charted twice
- **THEN** every circle has the same position and size in both charts

#### Scenario: Permuted rows

- **WHEN** the rows are given in a different order
- **THEN** the chart shows the same set of circles; rows with equal values may have swapped places

### Requirement: Undrawable values

Values that cannot be drawn MUST NOT break the chart.

#### Scenario: Zero, negative or non-numeric value

- **WHEN** a value is 0, negative, `null`, NaN, infinite or not a number
- **THEN** no circle is drawn for it and it cannot be hovered
- **THEN** the other circles are laid out as if it were absent

#### Scenario: Nothing to draw

- **WHEN** no value can be drawn, or the data is empty
- **THEN** nothing is drawn and no error is raised
