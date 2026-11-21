## Purpose

How one circle of a `circlepack` chart is drawn, labelled, hit by the pointer and animated.

## ADDED Requirements

### Requirement: Filled circle with an inner border

A circle SHALL be filled, with an optional border drawn inside its edge.

#### Scenario: Border

- **WHEN** `borderWidth` is 4
- **THEN** a 4 px ring in `borderColor` lies inside the circle and neighbouring circles still touch at their outer edges

#### Scenario: Scriptable colour

- **WHEN** `backgroundColor` is a function
- **THEN** it is called per circle with the row as `ctx.raw` and the circle's value and geometry as `ctx.parsed`

#### Scenario: Circle smaller than its spacing

- **WHEN** a circle's radius is not larger than `spacing`
- **THEN** it is not drawn and cannot be hovered

### Requirement: Labels where they fit

A label SHALL be drawn centred in its circle, and only when every line fits inside the circle.

#### Scenario: Label fits

- **WHEN** `labels.display` is true and the text fits
- **THEN** the lines are centred in the circle, horizontally and as a block vertically

#### Scenario: Label does not fit

- **WHEN** a line is wider than the circle at the height it would be drawn
- **THEN** no label is drawn for that circle

#### Scenario: Several lines

- **WHEN** `labels.formatter` returns an array
- **THEN** each entry is drawn as its own line

#### Scenario: Default text

- **WHEN** no formatter is given and the chart has a label for the row
- **THEN** the label is that row label and, on a second line, the value

### Requirement: Round pointer interaction

Pointer interaction SHALL follow the round shape.

#### Scenario: Corner of the bounding box

- **WHEN** the pointer is in a corner of a circle's bounding box but outside the circle
- **THEN** nothing is hovered and no tooltip is shown

#### Scenario: Hover

- **WHEN** a circle is hovered
- **THEN** its `hover*` options apply
- **THEN** the tooltip shows the row's label and value and is anchored at the centre of the circle

### Requirement: Animation from the centre

Circles SHALL animate from and to their own centre.

#### Scenario: First render

- **WHEN** the chart first renders with animation
- **THEN** each circle grows from its centre

#### Scenario: Added row

- **WHEN** a row is added and the chart is updated
- **THEN** its circle grows in place while the others move to make room

#### Scenario: Value change

- **WHEN** a value changes and the chart is updated
- **THEN** the circles move and resize smoothly to the new layout
