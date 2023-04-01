<?php
include('mysql.php');

$res_json = [];
if ( !isset($_REQUEST['ftype']) ) { 
    $res_json['status'] = 'Failed';
    $res_json['message'] = 'Invalid Request';
} else { 
    $file_id = $_REQUEST['ftype'];
    $procedure = "call clear_quicktax_db(".$file_id.")";
    
    $db = new db();
    $db->query($procedure);
    $affected_rows = $db->affectedRows();

    $res_json['status'] = 'Success';
    $db->close();
}
echo json_encode($res_json);
?>