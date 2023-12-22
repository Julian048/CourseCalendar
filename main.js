//default display
app.data.display_term = "You have not selected your options yet.";
app.data.course_day_key = "";


//busy paramter on all day events should be taken
//maybe addition of color paramter
//


// do 7 weeks always start on tuesday and do 15 weeks always start on monday? does that even matter? -> can assume

app.callback = function() {
    //variables
    var student_type, term_code, term_string, form_data, session_codes;
    var banner_schedule = null;
    //end 
    
    //when someone presses save, do what the app should be doing
    app.form('user_selection').on('save',function(event) {
        if (event.form.validate()) {
            clear_display(); //reset app data so it doesnt linger in html/css
    
            //get form data we need, term_code, student_type, 
            form_data = event.form.get();
            student_type = form_data.student_type;
            term_code = form_data.termcode || form_data.online_termcode;
            session_codes = form_data.session_codes;
            //end
            
            term_string = get_term_string(term_code); //get term_string based on term_code selected
            
            app.get('banner_schedule',{term:term_code},function(response){
                banner_schedule = response;
                app.data.banner_schedule = banner_schedule;
                display_courses(banner_schedule,student_type,term_code,term_string); //set up html/css for student_type
            });
            
            event.form.trigger("close");
        }
 
    }) //end on save behavior
    
    //if they press cancel dont do anything
    .on('cancel',function(event) {
        event.form.trigger('close');
    });
    //end on cancel behavior
    
    //auto-set student_type and open up form. This is the actual click of the button rather than save behavior
    app.click('.select-options-btn',function(event) {
        //student_type = "online";
        student_type = auto_set_student_type();
        app.form('user_selection').set({student_type:student_type});
        app.form('user_selection').modal();
    });
    //end
    
    //put courses and calendar events onto student Google Calendar
    app.click('.post_courses',function(e) 
    { 
        if (banner_schedule === null){
            app.alert("You must select your options first.");
        }
        else{ //if we have fetched a banner_schedule, use that
            if (student_type == "inperson")
            {
                post_inperson_courses(banner_schedule, app.data.academic_calendar.calendar, term_string);
                post_inperson_calendar(app.data.academic_calendar.calendar, term_string);
            }
            else if (student_type == "online")
            {
                post_online_courses(banner_schedule); //doesnt require academic calendar or term string
                //as nothing from academic calendar would affect class reccurence (no days off during online sessions)
                
                post_online_calendar(app.data.academic_calendar_online, term_string, session_codes);
            }
        }
    });
    //end posting everything onto Google Calendar
};
