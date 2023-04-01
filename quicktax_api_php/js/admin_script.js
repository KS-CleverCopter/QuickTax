var dataSet = [];
var title = [];
var savedLatLng = "";
var domain = "";
var room_type_arr = {};
var url = {
    upload: domain + "upload.php",
    uploadStatus: domain + "view.php?req=pdf_status",
    tableData: domain + "tempData/dataTable.json",
    confirmParsedData: domain + "view.php?req=pdf_confirm&fid=",
    viewAllData: domain + "view.php?req=pdf_type1_main",
    type1: domain + "view.php?req=type1",
    type2: domain + "view.php?req=type2",
    pdfDataConfirm: domain + "pdf_confirm.php?fid",
    searchProperty: domain + "view.php?req=search",
    priceSubmit: domain + "final.php",
    deleteProcessingRequest: domain + "remFile.php",
    clearDB: domain + "clrdb.php"
};

$(document).ready(() => {
    init();
    if (sessionStorage.getItem('creds')) {
        submitCreds();
    }
});

function init() {
    if (window.location.pathname.split("/").pop() == 'client.html') {
        $(document).tooltip();
    }

    $(document).on("keyup", (evt) => {
        // closing popup on esc key
        if (evt.which == 27) {
            closePopup("key");
        }
    });

    if ($("#tabButton1").length > 0) {
        $("#tabButton1").trigger("click");
    }
    $(document).on("click", ".close", () => {
        $("#popupHolder").remove();
    });
}

function closePopup(key) {
    // closing only non modal popups on esc.
    if ($("#popupHolder").length > 0) {
        if (key) {
            if ($("#popupHolder").attr("modal")) {
                return;
            }
        }
        $("#popupHolder").remove();
    }
}

function openPopUp(html, type) {
    var existingHolder = document.getElementById("popupHolder");
    if (existingHolder) {
        existingHolder.remove();
    }
    var popupHolder = makeElement("div", {
        id: "popupHolder",
        class: "popupHolder",
    });
    if (type) {
        popupHolder.setAttribute("modal", "modal");
    }
    var popup = makeElement("div", { id: "popup", class: "popup" });

    var popupContent = makeElement("div", {
        id: "popupContent",
        class: "popupContent",
    });

    var close = makeElement("button", { id: "popup-close", class: "close" });

    popupHolder.appendChild(popup);

    // not showing close button when its a modal.
    if (!type) {
        popup.appendChild(close);
    }
    popup.appendChild(popupContent);
    popupContent.innerHTML = html;
    document.body.appendChild(popupHolder);
}

function uploadFile(event) {
    event.preventDefault();
    // Upload Form
    var fd = new FormData();
    $(event.target).attr("disabled");
    $("#fileUploadStatus").html("Uploading...");
    fd.append("fileToUpload", document.getElementById("fileToUpload").files[0]);
    fd.append("fileType", document.getElementById("fileType").value);
    $.ajax({
        url: this.url.upload,
        data: fd,
        processData: false,
        contentType: false,
        dataType: "json",
        type: "POST",
        success: function(data) {
            if (data.status && data.status.toLowerCase() == "success") {
                $("#fileUploadStatus").html("File Upload Success");
                $(event.target).removeAttr("disabled");
            } else {
                $("#fileUploadStatus").html(
                    "<span class='error' data-translate='FileUploadFailed'>File Upload Failed</span>"
                );
            }
            $("#data-table-container").show();

            // Get Upload Status
            printFileUploadStatus();
            updateLang();
        },
        error: () => {
            $(event.target).removeAttr("disabled");
            $("#fileUploadStatus").html(
                "<span class='error' data-translate='FileUploadFailed'>File Upload Failed</span>"
            );
            updateLang();
        },
    });
}

function cleardb() { 
    var pdf_type = $('#pdf_type_clr').val();
    if (confirm("Do you really want to Clear the Storage ?") == true) {
        sendData(url.clearDB, {ftype: pdf_type}, (resp) => {
            if (resp && resp.status && resp.status) {
                if (resp.status == "Success") {
                    printFileUploadStatus();
                    $("#verificationTable_wrapper").html(
                        "<h2 class='success-message'>Data successfully written to DB</h2>"
                    );
                } else {
                    $("#verificationTable_wrapper").html(
                        "<h2 class='success-message error'>Write failed</h2>"
                    );
                }
            }
           
        });
    } 
}

