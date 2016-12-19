// ==UserScript==
// @name       Quick Rep
// @author xadamxk
// @namespace  https://github.com/xadamxk/HF-Scripts
// @version    1.0.1
// @description Makes giving reputation on HF easier.
// @require https://code.jquery.com/jquery-3.1.1.js
// @match      *://hackforums.net/showthread.php?tid=*
// @copyright  2016+
// @updateURL 
// @iconURL https://raw.githubusercontent.com/xadamxk/HF-Userscripts/master/scripticon.jpg
// ==/UserScript==
// ------------------------------ Change Log ----------------------------
// version 1.0.1: Bug fix for certain browsers
// version 1.0.0: Initial Release
// ------------------------------ Dev Notes -----------------------------
// Bugs?
// ------------------------------ SETTINGS ------------------------------
// Label for button (visible from /showthread.php?)
var repButtonLabel = "Rep"; // Default: "Rep")
// Enables/Disables basic form of quick rep
//      basicquickRep = true : Opens a new window for giving rep
//      basicquickRep = false : Integrates rep menu into post bit
var basicQuickRep = false; // (Default: false)
// Debug: Show console.log statements for debugging purposes
var debug = false; // (Default: false)
// ------------------------------ ON PAGE LOAD ------------------------------
var uidArray = [];
var my_key;
var my_uid;
var my_pid;
var my_rid;
var my_repOptions;
var my_comments;
var repIndex;
var ajaxSuccess = false;
var errorFound = false;

$("#posts .tborder").each(function (index, element) {
    // UID Array from postbit on /showthread.php
    uidArray[index] = parseInt($(element).children().children().siblings().children(1).children(1).children(2)
                               .children(2).children(3).children(7).children(1).children(1).attr('href').slice(53));
    $(element).find(".author_buttons").append($("<button>").text(repButtonLabel).attr("id", "repButton"+index).addClass("button"));
    // Standard Quick Rep
    if (basicQuickRep)
        $("body").on("click", "#repButton"+index, function() { 
            MyBB.reputation(uidArray[index]);
        });
    // Integrated Quick Rep
    else{
        $("body").on("click", "#repButton"+index, function() {
            // ajax call on button click
            $.ajax({
                url: "https://hackforums.net/reputation.php?action=add&uid="+uidArray[index], 
                cache: false,
                success: function(response) {
                    // Check for errors
                    // Rep Limit
                    if ($(response).find("blockquote").html() === undefined){
                        console.log("this browser is weird.");
                    }
                    else if ($(response).find("blockquote").html().includes("You have already given as many reputation ratings as you are allowed to for today")){
                        errorFound = true;
                        window.alert("You have already given as many reputation ratings as you are allowed to for today.");
                        return;
                    }
                    // Need upgrade
                    else if ($(response).find("blockquote").html().includes("You do not have permission to give reputation ratings to users")){
                        errorFound = true;
                        window.alert("You do not have permission to give reputation ratings to users.");
                        return;
                    }
                    // Self rep
                    else if ($(response).find("blockquote").html().includes("You cannot add to your own reputation")){
                        errorFound = true;
                        window.alert("You can't rep yourself dumb dumb :P");
                        return;
                    }
                    // Rep disabled
                    else if ($(response).find("blockquote").html().includes("You cannot add a reputation to users of this user group")){
                        errorFound = true;
                        window.alert("You cannot add a reputation to users of this user group.");
                        return;
                    }
                    else{
                        // Grab rep index
                        repIndex = $(response).find("#reputation :selected").index();
                        // Magical string of justice: $(response).children(3).children().children().children().children().siblings(6)
                        // Post Key
                        my_key = $(response).find('[name=my_post_key]').val();
                        // UID
                        my_uid = $(response).find('[name=uid]').val();
                        // PID
                        my_pid = $(response).find('[name=pid]').val();
                        // RID
                        my_rid = $(response).find('[name=rid]').val();
                        // Select vals
                        my_repOptions = $(response).children(3).children().children().children().children().siblings(6).children().siblings(7);
                        // Comments
                        my_comments = $(response).find('[name=comments]').val();
                        if (debug){
                            console.log("my_key: "+my_key);
                            console.log("my_uid: "+my_uid);
                            console.log("my_pid: "+my_pid);
                            console.log("my_rid: "+my_rid);
                            console.log("my_repOptions(below): "+my_repOptions);
                            console.log(my_repOptions);
                            console.log("my_comments: "+my_comments);
                        }
                        ajaxSuccess = true;
                    }
                    // Shouldn't run if error, but just incase...
                    if (!errorFound){
                        // Textbox doesn't exist yet 
                        if ($(element).find('[id=repComment'+index+']').length === 0){
                            $(element).find("#repButton"+index).after($("<input type='text'>").attr("id", "repComment"+index).val(my_comments)
                                                                      .css("padding","3px 6px")
                                                                      .css("text-shadow","1px 1px 0px #000;")
                                                                      .css("background-color","#072948")
                                                                      .css("margin-left", "5px")
                                                                      .css("width", "75%")
                                                                      .css("background", "white")
                                                                      .css("box-shadow", "0 1px 0 0 #0F5799")
                                                                      .css("font-family", "arial")
                                                                      .css("font-size", "14px")
                                                                      .css("border", "1px solid #000")
                                                                      .css("margin", "5px")
                                                                      .css("color", "black")); //.css("", "")
                        }
                        // Textbox already exists
                        else{
                            $(element).find("#repComment"+index).remove();
                        }
                        // Selectbox doesn't exist
                        if ($(element).find('[id=repSelect'+index+']').length === 0){
                            $(element).find("#repComment"+index).after($("<select>").attr("id", "repSelect"+index).css("margin-left", "5px").addClass("button"));
                            // Grab rep options from previous page
                            $(my_repOptions).each(function (subindex, subelement) {
                                $("#repSelect"+index).append( $('<option></option>').val($(subelement).val()).html($(subelement).text()));
                            });
                            // Set index
                            $("#repSelect"+index)[0].selectedIndex = repIndex;
                        }
                        // Selectbox already exists
                        else{
                            $(element).find("#repSelect"+index).remove();
                        }
                        // Post button doesn't exist
                        if ($(element).find('[id=repPost'+index+']').length === 0){
                            $(element).find("#repSelect"+index).after($("<button>").text("Rep User").attr("id", "repPost"+index).addClass("button"));
                            $("body").on("click", "#repPost"+index, function() {
                                $.post("/reputation.php",
                                       {
                                    "my_post_key": my_key,
                                    "action" : "do_add",
                                    "uid": my_uid,
                                    "pid": my_pid,
                                    "rid": my_rid,
                                    "reputation": $("#repSelect"+index).val(),
                                    "comments": $("#repComment"+index).val()
                                },
                                       function(data,status){
                                    // Success prompt of some kind
                                    window.location.href = "https://hackforums.net/"+$(element).find("strong a:eq(0)").attr('href');
                                    location.reload();
                                });
                            });
                        }
                        // Post button already exists
                        else{
                            $(element).find("#repPost"+index).remove();
                        }
                    } // no errors
                }// success
            }); // ajax
        }); // Rep Button onClick
    } // else
}); // each post