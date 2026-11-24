# circle-pack-chart-type Specification

## Purpose

What the package provides as the `circlepack` chart type: how it is registered, what it depends on, and how it follows live changes to data and options.

## Requirements

### Requirement: The circlepack chart type

The package SHALL provide the `circlepack` chart type.

#### Scenario: Script bundle

- **WHEN** the script bundle is loaded after Chart.js
- **THEN** a chart with `type: 'circlepack'` works without registration

#### Scenario: Module build

- **WHEN** the module build is imported
- **THEN** nothing is registered until the user registers the controller and the element

#### Scenario: One element per row

- **WHEN** a scriptable option or an event handler receives a data index
- **THEN** that index is the row's index in the dataset's data, whether or not a circle is drawn for the row

### Requirement: Live changes

Changes to data and options SHALL take effect on the next update, with animation on or off.

#### Scenario: Data mutation

- **WHEN** rows are pushed, spliced or edited in place, or the data array is replaced, and the chart is updated
- **THEN** the chart is the same as a new chart created with that data

#### Scenario: Several insertions

- **WHEN** rows are added by more than one call before the chart is updated
- **THEN** every new circle grows in place

#### Scenario: Resize

- **WHEN** the chart is resized
- **THEN** it is the same as a new chart of that size

#### Scenario: Option change

- **WHEN** `key`, `spacing`, `region` or an element option is changed in place and the chart is updated once
- **THEN** the change is visible

### Requirement: No runtime dependencies

The package SHALL have no runtime dependencies beyond the Chart.js peer.

#### Scenario: Installation

- **WHEN** the package is installed into a project that has Chart.js 4
- **THEN** no other package is added

### Requirement: Legend and default colours follow Chart.js

The legend and the default colours SHALL be those Chart.js gives any dataset.

#### Scenario: Legend

- **WHEN** a chart has two circlepack datasets
- **THEN** the legend has one entry per dataset

#### Scenario: Colours

- **WHEN** no colour is configured
- **THEN** all circles of a dataset share the dataset's default colour
