//make sure all datetime_obj_to_iso is input with date object.
//make sure all newDate make the string safari safe

// Get the days of the week when a course meets for recurrence rule
function get_byday(course) {
    const byday = [];
    //if a course doesn't meet on a specific day course.THATDAY will be null, so if it !== it means it meets that day
    if (course.MONDAY !== null) {
        byday.push("MO");
    }
    if (course.TUESDAY !== null) {
        byday.push("TU");
    }
    if (course.WEDNESDAY !== null) {
        byday.push("WE");
    }
    if (course.THURSDAY !== null) {
        byday.push("TH");
    }
    if (course.FRIDAY !== null) {
        byday.push("FR");
    }
    if (course.SATURDAY !== null) {
        byday.push("SA");
    }
    if (course.SUNDAY !== null) {
        byday.push("SU");
    }
    return byday;
}

// Convert a datetime obj to ISO format. Accepts YYYY-MM-DD or YYYYMMDD
function datetime_obj_to_iso(datetime) {
    try{
        var datetime_iso;
        datetime_iso = datetime.toISOString().replace(/-/g,"").replace(/:/g, "");
        const split_arr = datetime_iso.split(".");
        datetime_iso = split_arr[0] + "Z";
        return datetime_iso;
    } catch(error){}
}

function datestring_to_date_safari_safe(datestring){
    const date_obj = new Date(datestring.replace(/-/g, '/'));
    return date_obj;
}

// Convert a datetime string to a date string (YYYYMMDD)
// function datetime_to_date(datetime) {
//     const iso_datetime = datetime_to_iso(datetime);
//     const datetime_arr = iso_datetime.split("T");
//     const date = datetime_arr[0].replace(/-/g,"");
//     return date;
// }

// Convert a datetime string to a date string with dashes (YYYY-MM-DD).
function datetime_to_date_dashes(datetime) {
    const iso_datetime = datetime_obj_to_iso(datetime);
    const datetime_arr = iso_datetime.split("T");
    const date = datetime_arr[0];
    //add dashes
    const split_date = date.split("");
    split_date.splice(4,0,"-");
    split_date.splice(7,0,"-");
    const date_with_dashes = split_date.join("");
    return date_with_dashes;
}//https://www.youtube.com/watch?v=qdRFDefKFx4

// Get a list of days off from the academic calendar for a specific course
function get_days_off(academic_calendar, course) {
    const days_off = [];
    academic_calendar.forEach (day => {
        //catch early dismissals
        if (day.event.includes("dismiss at"))
        {
            //regex to catch any time and pm/am
            const regex = /(0?[0-9]|1[0-9]|2[0-3]).*[A-Za-z]+/i;
            //get the part of the summary with relevant time information
            const day_summary = day.event.match(regex);
            
            //fix formatting to be valid for converting time + am/pm to a date object
            const rid_words = day_summary[0].split(":");
            const split_time_and_am_pm = rid_words[0].split(" ");
            const time = split_time_and_am_pm[0];
            const am_or_pm = split_time_and_am_pm[1];
            const time2 = "0" + time + ":00" + " " + am_or_pm.replace(".", "").toUpperCase();
            const time3 = time2.replace(".", "");
            //const fixed_date_format = fixed_date_format(day.startdate);
            const date = day.startdate + " " + time3;
            const early_dismissal = datestring_to_date_safari_safe(date);
            
            const course_start = datestring_to_date_safari_safe(day.startdate  + " " + course.STARTTIME);
            //if class.STARTTIME is after early dismissal time, then add course day/start time for that day to exclusions
            if (course_start >= early_dismissal )
            {
                days_off.push(datetime_obj_to_iso(datestring_to_date_safari_safe(day.startdate  + " " + course.STARTTIME)));
            }
            //it doesnt matter if the course meets that day or not as we are excluding it
            //ex: if its monday 1pm dismissal and we exclude a tuesday class, it doesnt change anythings
        }
        //get all single days off/breaks with multiple days off
        else if (day.event.includes("No classes")) 
        {
            
            const start_break = datestring_to_date_safari_safe(day.startdate + " " + course.STARTTIME);
            let end_break = new Date();
            if (day.enddate === ""){
                const one_day_off = datestring_to_date_safari_safe(day.startdate + " " + course.STARTTIME);
                end_break = one_day_off.setDate(one_day_off.getDate());
            }
            else {
                end_break = datestring_to_date_safari_safe(day.enddate + " " + course.STARTTIME);
            }
            for (let date = start_break; date <= end_break; date.setDate(date.getDate() + 1))
            {
                const day_to_push = new Date(date); //date is already a date obj
                // debugger;
                days_off.push(datetime_obj_to_iso(day_to_push));
            }
        } 
    });
    return days_off;
    
}