function printFileUploadStatus() {
    // Clearing the old data before refresh;
    $("#data-table-inner-container").html(
        "<table class='display' id='py-extract-table'></table>"
    );

    getData(url.uploadStatus, (resp) => {
        var headerArray = [];
        var parsedData = resp.data;
        for (var i = 0; i < parsedData.length; i++) {
            // Generating Headers.
            if (i == 0) {
                for (title in parsedData[0]) {
                    headerArray.push({ title: title, data: title });
                }
            }

            // Looking for Links
            if (
                parsedData[i].ParsingStatus == "Parsing done" &&
                parsedData[i].ConfirmStatus == "Yet To Confirm"
            ) {
                parsedData[i].ConfirmStatus =
                    "<button class='link-button' onclick=\"openVerificationData('" +
                    parsedData[i].FileId +
                    '\')" > <ion-icon name="alert"></ion-icon> Verify &amp; Confirm </button>' +
                    "<button class='link-button delete' onclick=\"deleteField('" +
                    parsedData[i].FileId +
                    '\')" > <ion-icon name="alert"></ion-icon> Delete </button>';
            } else if (
                parsedData[i].ConfirmStatus == "Yet To Confirm" &&
                parsedData[i].ParsingStatus != "In Progress"
            ) {
                parsedData[i].ConfirmStatus =
                    "<div class='make-flex space-between'>" +
                    parsedData[i].ConfirmStatus +
                    "<button class='link-button delete' onclick=\"deleteField('" +
                    parsedData[i].FileId +
                    '\')" > <ion-icon name="trash-outline"></ion-icon>Delete</button></div>';
            }
        }
        if (headerArray && headerArray.length > 0) {
            generateTable(headerArray, parsedData);
        }
    });
}

function deleteField(id) {
    sendData(this.url.deleteProcessingRequest, { fid: id }, (resp) => {
        if (resp.status == "Success") {
            alert("Successfully deleted");
            printFileUploadStatus();
        } else {
            alert("Failed to delete");
            console.error(resp);
        }
    });
}

function showLoading() {
    if (!document.getElementById("loading")) {
        var loading = makeElement("div", {
            id: "loading",
            class: "popup popupHolder",
        });
        loading.innerHTML = "Loading..";
        document.body.appendChild(loading);
    }
    $("#loading").fadeIn();
}

function hideLoading() {
    $("#loading").hide();
}

function prepareData4Table(data, tableID) {
    var parsedData = data;
    var headerArray = [];

    for (var i = 0; i < parsedData.length; i++) {
        // Generating Headers.
        if (i == 0) {
            for (title in parsedData[0]) {
                headerArray.push({ title: title, data: title });
            }
        }
    }
    generateTable(headerArray, parsedData, tableID);
}

function openVerificationData(file_id) {
    var url = this.url.confirmParsedData + file_id;
    getData(url, (resp) => {
        // Open popup and display data in apopup
        if (resp.status && resp.status == "Success") {

            warning_files = '';
            if (resp.hasOwnProperty("warning") && resp.warning.length > 0) {
                for (var i = 0; i < resp.warning.length; i++) {
                    warning_files += resp.warning[i].file_name+",";
                }
            }
            if (resp.hasOwnProperty("warning1") && resp.warning1.length > 0) {
                for (var j = 0; j < resp.warning1.length; j++) {
                    warning_files += resp.warning1[j].file_name+",";
                }
            }
            if ( warning_files != '' ) {
                warning_files = "Please check before confirming...Files "+warning_files.slice(0,-1)+" are having tickers of previous days !";
            }
            var popupTxt = '';
            openPopUp(
                `
                <div class='popupTableContainer'>
                    <table id='verificationTable'></table>
                </div>

                //Table Two
                <div class='popupTableContainer'>
                    <table id='verificationTable1'></table>
                </div>

                <div class='confirm-action'>
                        <button onclick="confirmData('${file_id}')">
                            <ion-icon name="checkmark-circle-outline"></ion-icon>ConfirmWriteToDB
                        </button>
                        <div style='color:red; font-size:1.5em'>${warning_files}
                        <!--button id="popup-close" class="close">
                            <ion-icon name="close-circle-outline"></ion-icon>Cancel
                        </button-->
                        </div>
                    </div>
                `
            );

            if (resp.hasOwnProperty("data") && resp.data.length > 0) {

                prepareData4Table(resp.data, "verificationTable");
            }

            if (resp.hasOwnProperty("data1") && resp.data1.length > 0) {
                prepareData4Table(resp.data1, "verificationTable1");
            }

            printFileUploadStatus();

        } else {
            openPopUp("<h2 class='error'>Parsing Error</h2>");
        }
    });
}

