## Purpose

How one circle of a `circlepack` chart is drawn, labelled, hit by the pointer and animated.

## ADDED Requirements

### Requirement: Filled circle with an inner border

A circle SHALL be filled, with an optional border drawn inside its edge.

#### Scenario: Default border

- **WHEN** no border is configured
- **THEN** each circle has a 1 px border in the chart's border colour, so that touching circles of one colour can be told apart

#### Scenario: No border

- **WHEN** `borderWidth` is 0
- **THEN** no border is drawn

#### Scenario: Border

- **WHEN** `borderWidth` is 4
- **THEN** a 4 px ring in `borderColor` lies inside the circle and neighbouring circles still touch at their outer edges

#### Scenario: Scriptable colour

- **WHEN** `backgroundColor` is a function
- **THEN** it is called per circle with the row as `ctx.raw` and the circle's value and geometry as `ctx.parsed`

#### Scenario: Colour array

- **WHEN** `backgroundColor`, `borderColor`, `borderWidth`, `hoverBackgroundColor`, `hoverBorderColor`, `hoverBorderWidth`, `labels.color`, `labels.display`, `labels.font` or `labels.padding` is an array, or a function that returns one
- **THEN** circle `i` takes entry `i`, starting again from the first entry past the end

#### Scenario: Dataset options are not per circle

- **WHEN** `key`, `spacing` or `region` is an array or a function
- **THEN** it is neither indexed nor called

#### Scenario: Scriptable colour in the legend

- **WHEN** the legend is shown and `backgroundColor` is a function of `ctx.raw`
- **THEN** the legend entry has the colour of the first circle

#### Scenario: Circle smaller than its spacing

- **WHEN** a circle's radius is not larger than `spacing`
- **THEN** it is not drawn and cannot be hovered

### Requirement: Labels where they fit

A label SHALL be drawn centred in its circle, and only when every line fits inside the circle. A row's label is the chart's label for that row.

#### Scenario: Label fits

- **WHEN** nothing about labels is configured and the text fits
- **THEN** the lines are centred in the circle, horizontally and as a block vertically

#### Scenario: Labels off

- **WHEN** `labels.display` is false
- **THEN** no label is drawn

#### Scenario: Label does not fit

- **WHEN** a line is wider than the circle at the height it would be drawn
- **THEN** no label is drawn for that circle

#### Scenario: Several lines

- **WHEN** `labels.formatter` returns an array
- **THEN** each entry is drawn as its own line

#### Scenario: Default text

- **WHEN** no formatter is given and the chart has a label for the row
- **THEN** the label is that row label and, on a second line, the value

#### Scenario: Row label of several lines

- **WHEN** no formatter is given and the chart's label for the row is an array
- **THEN** each entry of that label is its own line, and the value is on the line after them

#### Scenario: No row label

- **WHEN** no formatter is given and the chart has no label for the row
- **THEN** the label is the value alone, even if the row is an object with a name of its own

#### Scenario: Hiding one label

- **WHEN** `labels.display` is a function that returns false for a circle, or the formatter returns an empty string, null or nothing
- **THEN** that circle has no label and the others keep theirs

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
- **THEN** the circles move and resize to the new layout over the animation's duration
