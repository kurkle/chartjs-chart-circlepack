// The pointer over the second circle: its hover options apply, a blue fill and
// a 4 px black ring; the other circles keep their own.
export default {
  config: {
    data: {
      datasets: [
        {
          backgroundColor: 'red',
          data: [6, 6, 4, 3, 2, 2, 1],
          hoverBackgroundColor: 'blue',
          hoverBorderColor: 'black',
          hoverBorderWidth: 4,
          labels: { display: false },
        },
      ],
    },
    type: 'circlepack',
  },
  options: {
    canvas: {
      height: 256,
      width: 512,
    },
    async run(chart) {
      await window.triggerMouseEvent(chart, 'mousemove', chart.getDatasetMeta(0).data[1])
    },
  },
}