function showAllData() {
    var pdf_data = $('#pdf_data').val();
    $("#viewAllData").html("<table id='viewAllData-table'></table>");
    getData(url[pdf_data], (resp) => {
        var headerArray = [];
        var parsedData = resp.data;
        for (var i = 0; i < parsedData.length; i++) {
            // Generating Headers.
            if (i == 0) {
                for (title in parsedData[0]) {
                    headerArray.push({ title: title, data: title });
                }
            }
        }
        generateTable(headerArray, parsedData, "viewAllData-table");
    });
}

function confirmData(file_id) {
    sendData(url.pdfDataConfirm, { fid: file_id }, (resp) => {
        $("#verificationTable_wrapper").html(
            "<h2 class='success-message'>Data successfully written to DB</h2>"
        );
        $("#verificationTable1_wrapper").html("<h2 class='success-message'>Data successfully written to DB</h2>");
        // $("#verificationTable2_wrapper").html("<h2 class='success-message'>Data successfully written to DB</h2>");
        // $("#verificationTable3_wrapper").html("<h2 class='success-message'>Data successfully written to DB</h2>");
        $(".confirm-action").hide();
        if (resp && resp.status && resp.status) {
            if (resp.status == "Success") {
                printFileUploadStatus();
                $("#verificationTable_wrapper").html(
                    "<h2 class='success-message'>Data successfully written to DB</h2>"
                );
            } else {
                $("#verificationTable_wrapper").html(
                    "<h2 class='success-message error'>Write failed</h2>"
                );
            }
        }
        setTimeout(() => {
            printFileUploadStatus();
        }, 500);
    });
}

function applyStyle(el) {
    s = getComputedStyle(el);
    for (let key in s) {
        let prop = key.replace(/\-([a-z])/g, (v) => v[1].toUpperCase());
        el.style[prop] = s[key];
    }
}

function currencyFormat(val) {
    var formattedval = Number(val).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    return '$' + formattedval;
}

// Navigation
function backToUserForm() {
    $("#results").hide();
    $("#input-form").show();
}
// End of Navigation
// Utilities
function makeElement(type, attrs) {
    var elm = document.createElement(type);
    for (x in attrs) {
        if (x) {
            elm.setAttribute(x, attrs[x]);
        }
    }
    return elm;
}

function sendData(url, object, callback) {
    submitCreds();
    // openPopUp("<h2 class='make-flex'><?xml version=\"1.0\" encoding=\"utf-8\"?><svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" style=\"margin: auto; background-color: transparent; display: block; shape-rendering: auto; background-position: initial initial; background-repeat: initial initial;\" width=\"200px\" height=\"200px\" viewBox=\"0 0 100 100\" preserveAspectRatio=\"xMidYMid\"><path fill=\"none\" stroke=\"#93dbe9\" stroke-width=\"1\" stroke-dasharray=\"42.76482137044271 42.76482137044271\" d=\"M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40 C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z\" stroke-linecap=\"round\" style=\"transform:scale(0.6);transform-origin:50px 50px\"><animate attributeName=\"stroke-dashoffset\" repeatCount=\"indefinite\" dur=\"3.125s\" keyTimes=\"0;1\" values=\"0;256.58892822265625\"></animate></path></h2>", "modal");
    $.ajax({
        type: "POST",
        url: url,
        data: object,
        dataType: "json",
        timeout: 30000,
        success: (resp) => {
            updateLang();
            callback.call(this, resp);
        },
        error: (resp) => {
            updateLang();
            callback.call(this, resp);
        },
    });
}