//flop days == any day where the courses that are supposed to meet switch for another day

// Get a list of flop days from the academic calendar for a specific course
// If new flop days not covered below are added, they should be added and accounted in get_flop_inclusions and
// get_flop_exclusions
function get_flop_days(academic_calendar, course, term_string) {
    const flop_days = [];
    academic_calendar.forEach (day => {
        const flop_day = datetime_obj_to_iso(datestring_to_date_safari_safe(day.startdate + " " + course.STARTTIME));
        if (day.term == term_string){
            if (day.event.includes("Friday classes meet (not Tuesday classes)")) {
                flop_days.push([flop_day, "FridayNotTuesday"]);
            } 
            else if (day.event.includes("Monday classes meet (not Tuesday classes)")) {
                flop_days.push([flop_day, "MondayNotTuesday"]);
            } 
            else if (day.event.includes("Tuesday classes meet (not Thursday classes)")) {
                flop_days.push([flop_day, "TuesdayNotThursday"]);
            }
            else if (day.event.includes("Monday classes meet (not Thursday classes)")) {
                flop_days.push([flop_day, "MondayNotThursday"]);
            } 
        }
    });
    return flop_days;
}

// Get flop exclusions for a specific course, 
function get_flop_exclusions(course, flop_days) {
    const flop_exclusions = [];
    flop_days.forEach(flop_day => {
        if (flop_day[1] == "MondayNotTuesday" && course.TUESDAY !== null) {
            flop_exclusions.push(flop_day[0]);
        } else if (flop_day[1] == "FridayNotTuesday" && course.TUESDAY !== null) {
            flop_exclusions.push(flop_day[0]);
        } else if (flop_day[1] == "TuesdayNotThursday" && course.THURSDAY !== null) {
            flop_exclusions.push(flop_day[0]);
        } else if (flop_day[1] == "MondayNotThursday" && course.THURSDAY !== null) {
            flop_exclusions.push(flop_day[0]);
        }
    });
    return flop_exclusions;
}

// Get flop inclusions for a specific course
function get_flop_inclusions(course, flop_days) {
    const flop_inclusions = [];
    flop_days.forEach(flop_day => {
        
        if (flop_day[1] == "MondayNotTuesday" && course.MONDAY !== null) {
            flop_inclusions.push(flop_day[0]);
        } else if (flop_day[1] == "FridayNotTuesday" && course.FRIDAY !== null) {
            flop_inclusions.push(flop_day[0]);
        } else if (flop_day[1] == "TuesdayNotThursday" && course.TUESDAY !== null) {
            flop_inclusions.push(flop_day[0]);
        } else if (flop_day[1] == "MondayNotThursday" && course.MONDAY !== null) {
            flop_inclusions.push(flop_day[0]);
        }
    });
    return flop_inclusions;
}

// Get the start date and time for a specific course
function get_start_date_begin(course) {
    const first_day_start = datetime_obj_to_iso(course.START_DATE + " " + course.STARTTIME);
    return first_day_start;
}

