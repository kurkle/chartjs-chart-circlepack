import type {
  Color,
  CoreChartOptions,
  FontSpec,
  ScriptableAndArray,
  ScriptableContext,
} from 'chart.js'

/** The parsed node of a row: its value, and its centre and packed radius in canvas pixels. */
export type CirclePackDataPoint = { v: number; x: number; y: number; r: number }

/** A part of the chart area, in fractions of it. */
export type CirclePackRegion = { left?: number; top?: number; width?: number; height?: number }

export type CirclePackScriptableContext = ScriptableContext<'circlepack'>

export type CirclePackLabelsOptions = {
  display: boolean
  formatter: (ctx: CirclePackScriptableContext) => string | string[]
  color: Color
  font: Partial<FontSpec>
  padding: number
}

/** The resolved options of one circle. */
export interface CirclePackOptions {
  backgroundColor: Color
  borderColor: Color
  borderWidth: number
  labels: CirclePackLabelsOptions
}

export interface CirclePackControllerDatasetOptions {
  key?: string
  spacing?: number
  region?: CirclePackRegion
  label?: string
  // an array is indexed per circle (circle i is row i): entry i is circle i's, from the start
  // again past its end; key, spacing and region are the dataset's and take neither arrays nor
  // functions
  backgroundColor?: ScriptableAndArray<Color, CirclePackScriptableContext>
  borderColor?: ScriptableAndArray<Color, CirclePackScriptableContext>
  borderWidth?: ScriptableAndArray<number, CirclePackScriptableContext>
  hoverBackgroundColor?: ScriptableAndArray<Color, CirclePackScriptableContext>
  hoverBorderColor?: ScriptableAndArray<Color, CirclePackScriptableContext>
  hoverBorderWidth?: ScriptableAndArray<number, CirclePackScriptableContext>
  labels?: {
    [K in keyof CirclePackLabelsOptions]?: K extends 'formatter'
      ? CirclePackLabelsOptions[K]
      : ScriptableAndArray<CirclePackLabelsOptions[K], CirclePackScriptableContext>
  }
}

declare module 'chart.js' {
  interface ChartTypeRegistry {
    circlepack: {
      chartOptions: CoreChartOptions<'circlepack'>
      datasetOptions: CirclePackControllerDatasetOptions
      defaultDataPoint: number
      metaExtensions: Record<string, never>
      parsedDataType: CirclePackDataPoint
      scales: never
    }
  }
}
