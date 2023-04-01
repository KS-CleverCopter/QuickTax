<?php
include('mysql.php');

if(isset($_REQUEST["fid"])) {
    $file_id = $_REQUEST['fid'];

    if ( is_numeric($file_id) ) { 

        $db = new db();
        $qry = "call delete_pdf_data(".$file_id.");";
        $delete = $db->query($qry);
        $affected_rows = $delete->affectedRows();
        $response['status'] = 'Success';
        //$response['message'] = $affected_rows.' file has been deleted';
        $db->close();

    } else {
        $response['status'] = 'Failed';
        $response['message'] = 'Invalid Request';
    }
} else { 
    $response['status'] = 'Failed';
    $response['message'] = 'Incomplete Request';
}
echo json_encode($response);
?>