// Get the end date and time for a specific course
function get_start_date_end(course) {
    const first_day_end = datetime_obj_to_iso(datestring_to_date_safari_safe(course.START_DATE + " " + course.ENDTIME));
    return first_day_end;
}

// Get the end date and time for recurrence rule
function get_end_date_recurrence(course) {
    const last_day_of_class = datetime_obj_to_iso(datestring_to_date_safari_safe(course.END_DATE + " " + course.ENDTIME));
    return last_day_of_class;
}

// Get the base recurrence for a specific course
// Cant include inclusions here as if it is empty it will throw an error
function get_base_recurrence(end_of_recurrence, byday, days_off, flop_exclusions) {
    //exdate,rrule, and rdate must be in same format (datetime) to be respected
    var recurrence;
    if (flop_exclusions.length == 0){
        recurrence = ["RRULE:FREQ=WEEKLY;UNTIL=" + end_of_recurrence + ";BYDAY=" + byday, 
                            "EXDATE;VALUE=DATE-TIME:" + days_off + ","];  
    }
    else{
        recurrence = ["RRULE:FREQ=WEEKLY;UNTIL=" + end_of_recurrence + ";BYDAY=" + byday, 
                            "EXDATE;VALUE=DATE-TIME:" + days_off + "," + flop_exclusions + ","];  
    }
    return recurrence;
}

// Find the earliest day in the banner schedule to fetch proper days of academic calendar 



// function prune_academic_calendar(acadmic_calendar, terms){ //get the sessions we need we need from academic calendar

// for (const day of academic_calendar){
//     if (true)
// }
// }

// Generate event information for a specific course
function generate_inperson_event_info(course, academic_calendar,term_string) {
    // console.log(course);
    
    if (course.ASYNCHRONOUS == true){ //if its an async class just skip it, it cant go on the Google Calendar anyways
        return null;
    }
    
    const days_off = get_days_off(academic_calendar, course);
    const flop_days = get_flop_days(academic_calendar, course, term_string);
    const flop_inclusions = get_flop_inclusions(course, flop_days);
    const flop_exclusions = get_flop_exclusions(course, flop_days);
    
    const end_date_recurrence = get_end_date_recurrence(course);
    const byday = get_byday(course);
    const recurrence = get_base_recurrence(end_date_recurrence, byday, days_off, flop_exclusions);
    
    const event_id = course.TERM + course.CRN + (course.STARTTIME + course.ENDTIME).replace(/[^a-v0-9]/g, "");
    
    
    // if there are any inclusions add them to the recurrence array
    if (flop_inclusions.length > 0 ) {
        recurrence.push("RDATE;VALUE=DATE-TIME:" + flop_inclusions);
        
    }

    
    //courses always start on Tuesday, so if its not a Tuesday course, make sure it isnt put on the first day
    if (course.TUESDAY === null) {
        recurrence[1] = recurrence[1] + datetime_obj_to_iso(datestring_to_date_safari_safe(course.START_DATE + " " + course.STARTTIME));
    }
    const event = {
        summary: course.COURSE + " - " + course.BUILDING + " " + course.ROOM,
        start_datetime: datetime_obj_to_iso(datestring_to_date_safari_safe(course.START_DATE + " " + course.STARTTIME)),
        end_datetime: datetime_obj_to_iso(datestring_to_date_safari_safe(course.START_DATE + " " + course.ENDTIME)),
        recurrence: recurrence,
        event_id: event_id,
        status: "confirmed",
        patch: true,
        //event_id is unique identifier, term + CRN should always be unique
    };
    return event;
}
function post_inperson_courses(banner_schedule, academic_calendar,term_string) {
    const events = [];
    for (const course of banner_schedule) {
        const event = generate_inperson_event_info(course, academic_calendar,term_string); //get info to send for indiviual course
        if (event){
            events.push(event);
        }
        console.log(event);
    }

    post_to_gcal(events,true);
   
};

