/**
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

"use strict";
define('modules/flotchart', [
    'jquery',
    'flot',
    'flot_time',
    'flot_symbol',
    'flot_tooltip'
], function($) {
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
            //min: (new Date(new Date().getFullYear(), 0, 0)).getTime(),
            min: calcMin(),
            tickSize: [1, "month"],
            tickLength: 0,
            //label: "2015",
            font: {
                size: 14,
                weight: 500,
                family: '"Open Sans", sans-serif',
                color: '#2c3e50'
            }
        },
        yaxes: [
            {
                font: {
                    size: 14,
                    weight: 500,
                    family: '"Open Sans", sans-serif',
                    color: '#2c3e50'
                },
                tickColor: '#c5cad7',
                tickDecimals: 0
                //ticks: [0, [Math.PI/2, "\u03c0/2"], [Math.PI, "\u03c0"], [Math.PI * 3/2, "3\u03c0/2"], [Math.PI * 2, "2\u03c0"]]
//        tickFormatter: function (v, axis) {
//            return $j.formatNumber(v, { format: "#,###", locale: "us" });
//        }
            }
        ],
        legend: {
            show: false,
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
        tooltip: true,
        tooltipOpts: {
            content: function (label, xVal, yVal, item) {
                var color = "#e74c3c";
                if (label === 'Closed')
                    color = "#2fb150";
                return "<span>%x</span><span style='color: " + color + ";'>%y <span style='font-weight: 300;'>%s</span></span>";
            },
            monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            xDateFormat: "%b, %Y",
            shifts: {
                x: -75,
                y: -75
            }
        },
        colors: ["#e74c3c", "#2fb150"]
    };

    function calcMin() {
        var now = new Date();
        var date = new Date();
        date.setMonth(now.getMonth() - 12);
        return date.getTime();
    }

    return {
        options: options
    }
});
