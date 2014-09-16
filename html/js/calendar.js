$j = jQuery.noConflict();

$j(document).ready(function() {
    $j("#calendar").fullCalendar({
        //aspectRatio: 1.5
        events: [
            {
                title: 'Ticket #1234 - Planning',
                start: '2014-09-13'
            },
            {
                title: 'Ticket #1236 - Administration',
                start: '2014-09-15',
                end: '2014-09-17',
                allDay: true
            }
        ]
    });
});