function post_inperson_calendar(academic_calendar, term_string){
    const all_academic_calendar_days = []
    for (const day of academic_calendar){
        if (day.term == term_string){
            
            //Get proper end and start of all day events
            const start_date = datestring_to_date_safari_safe(day.startdate);
            let end_date = new Date();
            if (day.enddate === ""){
                end_date = datestring_to_date_safari_safe(day.startdate);
            }
            else {
                end_date = datestring_to_date_safari_safe(day.enddate);
                end_date.setDate(end_date.getDate() + 1);
            }

            const str = day.term + day.startdate + day.event; //get unique identifier
            const rem_str = str.replace(/[^a-v0-9]/g, ""); //32bit hex encoding only accepts [a-v] and [0-9]
            const final_id = rem_str.toLowerCase(); //32bit hex encoding only supports lowercase letters
            
            //need start_date and end_date added to google calendar api wrapper
            event = {
                summary: day.event,
                start_datetime: datetime_to_date_dashes(start_date),
                end_datetime: datetime_to_date_dashes(end_date),
                event_id: final_id,
                status: "confirmed",
                patch: true,        
                
            };
            all_academic_calendar_days.push(event);
        }
    }
    post_to_gcal(all_academic_calendar_days,false);
}


function generate_online_event_info(course){
    if (course.ASYNCHRONOUS == true){ //if its an async class just skip it, it cant go on the Google Calendar anyways
        return null;
    }
    const start_date_begin = get_start_date_begin(course);
    const start_date_end = get_start_date_end(course);
    const end_date_recurrence = get_end_date_recurrence(course);
    const byday = get_byday(course);
    
    const recurrence = ["RRULE:FREQ=WEEKLY;UNTIL=" +end_date_recurrence+ ";BYDAY=" + byday];  

    
    // //courses always start on Tuesday, so if its not a Tuesday course, make sure it isnt put on the first day
    // if (course.TUESDAY === null) {
    //     recurrence[1] = recurrence[1] + datetime_to_iso(new Date(course.START_DATE + " " + course.STARTTIME));
    // }
    const event = {
        summary: course.COURSE + " - " + course.BUILDING + " " + course.ROOM,
        start_datetime: start_date_begin,
        end_datetime: start_date_end,
        recurrence: recurrence,
        event_id: course.TERM + course.CRN,
        status: "confirmed",
        patch: true,
        //event_id is unique identifier, term + CRN should always be unique
    };
    return event;
}

function post_online_courses(banner_schedule) {
    const events = [];
    for (const course of banner_schedule) 
    {
        const event = generate_online_event_info(course); //get info to send for indiviual course
        if (event)
        {
            events.push(event);
        }
    }
    post_to_gcal(events,true);
};


function post_online_calendar(academic_calendar, term_string,session_codes){ 
    const all_online_academic_calendar_days = []
    for (const day of academic_calendar){
        if (day.term == term_string && session_codes.includes(day.session_code)){
            const str = day.term + day.date + day.event; //get unique identifier
            const rem_str = str.replace(/[^a-v0-9]/g, ""); //32bit hex encoding only accepts [a-v] and [0-9]
            const final_id = rem_str.toLowerCase(); //32bit hex encoding only supports lowercase letters
            
            //need start_date and end_date added to google calendar api wrapper
            event = {
                summary: day.event,
                start_datetime: datetime_to_date_dashes(datestring_to_date_safari_safe(day.date)),
                end_datetime: datetime_to_date_dashes(datestring_to_date_safari_safe(day.date)),
                event_id: final_id,
                status: "confirmed",
                patch: true,        
                
            };
            all_online_academic_calendar_days.push(event);
        }
    }
    post_to_gcal(all_online_academic_calendar_days,false);
}