function getData(url, callBack) {
    // openPopUp("<h2 class='make-flex'><?xml version=\"1.0\" encoding=\"utf-8\"?><svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" style=\"margin: auto; background-color: transparent; display: block; shape-rendering: auto; background-position: initial initial; background-repeat: initial initial;\" width=\"200px\" height=\"200px\" viewBox=\"0 0 100 100\" preserveAspectRatio=\"xMidYMid\"><path fill=\"none\" stroke=\"#93dbe9\" stroke-width=\"1\" stroke-dasharray=\"42.76482137044271 42.76482137044271\" d=\"M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40 C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z\" stroke-linecap=\"round\" style=\"transform:scale(0.6);transform-origin:50px 50px\"><animate attributeName=\"stroke-dashoffset\" repeatCount=\"indefinite\" dur=\"3.125s\" keyTimes=\"0;1\" values=\"0;256.58892822265625\"></animate></path></h2>", "modal");
    submitCreds();
    $.getJSON(url, (resp) => {
        // updateLang();
        callBack.call(this, resp);
    });
}

function generateTable(headerArray, dat, id) {
    // Rooms
    var data = dat;
    // for (var i = 0; i < data.length; i++) {
    //     for (var x in data[i]) {
    //         if (x) {
    //             if (x == "Rooms") {
    //                 var rooms = "";
    //                 var roomsJSON = JSON.parse(data[i][x]);
    //                 for (r in roomsJSON) {
    //                     if (r) {
    //                         rooms +=
    //                             "<div class='room-holder'><div class='room-title'>" +
    //                             r +
    //                             "</div><div class='room-value'>" +
    //                             roomsJSON[r] +
    //                             "</div></div>";
    //                     }
    //                 }
    //                 data[i][x] =
    //                     "<div class='client-rooms-row make-flex'>" + rooms + "</div>";
    //             }
    //         }
    //     }
    // }
    var id = id || "py-extract-table";
    var table = $("#" + id).DataTable({
        data: data,
        // "scrollX": true,
        columns: headerArray,
        "autoWidth": true,
        dom: 'Blfrtip',
        buttons: [
            'copy', 'csv', 'excel'
        ],
        "lengthMenu": [
            [25, 50, 100, -1],
            [25, 50, 100, "All"]
        ]
    });
    table.columns.adjust().draw();

    $('#' + id + ' thead tr').clone(true).appendTo('#' + id + ' thead');
    $('#' + id + ' thead tr:eq(1) th').each(function(i) {
        var title = $(this).text();
        $(this).html('<input type="text" placeholder="Search ' + title + '" />');

        $('input', this).on('keyup change', function() {
            if (table.column(i).search() !== this.value) {
                table
                    .column(i)
                    .search(this.value)
                    .draw();
            }
        });
    });


}

function tab(tabIndex, evt) {
    $(".selected").removeClass("selected");
    $(evt.target).addClass("selected");
    $(".tab-content").hide();
    $("#tab" + tabIndex).show();

    if (tabIndex == 2) {
        showAllData();
    } else {
        printFileUploadStatus();
    }
}


function getNum(val) {
    return (val != '' ? parseFloat(val) : 0);
}


function submitCreds(evt) {
    var value = {
        'uname': $('#username').val(),
        'pwd': $('#password').val()
    }
    var sCreds = sessionStorage.getItem('creds');
    if (sCreds) {
        var decrypted = decodeURIComponent(escape(window.atob(sCreds)));
        value = JSON.parse(decrypted);
    }

    var url = "view.php?req=auth";
    $.ajax({
        type: "POST",
        url: url,
        data: value,
        dataType: "json",
        timeout: 30000,
        success: (resp) => {
            if (resp.data[0].auth) {
                $('.py-extract-admin').show();
                $('.authenticationForm').hide();
                sessionStorage.setItem('creds', btoa(unescape(encodeURIComponent(JSON.stringify(value)))));
            } else {
                $('.authenticationForm').show();
                $('.py-extract-admin').hide();
                alert("authentication failed");
            }
        },
        error: (resp) => {

        },
    });
    if (evt) {
        evt.preventDefault();
    }
}


// End of utilities