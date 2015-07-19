Reports
=======
Schema for Reports
------------------
Shows the schema used in each type of report.

###Types

    1 - User Level Report 
    2 - Group Level Report
    
##User Level Report Format
    {
        uid:        <Number>,   //Unique..Required
        name:       <String>,   //Required
        type:       1,          //Required
        runDate:    <Date>,     //Required..HasDefault
        recurring:  <Boolean>,  //Required..HasDefault
        interval:   <Number>,
        status:     <Number> *  //Required..HasDefault
        data: {                 //Required
            user: <User>,
            period: {
                start: <Date>,
                end: <Date>
            },
            tickets: [<Ticket>]            
        }
    }
    
*** *Status - 0=Active / 1=Inactive / 2=Completed***
