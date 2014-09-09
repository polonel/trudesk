$j = jQuery.noConflict();

var data1 = [
    [gd(2014, 0, 1), 250], [gd(2014, 1, 1), 700], [gd(2014, 2, 1), 550], [gd(2014, 3, 1), 1250],
    [gd(2014, 4, 1), 1050], [gd(2014, 5, 1), 400], [gd(2014, 6, 1), 560], [gd(2014, 7, 1), 620],
    [gd(2014, 8, 1), 1175], [gd(2014, 9, 1), 850], [gd(2014, 10, 1), 1495], [gd(2014, 11, 2), 125]
];

var dataset = [
    { data: data1}
];

function gd(year, month, day) {
    return new Date(year, month, day).getTime();
}

var options = {
    series: {
        lines: {
            show: true,
            lineWidth: 4
        },
        points: {
            radius: 6,
            fill: true,
            fillColor: '#d5dae6',
            show: true
        }
    },
    xaxis: {
        mode: "time",
        min: (new Date(2014,0,0)).getTime(),
        tickSize: [1, "month"],
        tickLength: 0,
        label: "2014",
        font: {
            size: 14,
            weight: 500,
            family: '"Open Sans", sans-serif',
            color: '#2c3e50'
        }
    },
    yaxes: [{
        font: {
            size: 14,
            weight: 500,
            family: '"Open Sans", sans-serif',
            color: '#2c3e50'
        },
        tickColor: '#c5cad7'
        //ticks: [0, [Math.PI/2, "\u03c0/2"], [Math.PI, "\u03c0"], [Math.PI * 3/2, "3\u03c0/2"], [Math.PI * 2, "2\u03c0"]]
//        tickFormatter: function (v, axis) {
//            return $j.formatNumber(v, { format: "#,###", locale: "us" });
//        }
    }
    ],
    legend: {
        noColumns: 0,
        labelBoxBorderColor: "#000000",
        position: "nw"
    },
    grid: {
        hoverable: true,
        borderWidth: 0,
        borderColor: "#633200"
        //backgroundColor: { colors: ["#ffffff", "#EDF5FF"] }
    },
    colors: ["#e74c3c"]
};

$j(document).ready(function() {
    $j.plot($j('#ticketLines'), dataset, options);
});