function post_to_gcal(events,course){
    const interval = 1500; //how much time should the delay between two iterations be to help combat rate limiting from Google API
    var promise = Promise.resolve(); //method to pause between iterations
    events.forEach(function (event) {
        promise = promise.then(function () {
            app.post('my_calendar', event, function (response) {//post event to calendar
                if (course == true){console.log(response);}
                try{ //needs to be in a try/catch b/c if theres no error, theres no error code and error will be thrown
                    if(response.error.code === 409){ //409 == requested identifier already exists on student calendar, so update it with newest information
                        app.alert("It seems that "+ event.summary + " is/was on your calendar. Let's see if we can fix something about it for you");
                        app.put('my_calendar', event, function (response) { 
                            //console.log(response);//google calendar update call
                        });
                    }
                    else {
                        console.error('An unexpected error occurred:', error.message);
                        // Handle other unexpected errors
                    }
                }catch(error){
                    if (course){
                        app.alert(event.summary + " was added to your Google Calendar.");
                    }
                    }
                
            });
            return new Promise(function (resolve) {
                setTimeout(resolve, interval);
            });
        });
    });
    promise.then(function () {}); 
}

function set_up_inperson(term_code, term_string, async_courses, sync_courses){
    if (async_courses.length > 0 || sync_courses.length > 0)
    { //if there are any classes to display
        app.data.async_courses = async_courses;
        app.data.sync_courses = sync_courses;
        app.data.display_term = term_string + " Course Schedule - In Person";
        app.data.course_day_key = "M = Monday, T = Tuesday, W = Wednesday, R = Thursday, F = Friday ";
        app.update();
    }
    else
    { //if youre not registered yet
        app.data.not_registered_yet = "It appears you are not yet registered for any " + term_string + " classes.";
        app.data.display_term = term_string + " Course Schedule - In Person";
        app.update();
    }
}

function set_up_online(term_code, term_string, async_courses, sync_courses){
    if (async_courses.length > 0 || sync_courses.length > 0){ //if there are any classes to display
            app.data.not_registered_yet = "";
            app.data.async_courses = async_courses;
            app.data.sync_courses = sync_courses;
            app.data.display_term = term_string + " Course Schedule - Online";
            app.data.course_day_key = "M = Monday, T = Tuesday, W = Wednesday, R = Thursday, F = Friday ";
            app.update();
        }
    else{ //if youre not registered yet
        app.data.not_registered_yet = "It appears you are not yet registered for any " + term_string + " classes.";
        app.data.display_term = term_string + " Course Schedule - Online";
        app.update();
        }
}


function auto_set_student_type(){
    if (_.has(app.data.user.tags,'is_student') && app.data.user.tags.is_student[0] == 'true') {
        student_type = 'inperson';
    } else if (_.has(app.data.user.tags,'is_online_student') && app.data.user.tags.is_online_student[0] == 'true') {
        student_type = 'online';
    }
    app.form('user_selection').set({student_type:student_type});
    return student_type
}

function display_courses(banner_schedule,student_type,term_code,term_string){
    var async_courses = [];
    var sync_courses = [];
    for (const course of banner_schedule)
    {
        if (course.STARTTIME === null){ //if its an async class just skip it, it cant go on the Google Calendar anyways
            course.ASYNCHRONOUS = true;
            async_courses.push(course);
        }
        else{
            course.ASYNCHRONOUS = false;
            sync_courses.push(course);
        }
    }
    if (student_type == "inperson")
    {
        set_up_inperson(term_code, term_string, async_courses, sync_courses);
    }

    else if (student_type == "online")
    {
        set_up_online(term_code, term_string, async_courses, sync_courses);
    }
    
}

function clear_display()
{
    app.data.banner_schedule = ""; 
    app.data.async_courses = "";
    app.data.sync_courses = ""; 
    app.data.course_day_key = "";
    app.data.not_registered_yet = "";
    app.data.banner_schedule = "";
}

function get_term_string(term_code)
{
    var term_string;
    const labels = app.form('user_selection')._items[1].list;
    for (const i in labels){
        if(labels[i].value == term_code){
            term_string = labels[i].label;
            break;
        }
    }
    return term_string;
}

