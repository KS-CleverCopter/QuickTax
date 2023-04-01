<?php
include('mysql.php');

$res_json = [];
if ( !isset($_REQUEST['fid']) ) { 
    $res_json['status'] = 'Failed';
    $res_json['message'] = 'Invalid Request';
} else { 
    $file_id = $_REQUEST['fid'];
    $procedure = "call confirm_pdf_data(".$file_id.")";
    
    $db = new db();
    $db->query($procedure);
    $affected_rows = $db->affectedRows();

    $res_json['status'] = 'Success';
    $res_json['affected_rows'] = $affected_rows;
    $db->close();
}
echo json_encode($res_json);
?>